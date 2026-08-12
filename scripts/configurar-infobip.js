/**
 * Script para configurar a conexao com Infobip WhatsApp
 * Execute: node scripts/configurar-infobip.js
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

async function main() {
  console.log('\n🚀 Configuracao WhatsApp - Infobip\n');
  console.log('================================================');
  console.log('Este script ajuda a configurar a conexao com a Infobip API.\n');
  console.log('O que voce precisa:');
  console.log('  1. Conta na Infobip (infobip.com)');
  console.log('  2. WhatsApp sender configurado no painel');
  console.log('  3. API Key gerada no painel da Infobip');
  console.log('  4. URL da sua aplicacao Infobip (ex: abc123.api.infobip.com)\n');
  console.log('================================================\n');

  // Configuracoes do Supabase
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variaveis de ambiente do Supabase nao encontradas!');
    console.error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('📡 Coletando configuracoes...\n');

  const apiUrl = await ask('📎 URL da API Infobip (ex: abc123.api.infobip.com): ');
  const apiKey = await ask('🔑 API Key da Infobip: ');
  const phoneNumber = await ask('📱 Numero do WhatsApp (ex: 5544999887766): ');
  const isActive = await ask('✅ Ativar sistema agora? (sim/nao): ');

  console.log('\n💾 Salvando configuracao no Supabase...');

  const { data: existing } = await supabase
    .from('whatsapp_config')
    .select('id')
    .limit(1)
    .single();

  const configData = {
    api_provider: 'infobip',
    api_url: apiUrl.replace('https://', '').replace(/\/$/, ''),
    api_key: apiKey,
    phone_number: phoneNumber.replace(/\D/g, ''),
    is_active: isActive.toLowerCase() === 'sim',
    reminder_delay_minutes: 30,
    max_reminders: 2,
    welcome_message: 'Ola {nome}! Vi que voce deixou {itens} no carrinho na GorilaPod (R$ {total}). Ainda da tempo de garantir! 😍 {link}',
    followup_message: 'Ei {nome}! Seus produtos estao acabando! Garanta os seus antes que esgote! 🚀 {link}',
    updated_at: new Date().toISOString()
  };

  let result;
  if (existing) {
    result = await supabase
      .from('whatsapp_config')
      .update(configData)
      .eq('id', existing.id);
  } else {
    result = await supabase
      .from('whatsapp_config')
      .insert(configData);
  }

  if (result.error) {
    console.error('❌ Erro ao salvar:', result.error.message);
  } else {
    console.log('\n✅ Configuracao salva com sucesso!');
    console.log('\n================================================');
    console.log('Proximos passos:');
    console.log('  1. Acesse o painel Admin > Carrinhos > Config');
    console.log('  2. Clique em "Testar" para verificar a conexao');
    console.log('  3. Ative o sistema para enviar mensagens automaticas');
    console.log('================================================\n');
  }

  rl.close();
}

main().catch(console.error);