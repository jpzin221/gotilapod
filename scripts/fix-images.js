import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🖼️  Corrigindo caminhos de imagens...\n');

// Arquivos que precisam ser atualizados
const filesToUpdate = [
  {
    path: path.join(__dirname, '../src/data/products.js'),
    replacements: [
      { from: '/src/Imagens/', to: '/images/' }
    ]
  },
  {
    path: path.join(__dirname, '../src/components/HeroSection.jsx'),
    replacements: [
      { from: '/src/Imagens/Fotos-site/', to: '/images/Fotos-site/' }
    ]
  },
  {
    path: path.join(__dirname, '../src/components/GallerySection.jsx'),
    replacements: [
      { from: '/src/Imagens/', to: '/images/' }
    ]
  }
];

let totalReplacements = 0;

filesToUpdate.forEach(file => {
  if (!fs.existsSync(file.path)) {
    console.log(`⚠️  Arquivo não encontrado: ${path.basename(file.path)}`);
    return;
  }

  let content = fs.readFileSync(file.path, 'utf8');
  let fileReplacements = 0;

  file.replacements.forEach(({ from, to }) => {
    const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    if (matches) {
      fileReplacements += matches.length;
      content = content.replace(regex, to);
    }
  });

  if (fileReplacements > 0) {
    fs.writeFileSync(file.path, content, 'utf8');
    console.log(`✅ ${path.basename(file.path)}: ${fileReplacements} substituições`);
    totalReplacements += fileReplacements;
  } else {
    console.log(`ℹ️  ${path.basename(file.path)}: Nenhuma alteração necessária`);
  }
});

console.log(`\n📊 Total: ${totalReplacements} caminhos corrigidos`);
console.log('\n✅ Caminhos atualizados com sucesso!');
console.log('\n📝 Próximos passos:');
console.log('1. Mova as imagens: xcopy src\\Imagens public\\images\\ /E /I');
console.log('2. Teste localmente: npm run dev');
console.log('3. Build: npm run build');
console.log('4. Preview: npm run preview');
console.log('5. Deploy: git add . && git commit -m "Fix images" && git push');
