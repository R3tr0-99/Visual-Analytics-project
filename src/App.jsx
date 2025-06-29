import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import './App.css';
import { Grid, Typography, Box, ToggleButton, ToggleButtonGroup, Container } from '@mui/material';
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

  function nodeSelectedChanged(nodesSelected) {
    setSelectedNodes([...nodesSelected]);
  }
  function hoveredNodeChanged(node) {
    setHoveredNode(node);
  }
  function changeType(typeTmp) {
    setType(typeTmp)
  }

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
        Nessun CSV selezionato. Seleziona un file dal menu a tendina.
      </Typography>
    ) : features.length === 0 ? (
      <Typography color="error">
        Errore: il file CSV selezionato non contiene colonne numeriche.
      </Typography>
    ) : (
      <Box sx={{ display: 'flex', height: 'calc(100vh - 80px)', width: '100%', gap: 2 }}>
        {/* Colonna sinistra: Radviz */}
        <Box sx={{ width: '45%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box
            sx={{
              width: '100%',
              height: '100%',
              border: '1px solid #bbb',
              borderRadius: 2,
              p: 1,
              m: 0.5,
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
              style={{ width: '100%', height: '100%' }}
            />
          </Box>
        </Box>

        {/* Colonna destra */}
        <Box sx={{ width: '55%', height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Riga 1 */}
          <Box sx={{ display: 'flex', height: '50%', gap: 2 }}>
            {/* BarChart */}
            <Box sx={{ width: '70%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  border: '1px solid #bbb',
                  borderRadius: 2,
                  p: 1,
                  backgroundColor: '#fff',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BarChart
                  hoveredNode={hoveredNode}
                  features={features}
                  style={{ width: '100%', height: '100%' }}
                />
              </Box>
            </Box>

            {/* RadarNoVectorChart */}
            <Box sx={{ width: '30%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  border: '1px solid #bbb',
                  borderRadius: 2,
                  p: 1,
                  backgroundColor: '#fff',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <RadarNoVectorChart
                  type={type}
                  csvData={csvData}
                  hoveredNode={hoveredNode}
                  features={features}
                  style={{ width: '100%', height: '100%' }}
                />
              </Box>
            </Box>
          </Box>

          {/* Riga 2 */}
          <Box sx={{ display: 'flex', height: '50%', gap: 2 }}>
            {/* StackedBarChart */}
            <Box sx={{ width: '70%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  border: '1px solid #bbb',
                  borderRadius: 2,
                  p: 1,
                  backgroundColor: '#fff',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <StackedBarChart
                  data={csvData}
                  selectedNode={selectedNodes.length > 0 ? selectedNodes[0] : null}
                  style={{ width: '100%', height: '100%' }}
                />
              </Box>
            </Box>

            {/* PieChart */}
            <Box sx={{ width: '30%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  border: '1px solid #bbb',
                  borderRadius: 2,
                  p: 1,
                  backgroundColor: '#fff',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PieChart
                  data={
                    selectedNodes[0]
                      ? features.map((f) => ({ label: f, value: selectedNodes[0][f] }))
                      : []
                  }
                  style={{ width: '100%', height: '100%' }}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    )}
  </Container>
);

}

export default App;
