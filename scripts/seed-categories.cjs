const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://tddhwnbnodrmwlzkgeno.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGh3bmJub2RybXdsemtnZW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY3NjU0NywiZXhwIjoyMTAwMjUyNTQ3fQ.sdox0MZNdHzWNPTmeAdOwCyI6dagF7Vln9iwhB1aN6I';
const supabase = createClient(supabaseUrl, supabaseKey);

const CATEGORIES = [
  { name: 'AiRMEZ', icon: '💨', is_active: true },
  { name: 'Black Sheep', icon: '🐑', is_active: true },
  { name: 'BLVK Unicorn', icon: '🦄', is_active: true },
  { name: 'Chilly Beats', icon: '🎵', is_active: true },
  { name: 'Dinner Lady', icon: '🍽️', is_active: true },
  { name: 'EBCREATE', icon: '⚡', is_active: true },
  { name: 'ELF BAR', icon: '🧝', is_active: true },
  { name: 'Geek Bar', icon: '🤓', is_active: true },
  { name: 'Ignite', icon: '🔥', is_active: true },
  { name: 'Life Pod', icon: '🫧', is_active: true },
  { name: 'Lost Mary', icon: '👻', is_active: true },
  { name: 'NIKBAR', icon: '💎', is_active: true },
  { name: 'OxBar', icon: '🐂', is_active: true },
  { name: 'Sex Addict', icon: '💋', is_active: true },
];

async function seed() {
  console.log('=== SEED: Adicionando categorias ===\n');

  let added = 0, skipped = 0;

  for (const cat of CATEGORIES) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('name', cat.name)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`  ⏭ ${cat.icon} ${cat.name} - já existe`);
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from('categories')
      .insert([cat]);

    if (error) {
      console.log(`  ❌ ${cat.icon} ${cat.name} - ERRO: ${error.message}`);
    } else {
      console.log(`  ✅ ${cat.icon} ${cat.name}`);
      added++;
    }
  }

  console.log(`\nAdicionados: ${added} | Já existiam: ${skipped}`);

  const { data: all } = await supabase.from('categories').select('*').order('name');
  console.log(`\nTotal: ${all?.length || 0} categorias`);
  all?.forEach(c => console.log(`  ${c.icon || '📦'} ${c.name}`));
}

seed().catch(console.error);
