const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, getClient } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/jobs/available
 * Get list of available jobs (not assigned to anyone)
 */
router.get('/available', async (req, res, next) => {
    try {
        const result = await query(
            `SELECT id, order_number, customer_name, customer_phone,
      pickup_address, pickup_latitude, pickup_longitude,
      dropoff_address, dropoff_latitude, dropoff_longitude,
      distance_km, payment_amount, items_description, special_instructions,
      status, created_at
      FROM delivery_jobs
      WHERE status = 'available'
      ORDER BY created_at DESC`,
            []
        );

        res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/jobs/active
 * Get partner's currently active job
 */
router.get('/active', async (req, res, next) => {
    try {
        const result = await query(
            `SELECT id, order_number, customer_name, customer_phone,
      pickup_address, pickup_latitude, pickup_longitude,
      pickup_contact_name, pickup_contact_phone,
      dropoff_address, dropoff_latitude, dropoff_longitude,
      distance_km, payment_amount, items_description, special_instructions,
      status, assigned_at, picked_up_at, created_at
      FROM delivery_jobs
      WHERE partner_id = $1 AND status IN ('assigned', 'picked_up', 'in_transit')
      ORDER BY assigned_at DESC
      LIMIT 1`,
            [req.user.id]
        );

        res.json({
            success: true,
            data: result.rows[0] || null,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/jobs/history
 * Get partner's completed job history
 */
router.get('/history', async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const result = await query(
            `SELECT id, order_number, customer_name,
      pickup_address, dropoff_address,
      distance_km, payment_amount,
      status, assigned_at, picked_up_at, delivered_at
      FROM delivery_jobs
      WHERE partner_id = $1 AND status IN ('delivered', 'cancelled')
      ORDER BY delivered_at DESC
      LIMIT $2 OFFSET $3`,
            [req.user.id, limit, offset]
        );

        res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/jobs/:id/accept
 * Accept an available job
 */
router.post('/:id/accept', async (req, res, next) => {
    const client = await getClient();

    try {
        await client.query('BEGIN');

        const jobId = parseInt(req.params.id);

        // Check if partner already has an active job
        const activeJobCheck = await client.query(
            `SELECT id FROM delivery_jobs 
      WHERE partner_id = $1 AND status IN ('assigned', 'picked_up', 'in_transit')`,
            [req.user.id]
        );

        if (activeJobCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'You already have an active delivery',
            });
        }

        // Try to assign the job (check if still available)
        const result = await client.query(
            `UPDATE delivery_jobs 
      SET partner_id = $1, status = 'assigned', assigned_at = NOW()
      WHERE id = $2 AND status = 'available'
      RETURNING id, order_number, customer_name, customer_phone,
      pickup_address, pickup_latitude, pickup_longitude,
      pickup_contact_name, pickup_contact_phone,
      dropoff_address, dropoff_latitude, dropoff_longitude,
      distance_km, payment_amount, items_description, special_instructions,
      status, assigned_at`,
            [req.user.id, jobId]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                success: false,
                message: 'Job is no longer available',
            });
        }

        // Update partner status to busy
        await client.query(
            'UPDATE delivery_partners SET status = $1 WHERE id = $2',
            ['busy', req.user.id]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Job accepted successfully',
            data: result.rows[0],
        });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
});

/**
 * PUT /api/jobs/:id/status
 * Update job status (picked_up, in_transit, delivered)
 */
router.put(
    '/:id/status',
    [body('status').isIn(['picked_up', 'in_transit', 'delivered'])],
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status',
                    errors: errors.array(),
                });
            }

            const jobId = parseInt(req.params.id);
            const { status } = req.body;

            // Determine which timestamp field to update
            let timestampField = '';
            if (status === 'picked_up') timestampField = 'picked_up_at';
            else if (status === 'delivered') timestampField = 'delivered_at';

            const timestampUpdate = timestampField ? `, ${timestampField} = NOW()` : '';

            const result = await query(
                `UPDATE delivery_jobs 
        SET status = $1 ${timestampUpdate}
        WHERE id = $2 AND partner_id = $3
        RETURNING id, order_number, status, ${timestampField || 'updated_at'}`,
                [status, jobId, req.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Job not found or not assigned to you',
                });
            }

            // If delivered, update partner status back to online
            if (status === 'delivered') {
                await query(
                    'UPDATE delivery_partners SET status = $1, total_deliveries = total_deliveries + 1 WHERE id = $2',
                    ['online', req.user.id]
                );
            }

            res.json({
                success: true,
                message: 'Job status updated successfully',
                data: result.rows[0],
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/jobs/:id/location
 * Add GPS tracking point during delivery
 */
router.post(
    '/:id/location',
    [
        body('latitude').isFloat({ min: -90, max: 90 }),
        body('longitude').isFloat({ min: -180, max: 180 }),
        body('accuracy').optional().isFloat(),
        body('speed').optional().isFloat(),
        body('heading').optional().isFloat(),
    ],
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid location data',
                    errors: errors.array(),
                });
            }

            const jobId = parseInt(req.params.id);
            const { latitude, longitude, accuracy, speed, heading } = req.body;

            // Verify job belongs to partner
            const jobCheck = await query(
                'SELECT id FROM delivery_jobs WHERE id = $1 AND partner_id = $2',
                [jobId, req.user.id]
            );

            if (jobCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Job not found or not assigned to you',
                });
            }

            // Insert tracking point
            await query(
                `INSERT INTO job_tracking 
        (job_id, partner_id, latitude, longitude, accuracy, speed, heading)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [jobId, req.user.id, latitude, longitude, accuracy || null, speed || null, heading || null]
            );

            res.json({
                success: true,
                message: 'Location tracked successfully',
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/jobs/:id/proof
 * Submit proof of delivery
 */
router.post(
    '/:id/proof',
    [
        body('photoUrl').optional().isURL(),
        body('signatureData').optional().notEmpty(),
        body('recipientName').optional().trim(),
        body('notes').optional().trim(),
        body('latitude').optional().isFloat({ min: -90, max: 90 }),
        body('longitude').optional().isFloat({ min: -180, max: 180 }),
    ],
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
            }

            const jobId = parseInt(req.params.id);
            const { photoUrl, signatureData, recipientName, notes, latitude, longitude } = req.body;

            // Verify job belongs to partner and is in correct status
            const jobCheck = await query(
                'SELECT id, status FROM delivery_jobs WHERE id = $1 AND partner_id = $2',
                [jobId, req.user.id]
            );

            if (jobCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Job not found or not assigned to you',
                });
            }

            if (jobCheck.rows[0].status === 'delivered') {
                return res.status(400).json({
                    success: false,
                    message: 'Proof already submitted for this job',
                });
            }

            // Insert proof of delivery
            const result = await query(
                `INSERT INTO proof_of_delivery 
        (job_id, partner_id, photo_url, signature_data, recipient_name, notes, delivery_latitude, delivery_longitude)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, created_at`,
                [
                    jobId,
                    req.user.id,
                    photoUrl || null,
                    signatureData || null,
                    recipientName || null,
                    notes || null,
                    latitude || null,
                    longitude || null,
                ]
            );

            res.json({
                success: true,
                message: 'Proof of delivery submitted successfully',
                data: result.rows[0],
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
