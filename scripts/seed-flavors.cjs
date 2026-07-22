const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://tddhwnbnodrmwlzkgeno.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGh3bmJub2RybXdsemtnZW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY3NjU0NywiZXhwIjoyMTAwMjUyNTQ3fQ.sdox0MZNdHzWNPTmeAdOwCyI6dagF7Vln9iwhB1aN6I';
const supabase = createClient(supabaseUrl, supabaseKey);

const FLAVORS = [
  // 🍓 Frutados e Cítricos
  { name: 'Melancia', emoji: '🍉', category: 'Frutados' },
  { name: 'Manga', emoji: '🥭', category: 'Frutados' },
  { name: 'Uva', emoji: '🍇', category: 'Frutados' },
  { name: 'Morangos com Banana', emoji: '🍓🍌', category: 'Frutados' },
  { name: 'Limão com Menta', emoji: '🍋🌿', category: 'Frutados' },
  { name: 'Maçã Verde com Pêssego', emoji: '🍏🍑', category: 'Frutados' },
  { name: 'Cereja com Limão', emoji: '🍒🍋', category: 'Frutados' },
  { name: 'Kiwi com Maracujá e Goiaba', emoji: '🥝 Passion Fruit', category: 'Frutados' },

  // ❄️ Menta e Ice
  { name: 'Cool Mint', emoji: '❄️', category: 'Menta' },
  { name: 'Mirtilo com Menta', emoji: '🫐🌿', category: 'Menta' },
  { name: 'Berry Blast', emoji: '🫐🍓', category: 'Menta' },

  // 🍰 Sobremesas e Doces
  { name: 'Algodão Doce', emoji: '🍭', category: 'Doces' },
  { name: 'Vanilla Custard', emoji: '🍦', category: 'Doces' },
  { name: 'Sorvete de Morango', emoji: '🍨', category: 'Doces' },
  { name: 'Cheesecake de Morango', emoji: '🍰', category: 'Doces' },

  // 🍹 Bebidas e Exóticos
  { name: 'Pink Lemonade', emoji: '🍹', category: 'Exoticos' },
  { name: 'Energy Drink', emoji: '⚡', category: 'Exoticos' },
];

async function seedFlavors() {
  console.log('=== SEED: Adicionando sabores ===\n');

  // Primeiro, limpar sabores existentes (opcional - comente se quiser manter)
  // await supabase.from('flavors').delete().neq('id', 0);

  let added = 0;
  let skipped = 0;

  for (const flavor of FLAVORS) {
    // Verificar se já existe
    const { data: existing } = await supabase
      .from('flavors')
      .select('id')
      .eq('name', flavor.name)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`  ⏭ ${flavor.emoji} ${flavor.name} - já existe`);
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from('flavors')
      .insert([{
        name: flavor.name,
        emoji: flavor.emoji,
        is_active: true
      }]);

    if (error) {
      console.log(`  ❌ ${flavor.emoji} ${flavor.name} - ERRO: ${error.message}`);
    } else {
      console.log(`  ✅ ${flavor.emoji} ${flavor.name}`);
      added++;
    }
  }

  console.log(`\n=== RESUMO ===`);
  console.log(`Adicionados: ${added}`);
  console.log(`Já existiam: ${skipped}`);
  console.log(`Total: ${added + skipped}`);

  // Listar todos os sabores
  console.log('\n=== TODOS OS SABORES ===');
  const { data: allFlavors } = await supabase
    .from('flavors')
    .select('*')
    .order('name');

  if (allFlavors) {
    allFlavors.forEach(f => {
      console.log(`  ${f.emoji || '🏷'} ${f.name} (ativo: ${f.is_active})`);
    });
    console.log(`\nTotal: ${allFlavors.length} sabores`);
  }
}

seedFlavors().catch(console.error);
