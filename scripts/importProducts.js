import { createClient } from '@supabase/supabase-js';

// Suas credenciais do Supabase
const supabaseUrl = 'https://fkstktohbnwsnzbarujc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrc3RrdG9oYm53c256YmFydWpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDI1NjMsImV4cCI6MjA3NzU3ODU2M30.rN3BfRwWeE9Pjf70S8uneSgngYHGPz75FtfqzQfDq6o';

const supabase = createClient(supabaseUrl, supabaseKey);

// Exemplo de produtos - SUBSTITUA pelos dados da sua planilha
const products = [
  {
    name: "Ignite V5000 - Banana Ice",
    description: "5000 puffs | Sabor intenso de banana com toque gelado",
    detailed_description: "O Ignite V5000 oferece uma experiência premium com 5000 puffs de puro sabor. Banana fresca com finalização gelada para uma sensação refrescante incomparável. Design ergonômico e portátil.",
    price: 85.00,
    original_price: null,
    image: "/src/Imagens/produto (1).webp",
    category: "Ignite",
    badge: "MAIS VENDIDO",
    badge_color: "red",
    rating: 4.9,
    reviews: 342,
    prep_time: "Pronto para uso",
    serves: "5000 puffs",
    size: "Descartável",
    ingredients: ["Propilenoglicol", "Glicerina vegetal", "Nicotina", "Aromatizantes"],
    allergens: ["Nicotina"],
    notes: "Produto destinado a maiores de 18 anos. Contém nicotina, substância que causa dependência.",
    in_stock: true
  },
  {
    name: "Ignite V250 - Cactus Lime Soda",
    description: "2500 puffs | Cacto com limão e refrigerante",
    detailed_description: "Sabor exótico de cacto com limão e toque de refrigerante. Perfeito para quem busca uma experiência única e refrescante. Bateria de longa duração.",
    price: 65.00,
    original_price: null,
    image: "/src/Imagens/produto (2).webp",
    category: "Ignite",
    badge: "NOVO",
    badge_color: "purple",
    rating: 4.8,
    reviews: 218,
    prep_time: "Pronto para uso",
    serves: "2500 puffs",
    size: "Descartável",
    ingredients: ["Propilenoglicol", "Glicerina vegetal", "Nicotina", "Aromatizantes"],
    allergens: ["Nicotina"],
    notes: "Produto destinado a maiores de 18 anos. Contém nicotina, substância que causa dependência.",
    in_stock: true
  },
  {
    name: "Ignite V250 - Grape Ice",
    description: "2500 puffs | Uva gelada refrescante",
    detailed_description: "Versão premium com 2500 puffs. Uva ultra refrescante com toque gelado intenso. Ideal para quem busca frescor máximo. Design moderno e elegante.",
    price: 65.00,
    original_price: 75.00,
    image: "/src/Imagens/produto (2).webp",
    category: "Ignite",
    badge: "PROMOÇÃO",
    badge_color: "purple",
    rating: 4.9,
    reviews: 156,
    prep_time: "Pronto para uso",
    serves: "2500 puffs",
    size: "Descartável Premium",
    ingredients: ["Propilenoglicol", "Glicerina vegetal", "Nicotina", "Aromatizantes"],
    allergens: ["Nicotina"],
    notes: "Produto destinado a maiores de 18 anos. Contém nicotina, substância que causa dependência.",
    in_stock: true
  },
  {
    name: "Geek Bar - Peach Raspberry",
    description: "25000 puffs | Pêssego com framboesa",
    detailed_description: "Combinação perfeita de pêssego com framboesa. Tela digital inteligente, bateria recarregável. Tecnologia de ponta para máxima durabilidade.",
    price: 120.00,
    original_price: null,
    image: "/src/Imagens/produto (3).webp",
    category: "Geek Bar",
    badge: "PREMIUM",
    badge_color: "gold",
    rating: 5.0,
    reviews: 289,
    prep_time: "Pronto para uso",
    serves: "25000 puffs",
    size: "Recarregável",
    ingredients: ["Propilenoglicol", "Glicerina vegetal", "Nicotina", "Aromatizantes"],
    allergens: ["Nicotina"],
    notes: "Produto destinado a maiores de 18 anos. Contém nicotina, substância que causa dependência.",
    in_stock: true
  },
  {
    name: "Pod Descartável - Mix de Sabores",
    description: "Diversos sabores disponíveis",
    detailed_description: "Variedade de pods descartáveis com diferentes sabores. Perfeito para experimentar novos gostos. Bateria otimizada para duração máxima.",
    price: 45.00,
    original_price: null,
    image: "/src/Imagens/produto (4).webp",
    category: "Pods",
    badge: null,
    badge_color: null,
    rating: 4.8,
    reviews: 195,
    prep_time: "Pronto para uso",
    serves: "Varia por modelo",
    size: "Compacto",
    ingredients: ["Propilenoglicol", "Glicerina vegetal", "Nicotina", "Aromatizantes"],
    allergens: ["Nicotina"],
    notes: "Produto destinado a maiores de 18 anos. Contém nicotina, substância que causa dependência.",
    in_stock: true
  }
];

async function importProducts() {
  try {
    console.log('🚀 Iniciando importação de produtos...\n');

    // Limpar produtos existentes (opcional)
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .neq('id', 0); // Deleta todos os produtos

    if (deleteError) {
      console.log('⚠️  Aviso ao limpar produtos:', deleteError.message);
    } else {
      console.log('✅ Produtos existentes removidos\n');
    }

    // Inserir novos produtos
    const { data, error } = await supabase
      .from('products')
      .insert(products)
      .select();

    if (error) {
      console.error('❌ Erro ao importar produtos:', error);
      throw error;
    }

    console.log(`✅ ${data.length} produtos importados com sucesso!\n`);
    console.log('Produtos importados:');
    data.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - R$ ${product.price.toFixed(2)}`);
    });

    console.log('\n🎉 Importação concluída!');
  } catch (error) {
    console.error('❌ Erro durante a importação:', error);
    process.exit(1);
  }
}

// Executar importação
importProducts();
