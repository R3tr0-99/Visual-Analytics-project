import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import './App.css';
import {
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import RadvizChart from './components/radvizChart';
import RadarChart from './components/radarChart';
import RadarNoVectorChart from './components/radarNoVectorChart';
import BarChart from './components/barChart';

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
    <>
      <Typography variant="h3" gutterBottom>
        Dashboard Visual-Analytics
      </Typography>

      <FormControl sx={{ minWidth: 240, mb: 2 }}>
        <InputLabel id="select-csv-label">Scegli CSV</InputLabel>
        <Select
          labelId="select-csv-label"
          id="select-csv"
          value={selectedFile}
          label="Scegli CSV"
          onChange={(e) => setSelectedFile(e.target.value)}
        >
          {fileList.map((fileName) => (
            <MenuItem key={fileName} value={fileName}>
              {fileName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {!selectedFile ? (
        <Typography>
          Nessun CSV selezionato. Seleziona un file dal menu a tendina.
        </Typography>
      ) : (
        <>
          {features.length === 0 ? (
            <Typography color="error">
              Errore: il file CSV selezionato non contiene colonne numeriche.
            </Typography>
          ) : (
            <Grid container spacing={2} sx={{ height: 'calc(100vh - 180px)' }}>
              {/* Colonna sinistra: RADVIZ sopra, BARCHART sotto */}
              <Grid item xs={8} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ flex: 1, minHeight: 0, mb: 2, border: '1px solid #bbb', borderRadius: 2, p: 1, background: '#fff' }}>
                  <RadvizChart
                    changeType={changeType}
                    data={csvData}
                    hoveredNodeChanged={hoveredNodeChanged}
                    nodeSelectedChanged={nodeSelectedChanged}
                  />
                </Box>
                <Box sx={{ flex: 1, minHeight: 0, border: '1px solid #bbb', borderRadius: 2, p: 1, background: '#fff' }}>
                  <BarChart hoveredNode={hoveredNode} features={features} />
                </Box>
              </Grid>
              {/* Colonna destra: RadarNoVectorChart sopra, RadarChart sotto */}
              <Grid item xs={4} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{
                  flex: 1,
                  minHeight: 0,
                  mb: 2,
                  border: '1px solid #bbb',
                  borderRadius: 2,
                  p: 1,
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  // Mantieni quadrato
                  aspectRatio: '1 / 1',
                  maxHeight: '50%',
                }}>
                  <RadarNoVectorChart
                    type={type}
                    csvData={csvData}
                    hoveredNode={hoveredNode}
                    features={features}
                  />
                </Box>
                <Box sx={{
                  flex: 1,
                  minHeight: 0,
                  border: '1px solid #bbb',
                  borderRadius: 2,
                  p: 1,
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  // Mantieni quadrato
                  aspectRatio: '1 / 1',
                  maxHeight: '50%',
                }}>
                  <RadarChart
                    type={type}
                    csvData={csvData}
                    data={selectedNodes}
                    features={features}
                    selectedNodesFromRadviz={selectedNodes}
                  />
                </Box>
              </Grid>
            </Grid>
          )}
        </>
      )}
    </>
  );
}

export default App;