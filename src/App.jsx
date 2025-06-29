import { useCallback, useEffect, useMemo, useState } from 'react';
import * as d3 from 'd3';
import './App.css';
import { Typography, Box, ToggleButton, ToggleButtonGroup, Container } from '@mui/material';
import RadvizChart from './components/radvizChart';
import RadarNoVectorChart from './components/radarNoVectorChart';
import BarChart from './components/barChart';
import StackedBarChart from './components/stackedBarChart';
import PieChart from './components/pieChart';

function App() {
  // Stati React
  const [fileList, setFileList] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [csvData, setCsvData] = useState([]);
  const [features, setFeatures] = useState([]);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [type, setType] = useState("original");

  // Carica lista file CSV
  useEffect(() => {
    fetch('/data/files.json')
      .then((res) => {
        if (!res.ok) throw new Error('Impossibile caricare files.json');
        return res.json();
      })
      .then((lista) => {
        setFileList(lista);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  // Carica dati CSV selezionato
  useEffect(() => {
    if (!selectedFile) {
      setCsvData([]);
      setFeatures([]);
      return;
    }

    const url = `/data/${selectedFile}`;
    d3.csv(url)
      .then((rawData) => {
        const filtered = rawData.filter((d) =>
          Object.values(d).every((v) => v !== null && v !== '')
        );
        const parsed = filtered.map((row) => {
          const copy = { ...row };
          for (const k in copy) {
            if (k === 'name') continue; // Assumendo che 'name' sia una colonna non numerica
            const num = +copy[k];
            if (!isNaN(num)) copy[k] = num;
          }
          return copy;
        });
        setCsvData(parsed);
        if (parsed.length > 0) {
          const firstRow = parsed[0];
          const numericKeys = Object.keys(firstRow).filter(
            (k) => typeof firstRow[k] === 'number'
          );
          setFeatures(numericKeys);
        } else {
          setFeatures([]);
        }
      })
      .catch((err) => {
        console.error('Errore caricamento CSV:', err);
        setCsvData([]);
        setFeatures([]);
      });
  }, [selectedFile]);

  // --- SCALA DI COLORI CONDIVISA ---
  // useMemo calcola la scala solo quando 'features' cambia, migliorando le performance.
  const colorScale = useMemo(() => {
    if (features.length === 0) {
      return null;
    }
    // Mappa ogni feature (dimensione) a un colore specifico.
    return d3.scaleOrdinal()
      .domain(features)
      .range(d3.schemeTableau10); // o un altro schema di colori D3
  }, [features]);


  // --- FUNZIONI MEMOIZZATE CON useCallback PER EVITARE RENDER INFINITI ---
  const nodeSelectedChanged = useCallback((nodesSelected) => {
    setSelectedNodes([...nodesSelected]);
  }, []);

  const hoveredNodeChanged = useCallback((node) => {
    setHoveredNode(node);
  }, []);

  const changeType = useCallback((typeTmp) => {
    setType(currentType => currentType !== typeTmp ? typeTmp : currentType);
  }, []);


  return (
    <Container maxWidth={false} sx={{ height: '100vh', p: 2, boxSizing: 'border-box' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Seleziona un file CSV
        </Typography>
        <ToggleButtonGroup
          value={selectedFile}
          exclusive
          onChange={(e, newValue) => {
            if (newValue !== null) {
              setSelectedFile(newValue);
            }
          }}
          aria-label="file selection"
        >
          {fileList.map((fileName) => (
            <ToggleButton key={fileName} value={fileName} aria-label={fileName}>
              {fileName}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {!selectedFile ? (
        <Typography>
          Nessun CSV selezionato. Seleziona un file per iniziare.
        </Typography>
      ) : csvData.length === 0 && selectedFile ? (
        <Typography>Caricamento dati per {selectedFile}...</Typography>
      ) : (
        <Box sx={{ display: 'flex', height: 'calc(100vh - 100px)', width: '100%', gap: 2 }}>
          {/* Colonna sinistra: Radviz */}
          <Box sx={{ width: '45%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box
              sx={{
                width: '100%',
                height: '100%',
                border: '1px solid #bbb',
                borderRadius: 2,
                p: 1,
                backgroundColor: '#fff',
                display: 'flex',
                overflow: 'hidden',
                boxSizing: 'border-box',
              }}
            >
              <RadvizChart
                changeType={changeType}
                data={csvData}
                hoveredNodeChanged={hoveredNodeChanged}
                nodeSelectedChanged={nodeSelectedChanged}
              />
            </Box>
          </Box>

          {/* Colonna destra */}
          <Box sx={{ width: '55%', height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Riga 1 */}
            <Box sx={{ display: 'flex', height: '50%', gap: 2 }}>
              <Box sx={{ width: '70%', height: '100%', border: '1px solid #bbb', borderRadius: 2, p: 1, backgroundColor: '#fff', boxSizing: 'border-box', overflow: 'hidden' }}>
                  <BarChart
                    hoveredNode={hoveredNode}
                    features={features}
                    colorScale={colorScale} // Passiamo la scala colori anche al BarChart per coerenza
                  />
              </Box>

              <Box sx={{ width: '30%', height: '100%', border: '1px solid #bbb', borderRadius: 2, p: 1, backgroundColor: '#fff', boxSizing: 'border-box', overflow: 'hidden' }}>
                  <RadarNoVectorChart
                    type={type}
                    csvData={csvData}
                    hoveredNode={hoveredNode}
                    features={features}
                  />
              </Box>
            </Box>

            {/* Riga 2 */}
            <Box sx={{ display: 'flex', height: '50%', gap: 2 }}>
              <Box sx={{ width: '70%', height: '100%', border: '1px solid #bbb', borderRadius: 2, p: 1, backgroundColor: '#fff', boxSizing: 'border-box', overflow: 'hidden' }}>
                  <StackedBarChart
                    data={csvData}
                    selectedNode={selectedNodes.length > 0 ? selectedNodes[0] : null}
                    colorScale={colorScale} // Passa la scala colori condivisa
                  />
              </Box>

              <Box sx={{ width: '30%', height: '100%', border: '1px solid #bbb', borderRadius: 2, p: 1, backgroundColor: '#fff', boxSizing: 'border-box', overflow: 'hidden' }}>
                  <PieChart
                     data={
                      selectedNodes.length > 0 && selectedNodes[0].dimensions
                        ? Object.entries(selectedNodes[0].dimensions).map(([key, val]) => ({ label: key, value: val }))
                        : []
                     }
                     colorScale={colorScale} // Passa la stessa scala colori condivisa
                  />
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Container>
  );
}

export default App;