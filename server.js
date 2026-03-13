const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

console.log('--- INICIALIZANDO SERVIDOR (Plano B: API Gratuita Sem Cartão) ---');

app.post('/analyze', async (req, res) => {
    console.log('\n========================================');
    console.log('=> NOVA REQUISIÇÃO RECEBIDA EM /analyze');

    const { lat, lng, location, years } = req.body;
    console.log('Dados recebidos:', req.body);

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
    "optimista": {"pct": número 0-100, "desc": "descrição do relevo/clima em ${years} anos"},
    "moderado": {"pct": número 0-100, "desc": "descrição do relevo/clima em ${years} anos"},
    "pessimista": {"pct": número 0-100, "desc": "descrição do relevo/clima em ${years} anos"}
  },
  "morar": "SIM" ou "COM RESSALVAS" ou "NÃO",
  "morar_texto": "análise de 2 frases sobre a segurança de morar aqui a longo prazo",
  "investir": "ALTO POTENCIAL" ou "POTENCIAL MÉDIO" ou "NÃO RECOMENDADO",
  "investir_texto": "análise de 2 frases avaliando o potencial da região para agronegócio, turismo, energia, indústria ou imóveis baseando-se na geografia"
}`;

    try {
        console.log('=> Fazendo chamada para a API (Llama 3)...');

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant", // Modelo de IA gratuito e ultra rápido
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }, // Garante que volta JSON
                temperature: 0.2
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na API: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const text = data.choices[0].message.content;

        console.log('=> RESPOSTA RECEBIDA COM SUCESSO!');

        const parsed = JSON.parse(text);
        res.json(parsed);

    } catch (err) {
        console.error('=> ERRO NO SERVIDOR:', err.message);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`\n✅ GeoRisk rodando na porta ${PORT}`);
});

