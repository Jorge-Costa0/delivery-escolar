// import { db } from './db.js';
// import { products } from '@shared/schema.js';

// const seedProducts = [
//   {
//     name: "Pão Francês",
//     description: "Pãozinho tradicional brasileiro, crocante por fora e macio por dentro",
//     price: "0.75",
//     stock: 200,
//     imageUrl: null,
//     rating: "4.8",
//     reviewCount: 156
//   },
//   {
//     name: "Pão de Forma Integral",
//     description: "Pão de forma integral, nutritivo e saboroso. Fatias ideais para lanche",
//     price: "8.50",
//     stock: 50,
//     imageUrl: null,
//     rating: "4.5",
//     reviewCount: 89
//   },
//   {
//     name: "Pão de Açúcar",
//     description: "Pão doce tradicional, levemente adocicado e muito macio",
//     price: "1.25",
//     stock: 80,
//     imageUrl: null,
//     rating: "4.7",
//     reviewCount: 124
//   },
//   {
//     name: "Pão de Queijo",
//     description: "Autêntico pão de queijo mineiro, feito com polvilho e queijo",
//     price: "2.00",
//     stock: 150,
//     imageUrl: null,
//     rating: "4.9",
//     reviewCount: 203
//   },
//   {
//     name: "Bisnaguinha",
//     description: "Pãozinho doce pequeno, perfeito para o lanche escolar",
//     price: "0.60",
//     stock: 120,
//     imageUrl: null,
//     rating: "4.6",
//     reviewCount: 98
//   },
//   {
//     name: "Pão Italiano",
//     description: "Pão crocante com casca dourada e miolo aerado",
//     price: "2.50",
//     stock: 60,
//     imageUrl: null,
//     rating: "4.4",
//     reviewCount: 67
//   },
//   {
//     name: "Pão de Leite",
//     description: "Pão macio e levemente doce, feito com leite fresco",
//     price: "1.50",
//     stock: 90,
//     imageUrl: null,
//     rating: "4.8",
//     reviewCount: 142
//   },
//   {
//     name: "Pão Integral",
//     description: "Pão integral rico em fibras, ideal para uma alimentação saudável",
//     price: "1.75",
//     stock: 70,
//     imageUrl: null,
//     rating: "4.3",
//     reviewCount: 85
//   },
//   {
//     name: "Rosquinha Doce",
//     description: "Rosquinha tradicional levemente doce, perfeita para o café da manhã",
//     price: "1.00",
//     stock: 100,
//     imageUrl: null,
//     rating: "4.7",
//     reviewCount: 118
//   },
//   {
//     name: "Pão de Centeio",
//     description: "Pão escuro e nutritivo, feito com farinha de centeio",
//     price: "3.00",
//     stock: 40,
//     imageUrl: null,
//     rating: "4.2",
//     reviewCount: 54
//   },
//   {
//     name: "Croissant Simples",
//     description: "Croissant tradicional, folhado e amanteigado",
//     price: "4.50",
//     stock: 35,
//     imageUrl: null,
//     rating: "4.6",
//     reviewCount: 76
//   },
//   {
//     name: "Pão de Batata",
//     description: "Pão macio feito com batata, textura única e sabor suave",
//     price: "2.25",
//     stock: 55,
//     imageUrl: null,
//     rating: "4.5",
//     reviewCount: 91
//   }
// ];

// export async function seedProductsData() {
//   try {
//     console.log('Seeding products...');
    
//     // Check if products already exist
//     const existingProducts = await db.select().from(products).limit(1);
//     if (existingProducts.length > 0) {
//       console.log('Products already exist, skipping seed.');
//       return;
//     }

//     // Insert all products
//     await db.insert(products).values(seedProducts);
    
//     console.log(`Successfully seeded ${seedProducts.length} products!`);
//   } catch (error) {
//     console.error('Error seeding products:', error);
//     throw error;
//   }
// }
