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
  const [fileList, setFileList] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [csvData, setCsvData] = useState([]);
  const [features, setFeatures] = useState([]);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [type, setType] = useState("original");

  useEffect(() => {
    fetch('/data/files.json')
      .then((res) => {
        if (!res.ok) throw new Error('Impossibile caricare files.json');
        return res.json();
      })
      .then((lista) => setFileList(lista))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setCsvData([]);
      setFeatures([]);
      return;
    }

    const url = `/data/${selectedFile}`;
    d3.csv(url)
      .then((rawData) => {
        if (!rawData || rawData.length === 0) {
            setCsvData([]);
            setFeatures([]);
            return;
        }

        // --- FIX: Filtro corretto. Mantiene le righe che hanno un 'name'. ---
        // La logica precedente era troppo aggressiva e scartava righe con celle vuote.
        const filtered = rawData.filter((d) => d.name && d.name.trim() !== '');

        const parsed = filtered.map((row) => {
          const copy = { ...row };
          for (const k in copy) {
            if (k === 'name') continue;
            // La conversione a numero qui gestisce correttamente le stringhe vuote (diventano 0)
            const num = +copy[k]; 
            if (!isNaN(num)) copy[k] = num;
          }
          return copy;
        });

        setCsvData(parsed);

        const allColumns = rawData.columns;
        const numericKeys = allColumns.filter(k => k !== 'name');
        setFeatures(numericKeys);
        
      })
      .catch((err) => {
        console.error('Errore caricamento CSV:', err);
        setCsvData([]);
        setFeatures([]);
      });
  }, [selectedFile]);

  const colorScale = useMemo(() => {
    if (features.length === 0) return null;
    return d3.scaleOrdinal().domain(features).range(d3.schemeTableau10);
  }, [features]);

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
            if (newValue !== null) setSelectedFile(newValue);
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
        <Typography>Nessun CSV selezionato. Seleziona un file per iniziare.</Typography>
      ) : csvData.length === 0 && selectedFile ? (
        <Typography>Caricamento dati per {selectedFile}...</Typography>
      ) : (
        <Box sx={{ display: 'flex', height: 'calc(100vh - 100px)', width: '100%', gap: 2 }}>
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

          <Box sx={{ width: '55%', height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', height: '50%', gap: 2 }}>
              <Box sx={{ width: '70%', height: '100%', border: '1px solid #bbb', borderRadius: 2, p: 1, backgroundColor: '#fff', boxSizing: 'border-box', overflow: 'hidden' }}>
                  <BarChart
                    hoveredNode={hoveredNode}
                    features={features}
                    colorScale={colorScale}
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

            <Box sx={{ display: 'flex', height: '50%', gap: 2 }}>
              <Box sx={{ width: '70%', height: '100%', border: '1px solid #bbb', borderRadius: 2, p: 1, backgroundColor: '#fff', boxSizing: 'border-box', overflow: 'hidden' }}>
                  <StackedBarChart
                    data={csvData}
                    selectedNode={selectedNodes.length > 0 ? selectedNodes[0] : null}
                    colorScale={colorScale}
                  />
              </Box>

              <Box sx={{ width: '30%', height: '100%', border: '1px solid #bbb', borderRadius: 2, p: 1, backgroundColor: '#fff', boxSizing: 'border-box', overflow: 'hidden' }}>
                  <PieChart
                     data={
                      selectedNodes.length > 0 && selectedNodes[0].dimensions
                        ? Object.entries(selectedNodes[0].dimensions).map(([key, val]) => ({ label: key, value: val }))
                        : []
                     }
                     colorScale={colorScale}
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