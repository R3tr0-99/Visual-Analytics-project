# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


# File: 1_unconstrained_data.csv
#####################################################################################################
# TIPO DI DATO: 1. Unconstrained Data (Dati non vincolati)
#
# Cos'è: È il caso più generale e problematico. Gli attributi del dataset non sono correlati
# tra loro (semanticamente diversi) e ognuno ha un suo Dominio Attivo completamente diverso.
#
# Esempio: Un catalogo di prodotti elettronici con attributi come prezzo, peso e valutazione.
#
# Problema: La normalizzazione min-max è estremamente fuorviante. Un valore normalizzato
# di 0.5 per il prezzo corrisponde a un valore originale molto diverso da un valore normalizzato
# di 0.5 per il peso. Confrontare la "dominanza" di questi attributi nel grafico RadViz è
# privo di senso. Inoltre, l'analisi è instabile: aggiungere un nuovo prodotto può cambiare
# i valori minimi/massimi e quindi la posizione di tutti i punti nel grafico.
#
# Conclusione degli autori: RadViz NON è adatto per questo tipo di dati.


# File: 2_unconstrained_positive_data.csv
#####################################################################################################
# TIPO DI DATO: 2. Unconstrained Positive Data (Dati non vincolati e positivi)
#
# Cos'è: Un sotto-caso del precedente. I domini sono ancora diversi e non correlati, ma è
# garantito che tutti i valori siano positivi.
#
# Esempio: Risultati di analisi di laboratorio (temperatura, pressione, salinità).
#
# Problema: Nonostante i valori siano tutti positivi, i problemi di comparabilità e stabilità
# della normalizzazione rimangono identici al caso "Unconstrained". I confronti tra attributi
# sono ancora privi di significato pratico.
#
# Conclusione degli autori: Anche in questo caso, RadViz NON è uno strumento consigliato.
# File: 3_fixed_domains_data.csv
#####################################################################################################
# TIPO DI DATO: 3. Data with Fixed Active Domains (Dati con Domini Attivi Fissati)
#
# Cos'è: Si decide di "fissare" i domini di normalizzazione a valori predefiniti e standard
# (es. i Domini Reali), che non cambiano anche se il dataset viene aggiornato. Tuttavia, i
# domini fissati possono essere diversi tra loro.
#
# Esempio: Punteggi di candidati (GPA su scala 0-4, SAT su scala 400-1600).
#
# Vantaggio: Il grafico diventa stabile. Aggiungere nuovi dati non cambia la posizione dei
# punti esistenti.
#
# Problema Residuo: Se gli attributi hanno domini fissati ma DIVERSI, il problema della
# comparabilità rimane. La normalizzazione agisce ancora in modo diverso su ogni attributo.
#
# Conclusione: L'utilità di RadViz è limitata, ma almeno l'analisi è stabile nel tempo.


# File: 4_fixed_common_domains_data.csv
#####################################################################################################
# TIPO DI DATO: 4. Data with Fixed and Common Active Domains (Dati con Domini Fissati e Comuni)
#
# Cos'è: Questo è un caso molto più favorevole. Tutti gli attributi sono semanticamente
# simili e condividono lo STESSO IDENTICO Dominio Attivo fissato [Min, Max].
#
# Esempio: I voti che uno studente ha preso in diversi esami (es. Matematica, Fisica),
# tutti valutati nella stessa scala [18, 30].
#
# Vantaggio Enorme: Poiché il divisore (Max - Min) è lo stesso per tutti gli attributi, la
# normalizzazione preserva l'ordine dei valori originali. Se nel grafico un punto è più
# vicino a "Esame A" che a "Esame B", possiamo concludere che il voto originale di A è
# maggiore di quello di B (p'i > p'j ==> pi > pj).
#
# Conclusione: RadViz è UTILE per questo tipo di dati per fare confronti RELATIVI affidabili.

# File: 5_domain_is_0_1_data.csv
#####################################################################################################
# TIPO DI DATO: 5. Data with all Active Domains fixed to [0,1]
#
# Cos'è: I dati sono già naturalmente espressi in un intervallo da 0 a 1 (es. percentuali,
# tassi di successo, probabilità, punteggi già normalizzati).
#
# Esempio: Risultati di trial clinici, dove ogni valore è un tasso o una probabilità.
#
# Vantaggio: Non serve alcuna normalizzazione (o la normalizzazione è p'i = pi). Il valore
# nel grafico corrisponde al valore originale, eliminando ogni distorsione. L'analisi è
# diretta e affidabile.
#
# Conclusione: RadViz è un OTTIMO strumento per questa categoria di dati.

# File: 6_partitions_data.csv
#####################################################################################################
# TIPO DI DATO: 6. Data that represent Partitions (Dati che rappresentano Partizioni)
#
# Cos'è: È un caso speciale e ideale. I valori di ogni riga non solo sono tra 0 e 1, ma la
# loro somma è uguale a 1 (o 100%).
#
# Esempio: Le quote di mercato di diverse aziende in varie città. Per ogni città (riga),
# la somma delle quote di mercato (colonne) è 100%.
#
# Vantaggio: Questo è il CASO D'USO PERFETTO per RadViz. La metafora delle "forze delle
# molle" usata per spiegare RadViz si sposa perfettamente con questo tipo di dati. Non
# solo non c'è distorsione, ma diventa possibile stimare direttamente i valori dal grafico
# e usare tecniche avanzate (come le "boundary lines") per analisi quantitative.
#
# Conclusione: RadViz è lo strumento IDEALE per analizzare partizioni.
