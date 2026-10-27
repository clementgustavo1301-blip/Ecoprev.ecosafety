require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const reports = await pool.query('SELECT "caseId", "finalContent", "createdAt" FROM "Report" ORDER BY "createdAt" DESC LIMIT 5');
  console.log('Recent Reports:', JSON.stringify(reports.rows, null, 2));
  pool.end();
}

main();
