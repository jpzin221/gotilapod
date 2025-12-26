// POD EXPRESSS - Loja de Vaporizadores e Cigarros Eletrônicos
export const products = [
  // Ignite V5000
  {
    id: 1,
    name: "Ignite V5000 - Banana Ice",
    description: "Descartável | 5000 puffs | Sabor intenso de banana com toque gelado",
    detailedDescription: "O Ignite V5000 oferece uma experiência premium com 5000 puffs de puro sabor. Banana fresca com finalização gelada para uma sensação refrescante incomparável. Design ergonômico e portátil.",
    price: 85.00,
    originalPrice: null,
    image: "/images/produto (1).webp",
    category: "Ignite",
    badge: "MAIS VENDIDO",
    badgeColor: "red",
    rating: 4.9,
    reviews: 342,
    serves: "5000 puffs",
    size: "Descartável",
    ingredients: ["Propilenoglicol", "Glicerina vegetal", "Nicotina", "Aromatizantes"],
    allergens: ["Nicotina"],
    notes: "Produto destinado a maiores de 18 anos. Contém nicotina, substância que causa dependência."
  },
  {
    id: 2,
    name: "Ignite V250 - Cactus Lime Soda",
    description: "Descartável | 2500 puffs | Cacto com limão e refrigerante",
    detailedDescription: "Sabor exótico de cacto com limão e toque de refrigerante. Perfeito para quem busca uma experiência única e refrescante. Bateria de longa duração.",
    price: 65.00,
    originalPrice: null,
    image: "/images/produto (2).webp",
    category: "Ignite",
    badge: "NOVO",
    badgeColor: "purple",
    rating: 4.8,
    reviews: 218,
    serves: "2500 puffs",
    size: "Descartável",
    ingredients: ["Propilenoglicol", "Glicerina vegetal", "Nicotina", "Aromatizantes"],
    allergens: ["Nicotina"],
    notes: "Produto destinado a maiores de 18 anos. Contém nicotina, substância que causa dependência."
  },
  {
    id: 3,
    name: "Ignite V250 - Grape Ice",
    description: "Descartável | 2500 puffs | Uva gelada refrescante",
    detailedDescription: "2500 puffs de uva ultra refrescante com toque gelado intenso. Ideal para quem busca frescor máximo. Design moderno e elegante.",
    price: 65.00,
    originalPrice: 75.00,
    image: "/images/produto (2).webp",
    category: "Ignite",
    badge: "PROMOÇÃO",
    badgeColor: "purple",
    rating: 4.9,
    reviews: 156,
    serves: "2500 puffs",
    size: "Descartável",
    ingredients: ["Propilenoglicol", "Glicerina vegetal", "Nicotina", "Aromatizantes"],
    allergens: ["Nicotina"],
    notes: "Produto destinado a maiores de 18 anos. Contém nicotina, substância que causa dependência."
  },
  {
    id: 4,
    name: "Geek Bar - Peach Raspberry",
    description: "Recarregável | 25000 puffs | Pêssego com framboesa",
    detailedDescription: "Combinação perfeita de pêssego com framboesa. Tela digital inteligente, bateria recarregável. Tecnologia de ponta para máxima durabilidade.",
    price: 120.00,
    originalPrice: null,
    image: "/images/produto (3).webp",
    category: "Geek Bar",
    badge: "25K PUFFS",
    badgeColor: "gold",
    rating: 5.0,
    reviews: 289,
    serves: "25000 puffs",
    size: "Recarregável | Tela Digital",
    ingredients: ["Propilenoglicol", "Glicerina vegetal", "Nicotina", "Aromatizantes"],
    allergens: ["Nicotina"],
    notes: "Produto destinado a maiores de 18 anos. Contém nicotina, substância que causa dependência."
  },
  {
    id: 5,
    name: "Pod Descartável - Mix de Sabores",
    description: "Descartável | 600-800 puffs | Diversos sabores disponíveis",
    detailedDescription: "Variedade de pods descartáveis com diferentes sabores. Perfeito para experimentar novos gostos. Bateria otimizada para duração máxima. Compacto e prático para levar para qualquer lugar.",
    price: 45.00,
    originalPrice: null,
    image: "/images/produto (4).webp",
    category: "Pods",
    badge: null,
    badgeColor: null,
    rating: 4.8,
    reviews: 195,
    serves: "600-800 puffs",
    size: "Descartável | Compacto",
    ingredients: ["Propilenoglicol", "Glicerina vegetal", "Nicotina", "Aromatizantes"],
    allergens: ["Nicotina"],
    notes: "Produto destinado a maiores de 18 anos. Contém nicotina, substância que causa dependência."
  }
];

export const storeInfo = {
  name: "Candidos Pods",
  fantasyName: "Candidos Pods",
  legalName: "Casa de Fumos Candido LTDA",
  cnpj: "76.048.487/0001-44",
  stateRegistration: "10151750-08",
  activity: "Tabacaria",
  logo: "/images/Fotos-site/LOGO.jpg",
  rating: 4.9,
  reviews: 1547,
  address: "Atendemos todo o Paraná",
  phone: "+55 19 98253-0057",
  whatsapp: "+5519982530057", // Número sem formatação para link
  instagram: "https://www.instagram.com/podexpressofc",
  instagramHandle: "@podexpressofc",
  delivery: {
    time: "Entrega via Motoboy",
    fee: 15.00, // Taxa de entrega fixa
    freeShippingMinimum: 150.00, // Frete grátis acima de R$ 150
    radiusKm: null // Atendemos todo o Paraná
  },
  categories: ["TODOS", "IGNITE", "GEEK BAR", "LOST MARY", "ELF BAR", "PODS", "ACESSÓRIOS"],
  // Coordenadas da loja (Curitiba - PR)
  location: {
    latitude: -25.4284, // Latitude da loja
    longitude: -49.2733, // Longitude da loja
    city: "Curitiba",
    state: "PR",
    neighborhood: "Centro"
  }
};
