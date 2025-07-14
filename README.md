# RadViz Data-Type Visualizer

Questo progetto è un'applicazione web interattiva, costruita con **React, Vite e D3.js**, che serve come dimostrazione pratica dei concetti presentati nel paper di ricerca **"To RadViz or not to RadViz"** (Ficorella et al., EuroVis 2023).

L'obiettivo è visualizzare come la tecnica di visualizzazione RadViz si comporta con differenti tipologie di dati, evidenziandone i punti di forza e le criticità a seconda della natura dei domini degli attributi.

## Il Concetto Chiave: RadViz e la Tipologia dei Dati

RadViz è una potente tecnica per visualizzare dati multidimensionali in uno scatterplot 2D. Tuttavia, la sua efficacia non è assoluta, ma dipende strettamente dalla natura dei dati. Come analizzato nella **Sezione 4.3 del paper**, la normalizzazione e la semantica dei domini degli attributi giocano un ruolo cruciale.

Questa applicazione permette di caricare diversi dataset, ognuno rappresentante una delle sei categorie di dati identificate nel paper, per osservare direttamente come l'interpretabilità del grafico cambi radicalmente.

## Funzionalità Principali

*   **Visualizzazioni Multiple Sincronizzate**: Interagisci con RadViz, Stacked Bar Chart, Pie Chart, Bar Chart e Radar Chart. La selezione di un nodo si riflette su tutti i grafici.
*   **Caricamento di Dati Esemplificativi**: Seleziona dal menu uno dei sei tipi di dataset per testare diversi scenari.
*   **Classificazione Automatica dei Dati**: L'applicazione analizza il file CSV caricato e ne identifica la tipologia secondo le categorie del paper, mostrando il risultato nella scheda "Proprietà Dati".
*   **Controllo Interattivo**:
    *   Filtra il numero di righe da visualizzare.
    *   Seleziona/deseleziona le dimensioni (attributi) da includere nell'analisi.
    *   Ingrandisci ogni grafico per un'analisi più dettagliata.
*   **Animazione dell'Euristica**: All'avvio, il grafico RadViz utilizza l'euristica EEMH (Effectiveness Error Heuristic) per trovare una disposizione ottimale degli assi, come suggerito nel paper per mitigare i problemi di posizionamento.

## Classificazione dei Dati in Pratica (Sezione 4.3 del Paper)

L'applicazione dimostra le seguenti 6 categorie di dati. Puoi caricarle dal menu laterale per vedere i risultati.

### 1. Dati non Vincolati (Unconstrained Data)
*   **Descrizione**: Il caso più generale e problematico. Gli attributi sono semanticamente diversi e hanno domini di valori molto differenti (es. prezzo, peso, valutazione).
*   **File di Esempio**: Non implementato.
*   **Conclusione del Paper**: **RadViz NON è adatto**. I confronti tra le "dominanze" degli attributi sono privi di senso e l'analisi è instabile.

### 2. Dati non Vincolati e Positivi (Unconstrained Positive Data)
*   **Descrizione**: Sotto-caso del precedente in cui tutti i valori sono positivi, ma i domini rimangono non correlati.
*   **File di Esempio**: `2_unconstrained_positive_data.csv`
*   **Conclusione del Paper**: **RadViz NON è consigliato**. I problemi di comparabilità e stabilità rimangono.

### 3. Dati con Domini Fissati (Data with Fixed Active Domains)
*   **Descrizione**: I domini di normalizzazione sono fissati a valori predefiniti (es. GPA 0-4, SAT 400-1600), rendendo il grafico stabile all'aggiunta di nuovi dati.
*   **File di Esempio**: `3_fixed_domains_data.csv`
*   **Conclusione del Paper**: **Utilità Limitata**. Il grafico è stabile, ma se i domini sono diversi, la comparabilità tra attributi è ancora problematica.

### 4. Dati con Domini Fissati e Comuni (Data with Fixed and Common Active Domains)
*   **Descrizione**: Il caso favorevole. Tutti gli attributi sono semanticamente simili e condividono lo **stesso identico dominio** (es. voti di esami tutti su scala 18-30).
*   **File di Esempio**: `4_fixed_common_domains_data.csv`
*   **Conclusione del Paper**: **RadViz è UTILE**. La normalizzazione preserva l'ordine dei valori originali, permettendo confronti relativi affidabili.

### 5. Dati con Dominio [0, 1] (Data with all Active Domains fixed to [0,1])
*   **Descrizione**: I dati sono già naturalmente espressi come percentuali o probabilità (0-1).
*   **File di Esempio**: `5_domain_is_0_1_data.csv`
*   **Conclusione del Paper**: **RadViz è un OTTIMO strumento**. Non è necessaria alcuna normalizzazione distorsiva, e l'analisi è diretta.

### 6. Dati come Partizioni (Data that represent Partitions)
*   **Descrizione**: Il caso d'uso ideale. I valori di ogni riga non solo sono tra 0 e 1, ma la loro somma è 1 (100%).
*   **File di Esempio**: `6_partitions_data.csv`
*   **Conclusione del Paper**: **RadViz è lo STRUMENTO IDEALE**. La metafora delle "forze delle molle" si applica perfettamente, permettendo analisi quantitative accurate.

## Struttura del Progetto

```text
/
├── public/
│   └── data/                 # Contiene i file .csv e files.json
├── src/
│   ├── components/           # Componenti React per ogni grafico (Radviz, BarChart, etc.)
│   ├── services/             # Logica per il caricamento e la classificazione dei dati
│   ├── App.jsx               # Componente principale dell'applicazione
│   └── main.jsx              # Punto di ingresso di React
└── README.md
```

## Crediti e Riferimenti

Questo lavoro è un'implementazione e una dimostrazione pratica dei concetti presentati nel seguente paper di ricerca, a cui si deve il fondamento teorico del progetto:

> M. Ficorella, S. Lenti, and G. Santucci, **"To RadViz or not to RadViz"**, in *Eurographics Conference on Visualization (EuroVis) 2023*, D. Archambault, R. Bujack, and T. Schreck (Guest Editors), vol. 42, no. 3, 2023.
