const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://tddhwnbnodrmwlzkgeno.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGh3bmJub2RybXdsemtnZW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY3NjU0NywiZXhwIjoyMTAwMjUyNTQ3fQ.sdox0MZNdHzWNPTmeAdOwCyI6dagF7Vln9iwhB1aN6I';
const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES = [
  'products',
  'categories',
  'flavors',
  'product_flavors',
  'pedidos',
  'usuarios',
  'store_settings',
  'physical_stores',
  'carousel_slides',
  'testimonials',
  'promotion_banner_settings',
  'payment_gateways',
  'site_config',
  'config_status_tempo',
  'pedido_trajeto_personalizado',
  'order_timings',
  'status_historico',
];

const backupDir = path.join(__dirname, '..', 'backups');

async function backupTable(tableName) {
  const rows = [];
  let offset = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error(`  [ERRO] ${tableName}: ${error.message}`);
      return null;
    }

    if (data && data.length > 0) {
      rows.push(...data);
      offset += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  return rows;
}

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const folder = path.join(backupDir, `backup_${timestamp}`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  fs.mkdirSync(folder, { recursive: true });

  console.log(`\n=== BACKUP DO SUPABASE ===`);
  console.log(`Pasta: ${folder}\n`);

  const summary = {};

  for (const table of TABLES) {
    process.stdout.write(`  ${table}... `);
    const rows = await backupTable(table);
    if (rows !== null) {
      const filePath = path.join(folder, `${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(rows, null, 2), 'utf8');
      summary[table] = rows.length;
      console.log(`${rows.length} registros`);
    }
  }

  // Salvar resumo
  const summaryPath = path.join(folder, '_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    tables: summary,
    totalRecords: Object.values(summary).reduce((a, b) => a + b, 0),
  }, null, 2), 'utf8');

  console.log(`\n=== RESUMO ===`);
  for (const [table, count] of Object.entries(summary)) {
    console.log(`  ${table}: ${count} registros`);
  }
  console.log(`\nTotal: ${Object.values(summary).reduce((a, b) => a + b, 0)} registros`);
  console.log(`\nBackup salvo em: ${folder}`);
}

runBackup().catch(console.error);
