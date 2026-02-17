const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'delivery_partner_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function initializeDatabase() {
    const client = await pool.connect();

    try {
        console.log('🔄 Initializing database...');

        // Read and execute schema
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        await client.query(schema);
        console.log('✓ Database schema created successfully');

        // Ask if user wants to load seed data
        console.log('\n📝 To load sample data, run: node scripts/seedDatabase.js');

        console.log('\n✅ Database initialization complete!');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

initializeDatabase();
