import { useCallback, useEffect, useMemo, useState, createRef, useRef } from 'react';
import * as d3 from 'd3';
import './App.css';
import { 
  Typography, Box, ToggleButton, ToggleButtonGroup, Container, Slider, Modal, IconButton, Tooltip,
  Accordion, AccordionSummary, AccordionDetails, Paper, Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings'; 
import RadvizChart from './components/radvizChart';
import RadarChart from './components/radarChart';
import BarChart from './components/barChart';
import StackedBarChart from './components/stackedBarChart';
import PieChart from './components/pieChart';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90vw',
  height: '90vh',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 2,
  display: 'flex',
  flexDirection: 'column',
};

function App() {
  const [fileList, setFileList] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [csvData, setCsvData] = useState([]);
  const [features, setFeatures] = useState([]);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [type, setType] = useState("original");
  const [numberOfRows, setNumberOfRows] = useState(0);
  const [zoomedChart, setZoomedChart] = useState(null);
  const pieChartRefs = useRef([]);
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  const handleZoom = (chartKey) => {
    setZoomedChart(current => (current === chartKey ? null : chartKey));
  };
  
  useEffect(() => {
    fetch('/data/files.json')
      .then((res) => res.json())
      .then((lista) => setFileList(lista))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setCsvData([]); setFeatures([]); setNumberOfRows(0); return;
    }
    const url = `/data/${selectedFile}`;
    d3.csv(url).then(rawData => {
      if (!rawData || rawData.length === 0) {
        setCsvData([]); setFeatures([]); setNumberOfRows(0); return;
      }
      const filtered = rawData.filter(d => d.name && d.name.trim() !== '');
      const numericKeys = Object.keys(filtered[0] || {}).filter(k => k !== 'name' && !isNaN(parseFloat(filtered[0][k])));
      const parsed = filtered.map((row, index) => {
        const copy = { ...row, id: `${row.name}-${index}` };
        numericKeys.forEach(k => { const num = +copy[k]; if (!isNaN(num)) copy[k] = num; });
        return copy;
      });
      setCsvData(parsed);
      setNumberOfRows(parsed.length);
      setFeatures(numericKeys);
    }).catch(err => {
      console.error('Errore caricamento CSV:', err);
      setCsvData([]); setFeatures([]); setNumberOfRows(0);
    });
  }, [selectedFile]);

  const slicedData = useMemo(() => {
    if (!csvData || csvData.length === 0) return [];
    // Mostra le prime N righe, dove N è il valore dello slider
    const count = Math.min(Math.max(1, numberOfRows || 0), csvData.length);
    return csvData.slice(0, count);
  }, [csvData, numberOfRows]);

  useEffect(() => {
    pieChartRefs.current = Array(slicedData.length).fill().map((_, i) => pieChartRefs.current[i] || createRef());
  }, [slicedData.length]);

  const handleBarClick = useCallback((clickedNodeName) => {
    const nodeIndex = slicedData.findIndex(node => node.name === clickedNodeName);
    if (nodeIndex !== -1 && pieChartRefs.current[nodeIndex]?.current) {
      pieChartRefs.current[nodeIndex].current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
    const nodeToSelect = slicedData.find(node => node.name === clickedNodeName);
    if (nodeToSelect) {
      const isAlreadySelected = selectedNodes.some(n => n.id === nodeToSelect.id);
      if (isAlreadySelected && selectedNodes.length === 1) {
        setSelectedNodes([]);
      } else {
        const radvizNodeStructure = {
            ...nodeToSelect,
            attributes: { name: nodeToSelect.name },
            dimensions: Object.fromEntries(features.map(f => [f, nodeToSelect[f] ?? 0]))
        };
        setSelectedNodes([radvizNodeStructure]);
      }
    }
  }, [slicedData, selectedNodes, features]);

  const colorScale = useMemo(() => {
    if (features.length === 0) return null;
    return d3.scaleOrdinal().domain(features).range(d3.schemeTableau10);
  }, [features]);

  const nodeSelectedChanged = useCallback((nodesSelected) => {
    setSelectedNodes(nodesSelected);
  }, []);

  const hoveredNodeChanged = useCallback((node) => {
    setHoveredNode(node);
  }, []);

  const changeType = useCallback((typeTmp) => {
    setType(currentType => currentType !== typeTmp ? typeTmp : currentType);
  }, []);
  
  // Funzione che imposta un numero casuale di righe
  const handleRandomSelection = useCallback(() => {
    if (csvData.length === 0) return;
    // Genera un numero casuale tra 1 e il numero massimo di righe
    const randomRowCount = Math.floor(Math.random() * csvData.length) + 1;
    // Aggiorna lo stato, che a sua volta aggiornerà lo slider
    setNumberOfRows(randomRowCount);
  }, [csvData.length]);


  const chartComponents = {
    radviz: <RadvizChart changeType={changeType} data={slicedData} hoveredNodeChanged={hoveredNodeChanged} nodeSelectedChanged={nodeSelectedChanged} selectedNodes={selectedNodes} />,
    bar: <BarChart hoveredNode={hoveredNode} selectedNode={selectedNodes.length > 0 ? selectedNodes[0] : null} features={features} colorScale={colorScale} />,
    radar: <Box sx={{width: '100%', height: '100%'}}><RadarChart data={slicedData} features={features} type={type} /></Box>,
    stacked: <StackedBarChart data={slicedData} selectedNode={selectedNodes.length > 0 ? selectedNodes[0] : null} colorScale={colorScale} onBarClick={handleBarClick} />,
    pie: (
      <Box sx={{ display: 'flex', flexDirection: 'row', height: '100%', width: '100%', overflowX: 'auto', '&::-webkit-scrollbar': { height: '8px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: '#ccc', borderRadius: '4px' } }}>
        {slicedData.map((node, index) => (
          <Box key={node.id} ref={pieChartRefs.current[index]} sx={{ minWidth: '300px', height: '100%', flexShrink: 0 }}>
            <PieChart title={`Nodo: ${node.name || node.id}`} data={features.map(key => ({ label: key, value: node[key] }))} colorScale={colorScale} />
          </Box>
        ))}
      </Box>
    )
  };


  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <Paper
        elevation={4}
        sx={{
          width: isMenuOpen ? '350px' : '60px',
          flexShrink: 0,
          height: '100vh',
          transition: 'width 0.3s ease',
          overflow: 'hidden',
          position: 'relative',
          borderRadius: 0,
        }}
      >
        <Accordion
          expanded={isMenuOpen}
          onChange={() => setIsMenuOpen(!isMenuOpen)}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="controls-panel-content"
            id="controls-panel-header"
            sx={{ 
                height: '60px',
                "& .MuiAccordionSummary-content": {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                }
            }}
          >
            <SettingsIcon />
            {isMenuOpen && <Typography variant="h6">Impostazioni</Typography>}
          </AccordionSummary>
          
          <AccordionDetails sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{textAlign: 'center', mb: 1}}>Seleziona File CSV</Typography>
              <ToggleButtonGroup 
                value={selectedFile} 
                exclusive 
                onChange={(e, newValue) => { if (newValue !== null) setSelectedFile(newValue); }} 
                aria-label="file selection"
                orientation="vertical"
              >
                {fileList.map((fileName) => (<ToggleButton sx={{textTransform: 'none'}} key={fileName} value={fileName} aria-label={fileName}>{fileName}</ToggleButton>))}
              </ToggleButtonGroup>
            </Box>
            {csvData.length > 0 && (
              <Box sx={{ width: '90%' }}>
                <Typography id="tuple-slider" gutterBottom>Numero di Righe: {numberOfRows}</Typography>
                <Slider aria-labelledby="tuple-slider" value={numberOfRows} onChange={(e, newValue) => setNumberOfRows(newValue)} min={1} max={csvData.length} valueLabelDisplay="auto" />
                <Button variant="outlined" onClick={handleRandomSelection} fullWidth sx={{ mt: 4 }}>
                  Selezione Random
                </Button>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </Paper>

      <Container maxWidth={false} sx={{ flexGrow: 1, p: 2, height: '100%', boxSizing: 'border-box' }}>
        {!selectedFile ? (
          <Typography sx={{textAlign: 'center', mt: 4}}>Seleziona un file dal menu a sinistra per iniziare.</Typography>
        ) : slicedData.length === 0 && selectedFile ? (
          <Typography sx={{textAlign: 'center', mt: 4}}>Caricamento dati per {selectedFile}...</Typography>
        ) : (
          <Box sx={{ display: 'flex', height: '100%', width: '100%', gap: 2 }}>
            <Box sx={{ width: '45%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tooltip title="Doppio click per ingrandire"><Paper onDoubleClick={() => handleZoom('radviz')} sx={{ width: '100%', height: '100%', p: 1, overflow: 'hidden', display:'flex' }}>{chartComponents.radviz}</Paper></Tooltip>
            </Box>
            <Box sx={{ width: '55%', height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', height: '50%', gap: 2 }}>
                <Tooltip title="Doppio click per ingrandire"><Paper onDoubleClick={() => handleZoom('bar')} sx={{ width: '70%', height: '100%', p: 1, overflow: 'hidden' }}>{chartComponents.bar}</Paper></Tooltip>
                <Tooltip title="Doppio click per ingrandire"><Paper onDoubleClick={() => handleZoom('radar')} sx={{ width: '30%', height: '100%', p: 1, overflow: 'hidden', display: 'flex', alignItems:'center', justifyContent:'center' }}>{chartComponents.radar}</Paper></Tooltip>
              </Box>
              <Box sx={{ display: 'flex', height: '50%', gap: 2 }}>
                <Tooltip title="Doppio click per ingrandire"><Paper onDoubleClick={() => handleZoom('stacked')} sx={{ width: '70%', height: '100%', p: 1, overflow: 'hidden' }}>{chartComponents.stacked}</Paper></Tooltip>
                <Tooltip title="Doppio click per ingrandire"><Paper onDoubleClick={() => handleZoom('pie')} sx={{ width: '30%', height: '100%', p: 1, overflow: 'hidden' }}>{chartComponents.pie}</Paper></Tooltip>
              </Box>
            </Box>
          </Box>
        )}
      </Container>
      
      <Modal open={zoomedChart !== null} onClose={() => handleZoom(null)} aria-labelledby="zoomed-chart-title">
        <Box sx={modalStyle}>
          <IconButton aria-label="close" onClick={() => handleZoom(null)} sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500],}}><CloseIcon /></IconButton>
          {zoomedChart && chartComponents[zoomedChart]}
        </Box>
      </Modal>
    </Box>
  );
}

export default App;