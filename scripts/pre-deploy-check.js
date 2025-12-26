#!/usr/bin/env node

/**
 * Script de verificação pré-deploy
 * Verifica se tudo está configurado corretamente antes do deploy
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verificando configuração para deploy...\n');

let hasErrors = false;
let warnings = 0;

// Verificar variáveis de ambiente
console.log('📋 Verificando variáveis de ambiente...');
const envExample = path.join(__dirname, '../.env.example');
const envLocal = path.join(__dirname, '../.env');

if (!fs.existsSync(envLocal)) {
  console.log('⚠️  AVISO: Arquivo .env não encontrado');
  console.log('   Certifique-se de configurar as variáveis no Netlify');
  warnings++;
} else {
  const envContent = fs.readFileSync(envLocal, 'utf8');
  
  if (!envContent.includes('VITE_SUPABASE_URL')) {
    console.log('❌ ERRO: VITE_SUPABASE_URL não encontrada no .env');
    hasErrors = true;
  } else {
    console.log('✅ VITE_SUPABASE_URL configurada');
  }
  
  if (!envContent.includes('VITE_SUPABASE_ANON_KEY')) {
    console.log('❌ ERRO: VITE_SUPABASE_ANON_KEY não encontrada no .env');
    hasErrors = true;
  } else {
    console.log('✅ VITE_SUPABASE_ANON_KEY configurada');
  }
}

// Verificar arquivos essenciais
console.log('\n📁 Verificando arquivos essenciais...');
const essentialFiles = [
  'package.json',
  'vite.config.js',
  'index.html',
  'netlify.toml',
  'src/main.jsx',
  'src/App.jsx'
];

essentialFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ERRO: ${file} não encontrado`);
    hasErrors = true;
  }
});

// Verificar package.json
console.log('\n📦 Verificando package.json...');
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
);

if (packageJson.scripts && packageJson.scripts.build) {
  console.log('✅ Script de build configurado');
} else {
  console.log('❌ ERRO: Script de build não encontrado');
  hasErrors = true;
}

// Verificar dependências críticas
const criticalDeps = [
  'react',
  'react-dom',
  'react-router-dom',
  '@supabase/supabase-js'
];

console.log('\n🔧 Verificando dependências críticas...');
criticalDeps.forEach(dep => {
  if (packageJson.dependencies && packageJson.dependencies[dep]) {
    console.log(`✅ ${dep}`);
  } else {
    console.log(`❌ ERRO: ${dep} não encontrado nas dependências`);
    hasErrors = true;
  }
});

// Verificar estrutura de pastas
console.log('\n📂 Verificando estrutura de pastas...');
const folders = [
  'src',
  'src/components',
  'src/lib',
  'src/context'
];

folders.forEach(folder => {
  const folderPath = path.join(__dirname, '..', folder);
  if (fs.existsSync(folderPath)) {
    console.log(`✅ ${folder}/`);
  } else {
    console.log(`⚠️  AVISO: ${folder}/ não encontrado`);
    warnings++;
  }
});

// Verificar .gitignore
console.log('\n🔒 Verificando .gitignore...');
const gitignorePath = path.join(__dirname, '../.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  
  const mustIgnore = ['node_modules', 'dist', '.env'];
  mustIgnore.forEach(item => {
    if (gitignoreContent.includes(item)) {
      console.log(`✅ ${item} está no .gitignore`);
    } else {
      console.log(`❌ ERRO: ${item} não está no .gitignore`);
      hasErrors = true;
    }
  });
} else {
  console.log('❌ ERRO: .gitignore não encontrado');
  hasErrors = true;
}

// Resumo final
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ VERIFICAÇÃO FALHOU!');
  console.log('   Corrija os erros acima antes de fazer deploy.');
  process.exit(1);
} else if (warnings > 0) {
  console.log(`⚠️  VERIFICAÇÃO PASSOU COM ${warnings} AVISO(S)`);
  console.log('   Revise os avisos antes de fazer deploy.');
  process.exit(0);
} else {
  console.log('✅ TUDO PRONTO PARA DEPLOY!');
  console.log('   Execute: npm run build');
  process.exit(0);
}
