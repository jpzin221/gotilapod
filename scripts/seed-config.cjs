const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://tddhwnbnodrmwlzkgeno.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGh3bmJub2RybXdsemtnZW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY3NjU0NywiZXhwIjoyMTAwMjUyNTQ3fQ.sdox0MZNdHzWNPTmeAdOwCyI6dagF7Vln9iwhB1aN6I';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const configs = [
    { key: 'about_us', value: 'Somos uma loja especializada em vaporizadores e pods de alta qualidade.', type: 'textarea', category: 'institutional', label: 'Sobre Nos' },
    { key: 'mission', value: 'Oferecer produtos de qualidade com atendimento personalizado.', type: 'textarea', category: 'institutional', label: 'Missao' },
    { key: 'values', value: 'Qualidade, Confianca, Agilidade no Atendimento.', type: 'textarea', category: 'institutional', label: 'Valores' },
    { key: 'banner_text', value: 'Confira nossas ofertas!', type: 'text', category: 'content', label: 'Texto do Banner' },
    { key: 'cta_text', value: 'Compre Agora', type: 'text', category: 'content', label: 'Texto do Botao CTA' },
    { key: 'about_page_text', value: 'Conheca nossa historia e nossos valores.', type: 'textarea', category: 'content', label: 'Texto Pagina Sobre' }
  ];

  const { data, error } = await supabase.from('site_config').upsert(configs, { onConflict: 'key' }).select();
  if (error) { console.error('Erro:', error); return; }
  console.log(data.length + ' configuracoes inseridas!');
}

seed();
