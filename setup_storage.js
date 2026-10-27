const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

async function setupStorage() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL, // use direct url for DDL
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    // Create bucket if it doesn't exist
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('documents', 'documents', true)
      ON CONFLICT (id) DO UPDATE SET public = true;
    `);
    console.log('Bucket "documents" created or updated to public.');

    // Drop existing policies just in case
    await client.query(`DROP POLICY IF EXISTS "Public Access" ON storage.objects;`);
    
    // Create policy to allow all operations (for MVP/testing)
    await client.query(`
      CREATE POLICY "Public Access" ON storage.objects 
      FOR ALL 
      USING (bucket_id = 'documents')
      WITH CHECK (bucket_id = 'documents');
    `);
    console.log('Storage policies applied.');

  } catch (error) {
    console.error('Error setting up storage:', error);
  } finally {
    await client.end();
  }
}

setupStorage();
