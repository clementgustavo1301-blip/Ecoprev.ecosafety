require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DIRECT_URL });

async function setup() {
  try {
    await client.connect();
    console.log('Connected to database...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "_keepalive" (
        id SERIAL PRIMARY KEY,
        payload TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE OR REPLACE FUNCTION do_keepalive_ping()
      RETURNS json
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        new_id integer;
      BEGIN
        -- Insere exatamente 1KB (1024 bytes) de payload
        INSERT INTO "_keepalive" (payload) VALUES (repeat('K', 1024)) RETURNING id INTO new_id;
        
        -- Remove registros anteriores para não consumir armazenamento
        DELETE FROM "_keepalive" WHERE id <> new_id;
        
        RETURN json_build_object('success', true, 'inserted_id', new_id, 'size_bytes', 1024);
      END;
      $$;
    `);

    console.log('Created _keepalive table and function do_keepalive_ping()');

    const testRes = await client.query('SELECT do_keepalive_ping();');
    console.log('Ping execution result:', testRes.rows[0].do_keepalive_ping);

  } catch (error) {
    console.error('Error during keepalive setup:', error);
  } finally {
    await client.end();
  }
}

setup();
