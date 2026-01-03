const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'avail_user',
  password: process.env.DB_PASSWORD || 'avail_pass',
  database: process.env.DB_NAME || 'availability_db',
});

async function migrate() {
  try {
    console.log('Running availability service migrations...');

    // Create staff table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id SERIAL PRIMARY KEY,
        salon_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        specialization VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create schedules table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_available BOOLEAN DEFAULT true,
        UNIQUE(staff_id, day_of_week)
      );
    `);

    // Create time_slots table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS time_slots (
        id SERIAL PRIMARY KEY,
        salon_id INTEGER NOT NULL,
        staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
        service_id INTEGER NOT NULL,
        slot_date DATE NOT NULL,
        slot_time TIME NOT NULL,
        duration_minutes INTEGER NOT NULL,
        is_available BOOLEAN DEFAULT true,
        is_booked BOOLEAN DEFAULT false,
        booking_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(salon_id, staff_id, service_id, slot_date, slot_time)
      );
    `);

    // Create slot_locks table for concurrency control
    await pool.query(`
      CREATE TABLE IF NOT EXISTS slot_locks (
        id SERIAL PRIMARY KEY,
        slot_id INTEGER REFERENCES time_slots(id) ON DELETE CASCADE,
        locked_by VARCHAR(255) NOT NULL,
        locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        UNIQUE(slot_id)
      );
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_staff_salon_id ON staff(salon_id);
      CREATE INDEX IF NOT EXISTS idx_schedules_staff_id ON schedules(staff_id);
      CREATE INDEX IF NOT EXISTS idx_time_slots_salon_date ON time_slots(salon_id, slot_date);
      CREATE INDEX IF NOT EXISTS idx_time_slots_available ON time_slots(salon_id, slot_date, is_available, is_booked);
      CREATE INDEX IF NOT EXISTS idx_slot_locks_expires ON slot_locks(expires_at);
    `);

    console.log('✅ Availability service migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();

