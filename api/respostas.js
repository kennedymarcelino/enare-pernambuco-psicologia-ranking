const TABLE = 'respostas_enare_pernambuco';

function isPlainObject(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function normalizeBody(body) { if (isPlainObject(body)) return body; if (typeof body === 'string') { try { return JSON.parse(body); } catch { return null; } } return null; }
function validationError(message) { const error = new Error(message); error.status = 400; return error; }

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Método não permitido.' }); }
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'Configuração do servidor indisponível.' });
  try {
    const body = normalizeBody(req.body);
    if (!body) throw validationError('Corpo da requisição inválido.');
    const apelido = typeof body.apelido === 'string' ? body.apelido.trim() : '';
    const notaEntrada = typeof body.nota === 'string' ? body.nota.replace(',', '.') : body.nota;
    const notaNumerica = Number(notaEntrada);
    const nota = Math.round((notaNumerica + Number.EPSILON) * 10) / 10;
    const anoNascimento = Number(body.ano_nascimento);
    const programaId = Number(body.programa_id);
    const prioridade = Number(body.prioridade);
    const modalidade = body.modalidade;
    if (apelido.length < 3 || apelido.length > 24) throw validationError('O apelido deve ter entre 3 e 24 caracteres.');
    if (!Number.isFinite(notaNumerica) || notaNumerica < 0 || notaNumerica > 100) throw validationError('A nota deve estar entre 0 e 100.');
    if (!Number.isInteger(anoNascimento) || anoNascimento < 1930 || anoNascimento > 2010) throw validationError('O ano de nascimento deve estar entre 1930 e 2010.');
    if (modalidade !== 'AC' && modalidade !== 'PNP') throw validationError('A modalidade deve ser AC ou PNP.');
    if (!Number.isInteger(programaId) || programaId < 1) throw validationError('O programa deve ser um inteiro positivo.');
    if (!Number.isInteger(prioridade) || prioridade < 1 || prioridade > 3) throw validationError('A preferência deve estar entre 1 e 3.');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ apelido, nota, ano_nascimento: anoNascimento, modalidade, programa_id: programaId, prioridade })
    });
    if (!response.ok) return res.status(502).json({ error: 'Não foi possível salvar a resposta.' });
    return res.status(201).json({ message: 'Resposta criada com sucesso.' });
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message || 'Dados inválidos.' });
  }
}
