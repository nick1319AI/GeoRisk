module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    const { lat, lng, location, years } = req.body;

    const prompt = `Você é um especialista em geologia, clima, geopolítica e geografia educacional. Analise a localização: "${location}" (lat: ${lat}, lng: ${lng}).

IMPORTANTE: Seja rigoroso e realista. Zonas sísmicas, áreas de enchente, regiões áridas ou pobres devem ter score baixo. Score acima de 80 apenas para regiões genuinamente seguras e desenvolvidas. Nunca invente catástrofes — só cite eventos reais e conhecidos.

Responda APENAS em JSON válido, sem markdown, sem texto extra:
{
  "score": número de 0 a 100,
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
  "morar_texto": "análise de 2 frases sobre morar aqui",
  "investir": "ALTO POTENCIAL" ou "POTENCIAL MÉDIO" ou "NÃO RECOMENDADO",
  "investir_texto": "análise de 2 frases sobre potencial econômico",
  "catastrofes": [array de até 5 objetos {"ano": "ano", "tipo": "tipo", "descricao": "descrição breve"} com eventos reais. Se nenhum, retorne []],
  "politica": {
    "pais": "nome do país",
    "capital": "capital do país",
    "governo": "tipo de governo ex: República Federal, Monarquia Constitucional",
    "populacao": "população aproximada ex: 215 milhões",
    "pib_per_capita": "PIB per capita aproximado ex: US$ 8.900",
    "idioma": "idioma(s) oficial(is)",
    "moeda": "moeda local",
    "continente": "continente",
    "contexto": "2 frases sobre situação política e econômica atual do país"
  },
  "aprendizado": [array de 4 objetos {"titulo": "título curto do fato", "conteudo": "2-3 frases educativas sobre geografia, cultura, história ou curiosidades desta região específica"}]
}`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
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