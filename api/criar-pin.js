import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function hashPin(pin) {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { nome, telefone, pin } = req.body;
    if (!nome || !telefone || !pin) {
      return res.status(400).json({ success: false, error: 'Nome, telefone e PIN são obrigatórios' });
    }
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ success: false, error: 'PIN deve ter 4 dígitos' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, error: 'Configuração do servidor incompleta' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: existingUser } = await supabase.from('usuarios').select('*').eq('telefone', telefone).single();
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Este telefone já está cadastrado' });
    }

    const { data: newUser, error } = await supabase.from('usuarios').insert([{
      nome, telefone, pin_hash: hashPin(pin), created_at: new Date().toISOString()
    }]).select().single();

    if (error) return res.status(500).json({ success: false, error: 'Erro ao criar conta' });

    return res.status(200).json({ success: true, message: 'Conta criada com sucesso!', usuario: { id: newUser.id, nome: newUser.nome, telefone: newUser.telefone } });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
