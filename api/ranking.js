const TABLE = 'respostas_enare_pernambuco';

function supabaseHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { apikey: key, Authorization: `Bearer ${key}` };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'Configuração do servidor indisponível.' });
  const url = new URL(`${SUPABASE_URL}/rest/v1/${TABLE}`);
  url.searchParams.set('select', 'apelido,nota,ano_nascimento,modalidade,programa_id,prioridade');
  url.searchParams.set('order', 'nota.desc,ano_nascimento.asc');
  try {
    const response = await fetch(url, { headers: supabaseHeaders() });
    const data = await response.json().catch(() => null);
    if (!response.ok) return res.status(response.status).json({ error: 'Não foi possível consultar o ranking.' });
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({ error: 'Não foi possível acessar o banco de dados.' });
  }
}
