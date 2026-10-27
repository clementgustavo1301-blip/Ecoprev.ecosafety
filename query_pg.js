require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  await pool.query('UPDATE "Case" SET status = \'PENDING_REVIEW\' WHERE status = \'PROCESSING_AI\'');
  console.log('Updated back to PENDING_REVIEW!');
  pool.end();
}

main();
