require('dotenv').config();
const { Client } = require('pg');

async function ping() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query('SELECT do_keepalive_ping();');
    console.log('[Ping OK]', new Date().toISOString(), res.rows[0].do_keepalive_ping);
  } catch (err) {
    console.error('[Ping Error]', err.message);
  } finally {
    await client.end();
  }
}

ping();
