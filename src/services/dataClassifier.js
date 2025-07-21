import * as d3 from 'd3';


const classifyNumerically = (data, features) => {
    if (!data?.length || !features?.length) {
        return 'insufficienti';
    }

    const epsilon = 1e-4;
    let isAlwaysDomain01 = true;
    let isAlwaysPartitional = true;

    for (const row of data) {
        let sum = 0;
        
        for (const f of features) {
            const v = row[f];
            if (typeof v !== 'number' || isNaN(v)) {
                return 'generico';
            }
            if (v < 0 || v > 1) {
                isAlwaysDomain01 = false;
            }
            sum += v;
        }

        if (Math.abs(sum - 1) > epsilon) {
            isAlwaysPartitional = false;
        }
    }
    
    if (isAlwaysPartitional) {
        return 'partizionali';
    }

    if (isAlwaysDomain01) {
        return 'dominio_01';
    }

    return 'generico';
};


const parseAndClassify = (rawData) => {
    if (!rawData || rawData.length === 0) {
        throw new Error('Dati vuoti o malformattati');
    }

    const columns = rawData.columns || Object.keys(rawData[0] || {});
    if (columns.length < 2) {
        throw new Error("Il file deve contenere almeno una colonna per i nomi e una colonna numerica.");
    }

    // --- LOGICA CHIAVE: IDENTIFICAZIONE DINAMICA ---
    // 1. Trova la colonna 'name'. Assumiamo che sia l'unica colonna i cui valori non sono sempre numerici.
    // Controlliamo la prima riga di dati per fare questa ipotesi.
    let nameColumn = columns.find(col => isNaN(parseFloat(rawData[0][col])));

    // Fallback: se tutti i valori della prima riga sono numerici,
    // cerchiamo una colonna chiamata 'name', 'label', 'id', o simile.
    if (!nameColumn) {
       const commonNameColumns = ['name', 'label', 'id', 'category', 'item'];
       nameColumn = columns.find(col => commonNameColumns.includes(col.toLowerCase()));
    }
    
    if (!nameColumn) {
        throw new Error("Impossibile identificare la colonna per le etichette (es. 'name'). Assicurati che una colonna contenga valori non numerici.");
    }
    
    // 2. Le chiavi numeriche sono tutte le altre colonne.
    const numericKeys = columns.filter(k => k !== nameColumn);
    
    if (numericKeys.length === 0) {
        throw new Error("Nessuna colonna numerica trovata nel file.");
    }
    

    // 3. Filtra le righe dove il valore della colonna 'name' è vuoto.
    const filtered = rawData.filter(d => d[nameColumn] && String(d[nameColumn]).trim() !== '');
    if (filtered.length === 0) {
        throw new Error(`Nessuna riga con un valore valido nella colonna '${nameColumn}'.`);
    }

    // 4. Mappa i dati, convertendo i valori e creando una proprietà 'name' e 'id' standard.
    const parsedData = filtered.map((row, index) => {
        const copy = { 
            ...row, 
            name: row[nameColumn], // Standardizza l'accesso al nome
            id: `${row[nameColumn]}-${index}` 
        };
        numericKeys.forEach(k => { 
            const num = +copy[k];
            if (!isNaN(num)) {
                copy[k] = num;
            }
        });
        return copy;
    });

    const dataTypeId = classifyNumerically(parsedData, numericKeys);
    
    return { 
        parsedData, 
        features: numericKeys, 
        dataTypeId, 
        classifiedByAI: false
    };
};

/**
 * Funzione per caricare e processare i file precaricati dal server.
 */
export const loadAndClassifyData = async (selectedFile) => {
    const url = `/data/${selectedFile}`;
    const rawData = await d3.csv(url);
    return parseAndClassify(rawData);
};

/**
 * Funzione per processare i file caricati dall'utente.
 */
export const processAndClassifyUploadedData = (fileObject) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const rawData = d3.csvParse(text);
        const result = parseAndClassify(rawData);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Errore durante la lettura del file."));
    };

    reader.readAsText(fileObject);
  });
};