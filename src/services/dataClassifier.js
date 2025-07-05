import * as d3 from 'd3';

// Funzione numerica per gestire i casi 5 e 6 (invariata)
const classifyNumerically = (data, features) => {
    if (!data?.length || !features?.length) return 'insufficienti';
    const epsilon = 1e-4;
    for (const row of data) {
        let sum = 0;
        for (const f of features) {
            const v = row[f];
            if (typeof v !== 'number' || isNaN(v) || v < 0 || v > 1) {
                return 'needs_ai_analysis';
            }
            sum += v;
        }
        if (Math.abs(sum - 1) > epsilon) {
            return 'dominio_01';
        }
    }
    return 'partizionali';
};

/**
 * Funzione AI con prompt "few-shot" e un esempio negativo esplicito per il vino.
 */
const classifySemanticallyWithAI = async (numericKeys, dataSample) => {
    console.log("--- Esecuzione Chiamata AI (Prompt Definitivo con Esempio del Vino) ---");
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("Chiave API Gemini non valida.");
    
    const headers = numericKeys.join(', ');
    const sampleText = dataSample.map(row => 
        numericKeys.map(key => String(row[key]).slice(0, 20)).join(', ')
    ).join('\n');

    // --- PROMPT FINALE CON ESEMPIO ESPLICITO PER IL VINO ---
    const prompt = `Sei un esperto di analisi dati. Il tuo compito è classificare un set di dati CSV in una delle seguenti TRE categorie semantiche. Usa gli esempi forniti per guidare la tua decisione.

--- ESEMPI DI CLASSIFICAZIONE CORRETTA ---

ESEMPIO 1 (Dominio Comune):
Header: Analisi, Geometria, Fisica, Programmazione
Output Corretto: { "semantic_class": "dominio_comune" }
Ragionamento: Gli header sono tutti "voti", semanticamente correlati e con la stessa scala.

ESEMPIO 2 (Domini Fissati):
Header: Cilindrata, Consumo_Urbano, Prezzo, Punteggio_Sicurezza
Output Corretto: { "semantic_class": "domini_fissati" }
Ragionamento: Gli header sono caratteristiche tecniche di un'entità (un'auto) con scale diverse ma range stabili.

ESEMPIO 3 (Generici):
Header: Popolazione, Qualita_Aria_PM2.5, Costo_Vita_Indice
Output Corretto: { "semantic_class": "generici" }
Ragionamento: Gli header sono dati statistici non correlati con range dinamici.

ESEMPIO 4 (Generici - Caso Speciale):
Header: Alcohol, Malic acid, Ash, Phenols, Flavanoids
Output Corretto: { "semantic_class": "generici" }
Ragionamento: Anche se queste sono analisi chimiche di un'entità (il vino), sono considerate dati non correlati con range dinamici, non specifiche tecniche fisse.

--- DATI DA ANALIZZARE ADESSO ---

Header: ${headers}
Campione:
${sampleText}

--- ISTRUZIONE FINALE ---
Analizza i dati forniti e, basandoti sugli esempi, scegli la categoria più appropriata. Rispondi esclusivamente con un oggetto JSON: { "semantic_class": "ID_SCELTO" } dove ID_SCELTO è "dominio_comune", "domini_fissati", o "generici".`;
    
    const modelName = 'gemini-1.5-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { response_mime_type: "application/json" }
        })
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Errore API: ${response.status}`);
    }

    const result = await response.json();
    const aiResponse = JSON.parse(result.candidates[0].content.parts[0].text);
    return aiResponse.semantic_class;
};

/**
 * Funzione principale esportata con la logica ibrida finale.
 */
export const loadAndClassifyData = async (selectedFile) => {
    const url = `/data/${selectedFile}`;
    const rawData = await d3.csv(url);
    if (!rawData || rawData.length === 0) throw new Error('Dati vuoti');

    const filtered = rawData.filter(d => d.name && d.name.trim() !== '');
    const numericKeys = Object.keys(filtered[0] || {}).filter(k => k !== 'name' && !isNaN(parseFloat(filtered[0][k])));
    const parsedData = filtered.map((row, index) => {
        const copy = { ...row, id: `${row.name}-${index}` };
        numericKeys.forEach(k => { const num = +copy[k]; if (!isNaN(num)) copy[k] = num; });
        return copy;
    });

    let dataTypeId = classifyNumerically(parsedData, numericKeys);
    let classifiedByAI = false;

    if (dataTypeId === 'needs_ai_analysis') {
        const aiSemanticClass = await classifySemanticallyWithAI(numericKeys, parsedData.slice(0, 5));
        classifiedByAI = true;

        if (aiSemanticClass === 'dominio_comune') {
            dataTypeId = 'dominio_comune';
        } else if (aiSemanticClass === 'domini_fissati') {
            dataTypeId = 'domini_fissati';
        } else {
            const allPositive = parsedData.every(row => 
                numericKeys.every(key => row[key] >= 0)
            );
            dataTypeId = allPositive ? 'unconstrained_positive' : 'unconstrained';
        }
    }
    
    return { parsedData, features: numericKeys, dataTypeId, classifiedByAI };
};