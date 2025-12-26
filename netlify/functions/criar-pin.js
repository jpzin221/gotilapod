const { createClient } = require('@supabase/supabase-js');

// Headers CORS
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
};

exports.handler = async (event) => {
    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, error: 'Method not allowed' })
        };
    }

    try {
        const body = JSON.parse(event.body);
        const { nome, telefone, pin } = body;

        if (!nome || !telefone || !pin) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Nome, telefone e PIN são obrigatórios'
                })
            };
        }

        // Validar PIN (4 dígitos)
        if (!/^\d{4}$/.test(pin)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'PIN deve ter 4 dígitos'
                })
            };
        }

        // Criar cliente Supabase
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Supabase credentials missing');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ success: false, error: 'Configuração do servidor incompleta' })
            };
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Verificar se usuário já existe
        const { data: existingUser } = await supabase
            .from('usuarios')
            .select('*')
            .eq('telefone', telefone)
            .single();

        if (existingUser) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Este telefone já está cadastrado'
                })
            };
        }

        // Criar novo usuário
        const { data: newUser, error } = await supabase
            .from('usuarios')
            .insert([{
                nome,
                telefone,
                pin_hash: pin, // Em produção, usar hash real
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar usuário:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Erro ao criar conta. Tente novamente.'
                })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Conta criada com sucesso!',
                usuario: {
                    id: newUser.id,
                    nome: newUser.nome,
                    telefone: newUser.telefone
                }
            })
        };

    } catch (error) {
        console.error('Erro:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message || 'Erro interno do servidor'
            })
        };
    }
};
