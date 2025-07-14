
/*
// src/services/apiTest.js

/**
 * Esegue una chiamata di test all'API di Google Gemini e stampa il risultato nella console.
 */
export const runApiTest = async () => {
  console.log("--- Inizio Test API Google Gemini (v1.5 Flash) ---");

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey.includes("xxx")) {
    console.error("ERRORE: Chiave API di Google Gemini non trovata o non valida in .env.local.");
    console.log("--- Fine Test API ---");
    return;
  }

  console.log("Chiave API Gemini trovata. Esecuzione della chiamata fetch...");

  const modelName = 'gemini-1.5-flash-latest';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "write a haiku about ai" }] }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("ERRORE dalla API Gemini:", errorData);
      throw new Error(`La richiesta API è fallita con stato ${response.status}`);
    }

    const data = await response.json();
    console.log("RISPOSTA RICEVUTA CON SUCCESSO:", data.candidates[0].content.parts[0].text);

  } catch (error) {
    console.error("ERRORE CRITICO durante la chiamata fetch:", error.message);
  } finally {
    console.log("--- Fine Test API Google Gemini ---");
  }
};

