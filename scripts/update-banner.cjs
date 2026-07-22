const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://tddhwnbnodrmwlzkgeno.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGh3bmJub2RybXdsemtnZW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY3NjU0NywiZXhwIjoyMTAwMjUyNTQ3fQ.sdox0MZNdHzWNPTmeAdOwCyI6dagF7Vln9iwhB1aN6I';
const supabase = createClient(supabaseUrl, supabaseKey);

async function update() {
  const { data, error } = await supabase
    .from('promotion_banner_settings')
    .update({
      gradient_start: '#dc2626',
      gradient_end: '#16a34a',
      border_color: '#facc15',
      text_color: '#ffffff',
      footer_bg: '#fef2f2',
      footer_border: '#fca5a5',
      footer_text_color: '#1f2937',
      icon_bg: 'rgba(255,255,255,0.2)',
      updated_at: new Date().toISOString()
    })
    .eq('id', 1)
    .select()
    .single();

  if (error) {
    console.error('Erro (colunas podem nao existir ainda):', error.message);
    console.log('As colunas serao adicionadas via SQL depois.');
    return;
  }
  console.log('Banner atualizado:', JSON.stringify(data, null, 2));
}

update();
