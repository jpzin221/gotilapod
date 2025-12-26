import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://fkstktohbnwsnzbarujc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrc3RrdG9oYm53c256YmFydWpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDI1NjMsImV4cCI6MjA3NzU3ODU2M30.rN3BfRwWeE9Pjf70S8uneSgngYHGPz75FtfqzQfDq6o';

const supabase = createClient(supabaseUrl, supabaseKey);

// Filtrar produtos de vape
function isVapeProduct(name, description) {
  const text = `${name} ${description}`.toLowerCase();
  
  // Excluir produtos não relacionados
  if (text.includes('jbl') || text.includes('fone') || text.includes('caixa de som') ||
      text.includes('speaker') || text.includes('partybox') || text.includes('sennheiser') ||
      text.includes('headset') || text.includes('arandela') || text.includes('bluetooth') && !text.includes('pod')) {
    return false;
  }
  
  // Incluir apenas produtos de vape
  return text.includes('ignite') || text.includes('geek bar') || text.includes('lost mary') ||
         text.includes('elf bar') || text.includes('pod') || text.includes('vape') ||
         text.match(/\d+\.?\d*\s*puffs?/i);
}

// Determinar categoria
function getCategory(name, description) {
  const text = `${name} ${description}`.toLowerCase();
  
  if (text.includes('geek bar') || text.includes('geekbar')) return 'GEEK BAR';
  if (text.includes('lost mary')) return 'LOST MARY';
  if (text.includes('elf bar') || text.includes('elfbar')) return 'ELF BAR';
  if (text.includes('ignite')) return 'IGNITE';
  if (text.includes('pod')) return 'PODS';
  
  return 'PODS';
}

// Extrair quantidade de puffs
function getPuffs(name, description) {
  const text = `${name} ${description}`;
  
  // Procurar por padrões como "30.000 puffs", "30000 puffs", "30K"
  const patterns = [
    /(\d+)\.(\d{3})\s*puffs?/i,  // 30.000 puffs
    /(\d+),(\d{3})\s*puffs?/i,   // 30,000 puffs
    /(\d+)k\s*puffs?/i,          // 30k puffs
    /(\d{5,})\s*puffs?/i         // 30000 puffs
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let num;
      if (match[2]) {
        num = parseInt(match[1] + match[2]);
      } else if (pattern.source.includes('k')) {
        num = parseInt(match[1]) * 1000;
      } else {
        num = parseInt(match[1]);
      }
      return `${num.toLocaleString('pt-BR')} puffs`;
    }
  }
  
  return 'Consulte descrição';
}

// Determinar preço baseado em categoria e puffs
function getPrice(category, puffs) {
  // Preços por quantidade de puffs
  if (puffs.includes('40.000')) return 130.00;
  if (puffs.includes('30.000')) return 120.00;
  if (puffs.includes('25.000')) return 115.00;
  if (puffs.includes('20.000')) return 95.00;
  if (puffs.includes('18.000')) return 92.00;
  if (puffs.includes('15.000')) return 90.00;
  if (puffs.includes('12.000')) return 85.00;
  if (puffs.includes('10.000')) return 85.00;
  if (puffs.includes('8.500') || puffs.includes('8.000')) return 80.00;
  if (puffs.includes('6.000')) return 75.00;
  if (puffs.includes('5.000')) return 85.00;
  
  // Preços por categoria
  if (category === 'GEEK BAR') return 110.00;
  if (category === 'LOST MARY') return 95.00;
  if (category === 'ELF BAR') return 75.00;
  if (category === 'IGNITE') return 85.00;
  
  return 65.00;
}

// Determinar badge
function getBadge(puffs, name) {
  const text = name.toLowerCase();
  
  if (puffs.includes('40.000') || puffs.includes('30.000') || puffs.includes('25.000')) {
    return { badge: 'PREMIUM', badge_color: 'gold' };
  }
  if (text.includes('novo') || text.includes('v400') || text.includes('v250') || text.includes('te30k')) {
    return { badge: 'NOVO', badge_color: 'purple' };
  }
  if (puffs.includes('20.000') || puffs.includes('18.000')) {
    return { badge: 'DESTAQUE', badge_color: 'blue' };
  }
  
  return { badge: null, badge_color: null };
}

async function importJSON() {
  try {
    console.log('📂 Lendo JSON...\n');
    
    const jsonPath = path.join(__dirname, '../src/arquivo/produtos_formatados_inteligente.json');
    
    if (!fs.existsSync(jsonPath)) {
      console.log('❌ Arquivo JSON não encontrado!');
      console.log(`   Procurado em: ${jsonPath}\n`);
      return;
    }
    
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const rawProducts = JSON.parse(jsonContent);
    
    console.log(`📋 Total de produtos no JSON: ${rawProducts.length}\n`);
    console.log('🔄 Processando produtos...\n');
    
    const products = [];
    let filtrados = 0;
    
    rawProducts.forEach((raw, index) => {
      const name = raw['Nome do Produto'] || '';
      const description = raw['Descrição'] || '';
      const imageUrl = raw['URL Imagem Original'] || '';
      
      if (!name || !isVapeProduct(name, description)) {
        filtrados++;
        return;
      }
      
      const category = getCategory(name, description);
      const puffs = getPuffs(name, description);
      const price = getPrice(category, puffs);
      const badge = getBadge(puffs, name);
      
      // Descrição curta (primeiras 2 frases)
      const shortDesc = description
        .replace(/\\"/g, '"')
        .split('.')
        .filter(s => s.trim())
        .slice(0, 2)
        .join('.')
        .substring(0, 180)
        .trim();
      
      products.push({
        name: name.trim(),
        description: shortDesc || `${puffs} | Produto premium de qualidade`,
        detailed_description: description.replace(/\\"/g, '"').trim().substring(0, 2000),
        price: price,
        original_price: null,
        image: imageUrl,
        category: category,
        badge: badge.badge,
        badge_color: badge.badge_color,
        rating: parseFloat((4.5 + Math.random() * 0.5).toFixed(1)),
        reviews: Math.floor(Math.random() * 300) + 50,
        prep_time: 'Pronto para uso',
        serves: puffs,
        size: puffs.includes('30.000') || puffs.includes('25.000') || puffs.includes('40.000') ? 'Premium Recarregável' : 'Descartável',
        ingredients: ['Propilenoglicol', 'Glicerina vegetal', 'Nicotina', 'Aromatizantes'],
        allergens: ['Nicotina'],
        notes: 'Produto destinado a maiores de 18 anos. Contém nicotina, substância que causa dependência.',
        in_stock: true
      });
      
      // Mostrar primeiros 5
      if (products.length <= 5) {
        console.log(`✅ ${products.length}. ${name.substring(0, 60)}`);
        console.log(`   Categoria: ${category} | Preço: R$ ${price.toFixed(2)}`);
        console.log(`   ${puffs}\n`);
      }
    });
    
    console.log(`\n📊 Resumo:`);
    console.log(`   Total no JSON: ${rawProducts.length}`);
    console.log(`   Filtrados (JBL, fones, etc): ${filtrados}`);
    console.log(`   ✅ Produtos de vape: ${products.length}\n`);
    
    if (products.length === 0) {
      console.log('❌ Nenhum produto de vape encontrado!');
      return;
    }
    
    // Agrupar por categoria
    const byCategory = products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 Produtos por categoria:');
    Object.entries(byCategory).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} produtos`);
    });
    
    // Gerar JSON de backup
    console.log('\n📝 Gerando backup JSON...');
    const backupPath = path.join(__dirname, 'produtos_processados.json');
    fs.writeFileSync(backupPath, JSON.stringify(products, null, 2), 'utf-8');
    console.log(`   ✅ Backup salvo em: ${backupPath}\n`);
    
    // Importar no Supabase
    console.log('📤 Importando para o Supabase...\n');
    
    // Deletar produtos existentes
    const { error: deleteError } = await supabase.from('products').delete().neq('id', 0);
    if (deleteError) {
      console.log('⚠️  Aviso ao limpar produtos:', deleteError.message);
    } else {
      console.log('   🗑️  Produtos antigos removidos\n');
    }
    
    // Inserir em lotes de 50
    const batchSize = 50;
    let sucessos = 0;
    let erros = 0;
    
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const { error } = await supabase.from('products').insert(batch);
      
      if (error) {
        console.error(`❌ Erro no lote ${i / batchSize + 1}:`, error.message);
        erros += batch.length;
      } else {
        console.log(`   ✅ Lote ${i / batchSize + 1}/${Math.ceil(products.length / batchSize)} importado (${batch.length} produtos)`);
        sucessos += batch.length;
      }
    }
    
    console.log(`\n🎉 Importação concluída!`);
    console.log(`   ✅ Importados: ${sucessos} produtos`);
    if (erros > 0) {
      console.log(`   ❌ Erros: ${erros} produtos`);
    }
    console.log(`   📁 Backup JSON: ${backupPath}\n`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  }
}

importJSON();
