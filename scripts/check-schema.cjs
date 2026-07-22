const supabaseUrl = 'https://tddhwnbnodrmwlzkgeno.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGh3bmJub2RybXdsemtnZW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY3NjU0NywiZXhwIjoyMTAwMjUyNTQ3fQ.sdox0MZNdHzWNPTmeAdOwCyI6dagF7Vln9iwhB1aN6I';

const SQL = `
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_color text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reviews integer DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS puff_count integer;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS box_price numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS box_discount_percent numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS detailed_description text;
`;

async function tryEndpoint(path, method = 'POST') {
  try {
    const resp = await fetch(`${supabaseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
      },
      body: JSON.stringify({ query: SQL }),
    });
    const text = await resp.text();
    console.log(`  ${method} ${path} => ${resp.status}: ${text.substring(0, 200)}`);
    return resp.status;
  } catch (e) {
    console.log(`  ${method} ${path} => ERRO: ${e.message}`);
    return null;
  }
}

async function run() {
  console.log('Testando endpoints SQL...\n');
  await tryEndpoint('/sql');
  await tryEndpoint('/rest/v1/sql');
  await tryEndpoint('/sql', 'GET');

  // Try the PostgREST format
  console.log('\nTestando RPC exec_sql...');
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  // First try to create exec_sql function
  const createFnSQL = `
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void AS $$
BEGIN
  EXECUTE query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

  const { error: fnErr } = await supabase.rpc('exec_sql', { query: 'SELECT 1' });
  console.log('  exec_sql exists?', fnErr ? 'NO: ' + fnErr.message : 'YES');

  // Try raw postgres connection
  console.log('\nTentando conexao direta com o banco...');
  try {
    const pg = require('pg');
    const client = new pg.Client({
      connectionString: `postgresql://postgres:tddhwnbnodrmwlzkgeno:Jpedr%402006@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const result = await client.query(SQL);
    console.log('  SQL executado com sucesso via pg!');
    await client.end();
  } catch (e) {
    console.log('  pg failed:', e.message.substring(0, 200));
  }
}

run().catch(console.error);
