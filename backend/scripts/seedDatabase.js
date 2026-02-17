const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'delivery_partner_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function seedDatabase() {
    const client = await pool.connect();

    try {
        console.log('🌱 Seeding database with sample data...');

        // Create sample delivery partners with properly hashed passwords
        const passwordHash = await bcrypt.hash('password123', 10);

        await client.query(`
      INSERT INTO delivery_partners (email, password_hash, full_name, phone, vehicle_type, vehicle_number, status) VALUES
      ('john.doe@example.com', $1, 'John Doe', '+1234567890', 'Motorcycle', 'ABC-1234', 'online'),
      ('jane.smith@example.com', $1, 'Jane Smith', '+1234567891', 'Car', 'XYZ-5678', 'offline'),
      ('mike.wilson@example.com', $1, 'Mike Wilson', '+1234567892', 'Motorcycle', 'DEF-9012', 'online')
      ON CONFLICT (email) DO NOTHING
    `, [passwordHash]);

        console.log('✓ Sample delivery partners created');
        console.log('  Email: john.doe@example.com | Password: password123');
        console.log('  Email: jane.smith@example.com | Password: password123');
        console.log('  Email: mike.wilson@example.com | Password: password123');

        // Create sample jobs
        await client.query(`
      INSERT INTO delivery_jobs (
        order_number, customer_name, customer_phone,
        pickup_address, pickup_latitude, pickup_longitude, pickup_contact_name, pickup_contact_phone,
        dropoff_address, dropoff_latitude, dropoff_longitude,
        distance_km, payment_amount, items_description, special_instructions, status
      ) VALUES
      (
        'ORD-2024-001', 'Alice Johnson', '+1234567893',
        '123 Main St, Downtown', 40.7128, -74.0060, 'Auto Parts Store', '+1234567894',
        '456 Oak Ave, Uptown', 40.7589, -73.9851,
        8.5, 15.00, 'Brake pads and oil filter', 'Handle with care', 'available'
      ),
      (
        'ORD-2024-002', 'Bob Martinez', '+1234567895',
        '789 Elm St, Midtown', 40.7489, -73.9680, 'Warehouse A', '+1234567896',
        '321 Pine Rd, Suburb', 40.7831, -73.9712,
        12.3, 22.50, 'Engine parts - fragile', 'Call customer on arrival', 'available'
      ),
      (
        'ORD-2024-003', 'Carol Davis', '+1234567897',
        '555 Market St, Business District', 40.7614, -73.9776, 'Parts Depot', '+1234567898',
        '888 River Rd, Riverside', 40.7282, -74.0776,
        6.2, 12.00, 'Windshield wipers and battery', NULL, 'available'
      )
      ON CONFLICT (order_number) DO NOTHING
    `);

        console.log('✓ Sample delivery jobs created');
        console.log('\n✅ Database seeding complete!');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

seedDatabase();
