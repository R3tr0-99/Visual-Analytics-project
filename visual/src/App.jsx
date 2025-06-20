// src/App.jsx
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

  // 1. All’avvio, carico public/data/files.json per ottenere l’elenco dei .csv
  useEffect(() => {
    fetch('/data/files.json')
      .then((res) => {
        if (!res.ok) throw new Error('Impossibile caricare files.json');
        return res.json();
      })
      .then((lista) => {
        // lista es. ["partiti.csv", "voti_regioni.csv", "candidates.csv"]
        setFileList(lista);
        // (opzionale) se vuoi pre-selezionare il primo:
        // if (lista.length > 0) setSelectedFile(lista[0]);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setCsvData([]);
      setFeatures([]);
      return;
    }

    const url = `/data/${selectedFile}`; // es. "/data/partiti.csv"
    d3.csv(url)
      .then((rawData) => {
        // Filtra eventuali righe con campi nulli o stringhe vuote
        const filtered = rawData.filter((d) =>
          Object.values(d).every((v) => v !== null && v !== '')
        );

        // Converte le stringhe numeriche in veri Number
        const parsed = filtered.map((row) => {
          const copy = { ...row };
          for (const k in copy) {
            const num = +copy[k];
            if (!isNaN(num)) copy[k] = num; // se era stringa-numerica, la trasformo
          }
          return copy;
        });

        setCsvData(parsed);

        // Trovo tutte le colonne che adesso sono typeof number
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
            <Grid container spacing={2}>
              <Grid item xs={12} sx={{ border: '1px solid black', p: 1 }}>
                <RadvizChart
                  changeType={changeType}
                  data={csvData}
                  hoveredNodeChanged={hoveredNodeChanged}
                  nodeSelectedChanged={nodeSelectedChanged}
                />
              </Grid>
              <Grid item xs={6} sx={{ border: '1px solid black', p: 1 }}>
                <BarChart hoveredNode={hoveredNode} features={features} />
              </Grid>
              <Grid item xs={6} sx={{ border: '1px solid black', p: 1 }}>
                <RadarNoVectorChart
                  type={type}
                  csvData={csvData}
                  hoveredNode={hoveredNode}
                  features={features}
                />
              </Grid>
              <Grid item xs={12} sx={{ border: '1px solid black', p: 1 }}>
                <RadarChart
                  type={type}
                  csvData={csvData}
                  data={selectedNodes}
                  features={features}
                  selectedNodesFromRadviz={selectedNodes}
                />
              </Grid>
            </Grid>
          )}
        </>
      )}
    </>
  );
}

export default App;
