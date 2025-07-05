import { useCallback, useEffect, useMemo, useState, createRef, useRef } from 'react';
import * as d3 from 'd3';
// L'import di App.css è stato rimosso
import {
  Typography, Box, ToggleButton, ToggleButtonGroup, Container, Slider, Modal, IconButton, Tooltip,
  Accordion, AccordionSummary, AccordionDetails, Paper, Button, FormGroup, FormControlLabel, Checkbox
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';
import RadvizChart from './components/RadvizChart';
import RadarChart from './components/radarChart';
import BarChart from './components/barChart';
import StackedBarChart from './components/stackedBarChart';
import PieChart from './components/pieChart';
import InfoIcon from '@mui/icons-material/Info';


// --- FUNZIONE DI CLASSIFICAZIONE (invariata) ---
const classifyCsvData = (data, features) => {
  if (!data?.length || !features?.length) {
    return 'Dati Insufficienti o Non Numerici';
  }
  const epsilon = 1e-4;
  for (const row of data) {
    let sum = 0;
    for (const f of features) {
      const v = row[f];
      if (typeof v !== 'number' || isNaN(v) || v < 0 || v > 1) {
        return 'Dati Non Partizionali';
      }
      sum += v;
    }
    if (Math.abs(sum - 1) > epsilon) {
      return 'Valori in [0,1] ma non partizionali';
    }
  }
  return 'Dati Partizionali (valori in [0,1], somma righe ≈ 1)';
};

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
  const [visibleFeatures, setVisibleFeatures] = useState([]);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [type, setType] = useState("original");
  const [numberOfRows, setNumberOfRows] = useState(0);
  const [zoomedChart, setZoomedChart] = useState(null);
  const pieChartRefs = useRef([]);
  const [isMenuOpen, setIsMenuOpen] = useState(true); // Stato per il pannello laterale
  const [dataType, setDataType] = useState(null);

  useEffect(() => {
    fetch('/data/files.json')
      .then((res) => res.json())
      .then((lista) => setFileList(lista))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setCsvData([]); setFeatures([]); setVisibleFeatures([]); setNumberOfRows(0); setSelectedNodes([]); setDataType(null);
      return;
    }
    const url = `/data/${selectedFile}`;
    d3.csv(url).then(rawData => {
      if (!rawData || rawData.length === 0) {
        setCsvData([]); setFeatures([]); setVisibleFeatures([]); setNumberOfRows(0); setDataType(null);
        return;
      }
      const filtered = rawData.filter(d => d.name && d.name.trim() !== '');
      const numericKeys = Object.keys(filtered[0] || {}).filter(k => k !== 'name' && !isNaN(parseFloat(filtered[0][k])));
      
      const parsed = filtered.map((row, index) => {
        const copy = { ...row, id: `${row.name}-${index}` };
        numericKeys.forEach(k => { const num = +copy[k]; if (!isNaN(num)) copy[k] = num; });
        return copy;
      });

      const detectedType = classifyCsvData(parsed, numericKeys);
      setDataType(detectedType);

      setCsvData(parsed);
      setNumberOfRows(parsed.length);
      setFeatures(numericKeys);
      setVisibleFeatures(numericKeys);
      setSelectedNodes([]);
    }).catch(err => {
      console.error('Errore caricamento CSV:', err);
      setCsvData([]); setFeatures([]); setVisibleFeatures([]); setNumberOfRows(0); setDataType(null);
    });
  }, [selectedFile]);

  const slicedData = useMemo(() => {
    if (!csvData || csvData.length === 0) return [];
    const count = Math.min(Math.max(1, numberOfRows || 0), csvData.length);
    return csvData.slice(0, count);
  }, [csvData, numberOfRows]);

  useEffect(() => {
    pieChartRefs.current = Array(slicedData.length).fill().map((_, i) => pieChartRefs.current[i] || createRef());
  }, [slicedData.length]);

  const handleNodeSelection = useCallback((nodeName) => {
    if (nodeName === null) {
        setSelectedNodes([]);
        return;
    }

    const nodeToSelect = slicedData.find(node => node.name === nodeName);
    if (!nodeToSelect) return;

    const isAlreadySelected = selectedNodes.some(n => n.id === nodeToSelect.id);
    if (isAlreadySelected) {
      setSelectedNodes([]);
    } else {
      const selectionObject = {
        ...nodeToSelect,
        attributes: { name: nodeToSelect.name },
        dimensions: Object.fromEntries(features.map(f => [f, nodeToSelect[f] ?? 0]))
      };
      setSelectedNodes([selectionObject]);
    }
  }, [slicedData, selectedNodes, features]);

  const handleBarClick = useCallback((clickedNodeName) => {
    const nodeIndex = slicedData.findIndex(node => node.name === clickedNodeName);
    if (nodeIndex !== -1 && pieChartRefs.current[nodeIndex]?.current) {
      pieChartRefs.current[nodeIndex].current.scrollIntoView({
        behavior: 'smooth', block: 'nearest', inline: 'center'
      });
    }
    handleNodeSelection(clickedNodeName);
  }, [slicedData, handleNodeSelection]);

  const handleZoom = (chartKey) => setZoomedChart(current => (current === chartKey ? null : chartKey));
  const hoveredNodeChanged = useCallback((node) => setHoveredNode(node), []);
  const changeType = useCallback((typeTmp) => setType(typeTmp), []);
  const handleRandomSelection = useCallback(() => {
    if (csvData.length === 0) return;
    setNumberOfRows(Math.floor(Math.random() * csvData.length) + 1);
  }, [csvData.length]);

  const handleFeatureToggle = useCallback((featureToToggle) => {
    setVisibleFeatures(currentVisible => {
      const isVisible = currentVisible.includes(featureToToggle);
      if (isVisible) {
        return currentVisible.length <= 2 ? currentVisible : currentVisible.filter(f => f !== featureToToggle);
      } else {
        return [...currentVisible, featureToToggle];
      }
    });
  }, []);

  const colorScale = useMemo(() => {
    if (features.length === 0) return null;
    return d3.scaleOrdinal().domain(features).range(d3.schemeTableau10);
  }, [features]);
  
  // -- DEFINIZIONE DEI COMPONENTI GRAFICO --
  const chartComponents = {
    radviz: <RadvizChart 
              changeType={changeType} 
              data={slicedData} 
              features={visibleFeatures}
              hoveredNodeChanged={hoveredNodeChanged} 
              nodeSelectedChanged={handleNodeSelection}
            />,
    bar: <BarChart hoveredNode={hoveredNode} selectedNode={selectedNodes.length > 0 ? selectedNodes[0] : null} features={visibleFeatures} colorScale={colorScale} />,
    radar: <RadarChart data={slicedData} features={visibleFeatures} type={type} />,
    stacked: <StackedBarChart data={slicedData} features={visibleFeatures} selectedNode={selectedNodes.length > 0 ? selectedNodes[0] : null} colorScale={colorScale} onBarClick={handleBarClick} />,
    pie: (
      <Box sx={{ display: 'flex', flexDirection: 'row', height: '100%', width: '100%', overflowX: 'auto', p: 1, gap: 1, '&::-webkit-scrollbar': { height: '8px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px' } }}>
        {slicedData.map((node, index) => (
          <Paper key={node.id} ref={pieChartRefs.current[index]} elevation={2} sx={{ minWidth: '280px', height: '100%', flexShrink: 0, overflow: 'hidden' }}>
            <PieChart title={`${node.name || node.id}`} data={visibleFeatures.map(key => ({ label: key, value: node[key] }))} colorScale={colorScale} />
          </Paper>
        ))}
      </Box>
    )
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', bgcolor: 'background.default' }}>
      {/* PANNELLO LATERALE MIGLIORATO */}
      <Paper elevation={4} sx={{ width: isMenuOpen ? '350px' : '60px', flexShrink: 0, height: '100vh', transition: 'width 0.3s ease', overflow: 'hidden', position: 'relative', borderRadius: 0 }}>
        <Accordion expanded={isMenuOpen} onChange={() => setIsMenuOpen(!isMenuOpen)} sx={{ '::before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="controls-panel-content" id="controls-panel-header" sx={{ height: '60px', "& .MuiAccordionSummary-content": { display: 'flex', alignItems: 'center', gap: 1.5 } }}>
            <SettingsIcon />
            {isMenuOpen && <Typography variant="h6">Impostazioni</Typography>}
          </AccordionSummary>
          
          <AccordionDetails sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ textAlign: 'center', mb: 1 }}>Seleziona File CSV</Typography>
              <ToggleButtonGroup value={selectedFile} exclusive onChange={(e, newValue) => { if (newValue !== null) setSelectedFile(newValue); }} aria-label="file selection" orientation="vertical" fullWidth>
                {fileList.map((fileName) => (<ToggleButton sx={{ textTransform: 'none' }} key={fileName} value={fileName} aria-label={fileName}>{fileName}</ToggleButton>))}
              </ToggleButtonGroup>
            </Box>

            {dataType && (
              <Paper variant="outlined" sx={{ width: '90%', textAlign: 'center', p: 2, bgcolor: 'action.hover', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon color="info" />
                  <Typography variant="subtitle1" component="div" fontWeight={600}>Proprietà Dati</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">{dataType}</Typography>
              </Paper>
            )}
            
            {features.length > 0 && (
                <Box sx={{ width: '90%' }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ textAlign: 'center', mb: 1 }}>Visualizza Dimensioni</Typography>
                  <Paper variant="outlined" sx={{ maxHeight: 220, overflowY: 'auto', p: 1 }}>
                    <FormGroup>
                      {features.map((feature) => (
                        <FormControlLabel key={feature} control={ <Checkbox checked={visibleFeatures.includes(feature)} onChange={() => handleFeatureToggle(feature)} name={feature} size="small" /> } label={<Typography variant="body2">{feature}</Typography>} />
                      ))}
                    </FormGroup>
                  </Paper>
                </Box>
            )}

            {csvData.length > 0 && (
              <Box sx={{ width: '90%' }}>
                <Typography id="tuple-slider" gutterBottom>Numero di Righe: {numberOfRows}</Typography>
                <Slider aria-labelledby="tuple-slider" value={numberOfRows} onChange={(e, newValue) => setNumberOfRows(newValue)} min={1} max={csvData.length} valueLabelDisplay="auto" />
                <Button variant="outlined" onClick={handleRandomSelection} fullWidth sx={{ mt: 2 }}>Selezione Casuale</Button>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* AREA CONTENUTO PRINCIPALE */}
      <Container maxWidth={false} sx={{ flexGrow: 1, p: 2, height: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
        {!selectedFile ? (<Typography sx={{ textAlign: 'center', mt: 4 }}>Seleziona un file dal menu per iniziare.</Typography>) : 
        slicedData.length === 0 && selectedFile ? (<Typography sx={{ textAlign: 'center', mt: 4 }}>Caricamento dati per {selectedFile}...</Typography>) : 
        (
          <Box sx={{ display: 'flex', height: '100%', width: '100%', gap: 2 }}>
            <Box sx={{ width: '45%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tooltip title="Doppio click per ingrandire"><Paper onDoubleClick={() => handleZoom('radviz')} elevation={2} sx={{ width: '100%', height: '100%', p: 1, overflow: 'hidden', display: 'flex' }}>{chartComponents.radviz}</Paper></Tooltip>
            </Box>
            <Box sx={{ width: '55%', height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', height: '50%', gap: 2 }}>
                <Tooltip title="Doppio click per ingrandire"><Paper onDoubleClick={() => handleZoom('bar')} elevation={2} sx={{ width: '70%', height: '100%', p: 1, overflow: 'hidden' }}>{chartComponents.bar}</Paper></Tooltip>
                <Tooltip title="Doppio click per ingrandire"><Paper onDoubleClick={() => handleZoom('radar')} elevation={2} sx={{ width: '30%', height: '100%', p: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{chartComponents.radar}</Paper></Tooltip>
              </Box>
              <Box sx={{ display: 'flex', height: '50%', gap: 2 }}>
                <Tooltip title="Doppio click per ingrandire"><Paper onDoubleClick={() => handleZoom('stacked')} elevation={2} sx={{ width: '70%', height: '100%', p: 1, overflow: 'hidden' }}>{chartComponents.stacked}</Paper></Tooltip>
                <Tooltip title="Doppio click per ingrandire"><Paper onDoubleClick={() => handleZoom('pie')} elevation={2} sx={{ width: '30%', height: '100%', p: 1, overflow: 'hidden' }}>{chartComponents.pie}</Paper></Tooltip>
              </Box>
            </Box>
          </Box>
        )}
      </Container>
      
      <Modal open={zoomedChart !== null} onClose={() => handleZoom(null)} aria-labelledby="zoomed-chart-title">
        <Box sx={modalStyle}>
          <IconButton aria-label="close" onClick={() => handleZoom(null)} sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1, color: (theme) => theme.palette.grey[500], }}><CloseIcon /></IconButton>
          {zoomedChart && chartComponents[zoomedChart]}
        </Box>
      </Modal>
    </Box>
  );
}

export default App;