import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import './App.css';
import { Grid, Typography, Box, ToggleButton, ToggleButtonGroup, Container } from '@mui/material';
import RadvizChart from './components/radvizChart';
import RadarChart from './components/radarChart';
import RadarNoVectorChart from './components/radarNoVectorChart';
import BarChart from './components/barChart';
import StackedBarChart from './components/stackedBarChart';

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

  // Layout: due colonne, sinistra larga (8/12), destra stretta (4/12), ogni colonna con due box impilati
  return (
    <Container maxWidth="false">

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
        <Grid container spacing={2} sx={{ height: 'calc(100vh - 180px)' }}>
          {/* Colonna sinistra: Radviz occupa almeno metà larghezza */}
          <Grid size={{ xs: 12, md: 6 }} >
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                border: '1px solid #bbb',
                borderRadius: 2,
                p: 1,
                background: '#fff',
                display: 'flex',
              }}
            >
              <RadvizChart
                changeType={changeType}
                data={csvData}
                hoveredNodeChanged={hoveredNodeChanged}
                nodeSelectedChanged={nodeSelectedChanged}
                style={{ flex: 1, width: '100%', height: '100%' }}
              />
            </Box>
          </Grid>

          {/* Colonna destra: occupa l'altra metà */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Box
                sx={{
                  height: '50vh',
                  flex: 1,
                  minHeight: 0,
                  mb: 2,
                  border: '1px solid #bbb',
                  borderRadius: 2,
                  p: 1,
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <BarChart hoveredNode={hoveredNode} features={features} />
              </Box>

              {/* RadarNoVectorChart e STACKEDBARCHART sotto */}
              <Grid container spacing={2}>
                {/*RADARNOVECTORCHART */}
                <Grid size={{ xs: 12, xl: 6 }}>
                  <Box
                    sx={{
                      flex: 2,
                      minHeight: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        flex: 1,
                        minHeight: 0,
                        border: '1px solid #bbb',
                        borderRadius: 2,
                        p: 1,
                        background: '#fff',
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
                    {/* <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    border: '1px solid #bbb',
                    borderRadius: 2,
                    p: 1,
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <RadarChart
                    type={type}
                    csvData={csvData}
                    data={selectedNodes}
                    features={features}
                    selectedNodesFromRadviz={selectedNodes}
                    style={{ width: '100%', height: '100%' }}
                  />
                </Box> */}
                  </Box>
                </Grid>
                {/*STACKEDBARCHART */}
                <Grid size={{ xs: 12, xl: 6 }}>
                  <Box
                    sx={{
                      flex: 1,
                      minHeight: 0,
                      mb: 2,
                      border: '1px solid #bbb',
                      borderRadius: 2,
                      p: 1,
                      background: '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <StackedBarChart data={csvData} />

                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      )}
    </Container>
  );


}

export default App;