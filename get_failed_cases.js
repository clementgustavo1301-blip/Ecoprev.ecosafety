require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const res = await pool.query('SELECT c.id, c."patientName", c.anamnesis, r."finalContent", r.id as report_id FROM "Case" c JOIN "Report" r ON c.id = r."caseId" WHERE r."finalContent" LIKE \'%Falha na geração da IA%\' ORDER BY c."createdAt" DESC LIMIT 5');
  console.log(JSON.stringify(res.rows, null, 2));
  pool.end();
}
main();
