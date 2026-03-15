module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    const { lat, lng, location, years } = req.body;

    const prompt = `Você é um especialista em geologia, clima e desenvolvimento socioeconômico. Analise a localização: "${location}" (lat: ${lat}, lng: ${lng}).

Responda APENAS em JSON válido, sem markdown, sem texto extra:
{
  "score": número de 0 a 100 (100 = totalmente seguro),
  "verdict": "SEGURO" ou "MODERADO" ou "PERIGOSO",
  "verdict_text": "frase curta explicando o risco geral",
  "risks": {
    "terremoto": "Baixo" ou "Médio" ou "Alto",
    "vulcao": "Baixo" ou "Médio" ou "Alto",
    "enchente": "Baixo" ou "Médio" ou "Alto",
    "deslizamento": "Baixo" ou "Médio" ou "Alto",
    "seca": "Baixo" ou "Médio" ou "Alto",
    "tsunami": "Baixo" ou "Médio" ou "Alto"
  },
  "scenarios": {
    "optimista": {"pct": número 0-100, "desc": "descrição em ${years} anos"},
    "moderado": {"pct": número 0-100, "desc": "descrição em ${years} anos"},
    "pessimista": {"pct": número 0-100, "desc": "descrição em ${years} anos"}
  },
  "morar": "SIM" ou "COM RESSALVAS" ou "NÃO",
  "morar_texto": "análise de 2 frases sobre morar aqui a longo prazo",
  "investir": "ALTO POTENCIAL" ou "POTENCIAL MÉDIO" ou "NÃO RECOMENDADO",
  "investir_texto": "análise de 2 frases sobre potencial da região para agronegócio, turismo, energia, indústria ou imóveis",
  "catastrofes": array de até 5 objetos com catástrofes naturais históricas reais registradas nesta região. Cada objeto: {"ano": "ano", "tipo": "Enchente/Terremoto/Vulcão/Deslizamento/Seca/Tsunami", "descricao": "descrição breve do evento e impacto"}. Se não houver nenhuma, retorne []
}`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.2
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na API: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        res.json(parsed);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}