import { useCallback, useEffect, useMemo, useState, createRef, useRef, Fragment, useLayoutEffect } from 'react';
import * as d3 from 'd3';

// --- Import dei Componenti UI ---
import {
  Typography, Box, ToggleButton, ToggleButtonGroup, Container, Slider, Modal, IconButton, Tooltip,
  Paper, Button, FormGroup, FormControlLabel, Checkbox, CircularProgress, Chip, Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import InfoIcon from '@mui/icons-material/Info';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFile';

// --- Import dei Componenti Grafico ---
import RadvizChart from './components/RadvizChart';
import RadarChart from './components/radarChart';
import StackedBarChart from './components/stackedBarChart';
import PieChart from './components/pieChart';
import Legend from './components/Legend';

// --- Import dei Servizi e Contenuti Esterni ---
import infoContent from './data-types-info.json';
import { loadAndClassifyData, processAndClassifyUploadedData } from './services/dataClassifier.js';
import { runApiTest } from './services/apiTest.jsx'; 

// --- Stili per i Modali ---
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
const infoModalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90vw', md: '60vw' },
  maxWidth: '750px',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: '15px',
  maxHeight: '90vh',
  overflowY: 'auto',
};


function App() {
  // --- Gestione dello Stato del Componente ---
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
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [dataTypeId, setDataTypeId] = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [classifiedByAI, setClassifiedByAI] = useState(false);

  const gridContainerRef = useRef(null);
  const [gridDimensions, setGridDimensions] = useState({ cols: 1, rows: 1 });
  const apiTestRun = useRef(false);
  const fileInputRef = useRef(null);

  // --- Hook per il Test dell'API ---
  useEffect(() => {
    if (import.meta.env.DEV && !apiTestRun.current) {
      runApiTest();
      apiTestRun.current = true;
    }
  }, []);

  // --- Hook per Caricare la Lista dei File ---
  useEffect(() => {
    fetch('/data/files.json')
      .then((res) => res.json())
      .then((lista) => setFileList(lista))
      .catch((err) => console.error("Errore nel caricamento di files.json:", err));
  }, []);
  
  // --- Hook Principale per il Caricamento Dati (solo per file precaricati) ---
  useEffect(() => {
    if (!selectedFile || !fileList.includes(selectedFile)) {
      if (selectedFile === '') {
         setCsvData([]); setFeatures([]); setDataTypeId(null); setClassifiedByAI(false);
      }
      return;
    }
    const processFile = async () => {
      setIsClassifying(true); setDataTypeId(null); setClassifiedByAI(false);
      try {
        const { parsedData, features, dataTypeId, classifiedByAI } = await loadAndClassifyData(selectedFile);
        setCsvData(parsedData); setFeatures(features); setVisibleFeatures(features);
        setNumberOfRows(parsedData.length); setSelectedNodes([]); setDataTypeId(dataTypeId); setClassifiedByAI(classifiedByAI);
      } catch (error) {
        console.error("Errore durante il processo di caricamento:", error);
        setDataTypeId('insufficienti'); setCsvData([]); setFeatures([]);
      } finally { setIsClassifying(false); }
    };
    processFile();
  }, [selectedFile, fileList]);

  // --- Valori Derivati e Memoizzati ---
  const currentDataTypeInfo = useMemo(() => infoContent.find(item => item.id === dataTypeId), [dataTypeId]);
  const slicedData = useMemo(() => {
    if (!csvData || csvData.length === 0) return [];
    const count = Math.min(Math.max(1, numberOfRows || 0), csvData.length);
    return csvData.slice(0, count);
  }, [csvData, numberOfRows]);

  useEffect(() => {
    pieChartRefs.current = Array(slicedData.length).fill().map((_, i) => pieChartRefs.current[i] || createRef());
  }, [slicedData.length]);
  
  const colorScale = useMemo(() => {
    if (features.length === 0) return null;
    return d3.scaleOrdinal().domain(features).range(d3.schemeTableau10);
  }, [features]);

  // --- Hook per Calcolare le Dimensioni della Griglia ---
  useLayoutEffect(() => {
    const calculateGrid = () => {
      if (!gridContainerRef.current || slicedData.length === 0) return;

      const { width, height } = gridContainerRef.current.getBoundingClientRect();
      if (width === 0 || height === 0) return;

      let bestConfig = { cols: slicedData.length, rows: 1, ratioDiff: Infinity };

      for (let cols = 1; cols <= slicedData.length; cols++) {
        const rows = Math.ceil(slicedData.length / cols);
        const cellWidth = width / cols;
        const cellHeight = height / rows;
        const cellRatio = cellWidth / cellHeight;
        const ratioDiff = Math.abs(cellRatio - 1);

        if (ratioDiff < bestConfig.ratioDiff) {
          bestConfig = { cols, rows, ratioDiff };
        }
      }
      setGridDimensions({ cols: bestConfig.cols, rows: bestConfig.rows });
    };

    calculateGrid(); 
    
    const resizeObserver = new ResizeObserver(calculateGrid);
    if (gridContainerRef.current) {
      resizeObserver.observe(gridContainerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [slicedData.length]);

  // --- Callback per l'Interattività ---
  const handleNodeSelection = useCallback((nodeName) => {
    if (nodeName === null) { setSelectedNodes([]); return; }
    const nodeToSelect = slicedData.find(node => node.name === nodeName);
    if (!nodeToSelect) return;
    const isAlreadySelected = selectedNodes.some(n => n.id === nodeToSelect.id);
    if (isAlreadySelected) {
      setSelectedNodes([]);
    } else {
      const selectionObject = { ...nodeToSelect, attributes: { name: nodeToSelect.name }, dimensions: Object.fromEntries(features.map(f => [f, nodeToSelect[f] ?? 0])) };
      setSelectedNodes([selectionObject]);
    }
  }, [slicedData, selectedNodes, features]);

  const handleBarClick = useCallback((clickedNodeName) => {
    if (isMenuOpen) { setIsMenuOpen(false); }
    handleNodeSelection(clickedNodeName);
    if (zoomedChart) { handleZoom(null); }
    setTimeout(() => {
      const nodeIndex = slicedData.findIndex(node => node.name === clickedNodeName);
      if (nodeIndex !== -1 && pieChartRefs.current[nodeIndex]?.current) {
        pieChartRefs.current[nodeIndex].current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 100);
  }, [slicedData, handleNodeSelection, zoomedChart, isMenuOpen]);

  const handleZoom = (chartKey) => setZoomedChart(current => (current === chartKey ? null : chartKey));
  const hoveredNodeChanged = useCallback((node) => setHoveredNode(node), []);
  const changeType = useCallback((typeTmp) => setType(typeTmp), []);
  const handleRandomSelection = useCallback(() => {
    if (csvData.length > 0) { setNumberOfRows(Math.floor(Math.random() * csvData.length) + 1); }
  }, [csvData.length]);

  const handleFeatureToggle = useCallback((featureToToggle) => {
    setVisibleFeatures(current => {
      const isVisible = current.includes(featureToToggle);
      return isVisible ? (current.length > 2 ? current.filter(f => f !== featureToToggle) : current) : [...current, featureToToggle];
    });
  }, []);

  // --- Callback per l'Upload di File ---
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file.name);
    setIsClassifying(true);
    setDataTypeId(null);
    setClassifiedByAI(false);
    
    try {
      const { parsedData, features, dataTypeId, classifiedByAI } = await processAndClassifyUploadedData(file);
      setCsvData(parsedData);
      setFeatures(features);
      setVisibleFeatures(features);
      setNumberOfRows(parsedData.length);
      setSelectedNodes([]);
      setDataTypeId(dataTypeId);
      setClassifiedByAI(classifiedByAI);
    } catch (error) {
      console.error("Errore durante il caricamento del file utente:", error);
      alert(`Errore nel caricamento: ${error.message}`);
      setDataTypeId('insufficienti');
      setCsvData([]);
      setFeatures([]);
      setSelectedFile('');
    } finally {
      setIsClassifying(false);
      event.target.value = null;
    }
  };

  // --- Definizione dei Componenti Grafico ---
  const chartComponents = {
    radviz: <RadvizChart changeType={changeType} data={slicedData} features={visibleFeatures} hoveredNodeChanged={hoveredNodeChanged} nodeSelectedChanged={handleNodeSelection}/>,
    radar: <RadarChart data={slicedData} features={visibleFeatures} type={type} />,
    stacked: <StackedBarChart data={slicedData} features={visibleFeatures} selectedNode={selectedNodes.length > 0 ? selectedNodes[0] : null} colorScale={colorScale} hoveredNode={hoveredNode} onBarClick={handleBarClick} />,
    pie: (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Legend features={visibleFeatures} colorScale={colorScale} />
            <Box
              ref={gridContainerRef} 
              sx={{
                display: 'grid', flexGrow: 1, width: '100%', p: 1, gap: 1.5,
                overflow: 'hidden', boxSizing: 'border-box', minHeight: 0,
                gridTemplateColumns: `repeat(${gridDimensions.cols}, 1fr)`,
                gridTemplateRows: `repeat(${gridDimensions.rows}, 1fr)`,
              }}
            >
              {slicedData.map((node, index) => (
                <Paper
                  key={node.id}
                  ref={pieChartRefs.current[index]}
                  elevation={2}
                  sx={{
                    width: '100%', height: '100%', overflow: 'hidden', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', minWidth: 0,
                    minHeight: 0, boxSizing: 'border-box', borderRadius: '12px'
                  }}
                >
                  <PieChart 
                    title={`${node.name || node.id}`} 
                    data={visibleFeatures.map(key => ({ label: key, value: node[key] }))} 
                    colorScale={colorScale}
                    margin={{ top: 25, right: 5, bottom: 5, left: 5 }}
                  />
                </Paper>
              ))}
            </Box>
        </Box>
    )
  };

  // --- JSX per il Rendering ---
  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', bgcolor: 'background.default' }}>
      <Paper elevation={4} sx={{ width: isMenuOpen ? '350px' : '60px', flexShrink: 0, height: '100vh', transition: 'width 0.3s ease', overflowX: 'hidden', overflowY: 'auto', position: 'relative', borderRadius: '0 15px 15px 0', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '0 8px 0 16px', height: '60px', flexShrink: 0, }}>
          {isMenuOpen && ( <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden', whiteSpace: 'nowrap' }}> <SettingsIcon /> <Typography variant="h6">Impostazioni</Typography> </Box> )}
          <IconButton onClick={() => setIsMenuOpen(!isMenuOpen)} sx={{ ml: isMenuOpen ? 1 : 0 }}> {isMenuOpen ? <ChevronLeftIcon /> : <SettingsIcon />} </IconButton>
        </Box>

        {isMenuOpen && (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', flexGrow: 1 }}>
            
            <Box sx={{width: '100%', display: 'flex', flexDirection: 'column', gap: 2}}>
              <Typography variant="subtitle1" gutterBottom sx={{ textAlign: 'center', mb: 0 }}>
                Seleziona File
              </Typography>
              
              <Button 
                variant="contained" 
                startIcon={<UploadFileIcon />}
                onClick={() => fileInputRef.current.click()}
              >
                Carica il tuo CSV
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload}
                accept=".csv"
                style={{ display: 'none' }}
              />

              <Divider>
                <Typography variant="caption" color="text.secondary">O scegli un esempio</Typography>
              </Divider>
              
              <Paper variant="outlined" sx={{ maxHeight: 200, overflowY: 'auto', width: '100%' }}>
                <ToggleButtonGroup 
                  value={selectedFile} 
                  exclusive 
                  onChange={(e, newValue) => { if (newValue !== null) setSelectedFile(newValue); }} 
                  aria-label="file selection" 
                  orientation="vertical" 
                  fullWidth
                >
                  {fileList.map((fileName) => (
                    <ToggleButton 
                      sx={{ textTransform: 'none', justifyContent: 'flex-start', pl: 2 }} 
                      key={fileName} 
                      value={fileName} 
                      aria-label={fileName}
                    >
                      {fileName}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Paper>
            </Box>

            {isClassifying ? (
              <Paper variant="outlined" sx={{ width: '90%', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, bgcolor: 'action.hover' }}>
                <CircularProgress size={24} /> <Typography variant="body2" color="text.secondary">Classificazione dati...</Typography>
              </Paper>
            ) : currentDataTypeInfo && (
              <Paper variant="outlined" sx={{ width: '90%', textAlign: 'center', p: 2, bgcolor: 'action.hover', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Tooltip title="Spiegazione Tipi di Dati">
                    <IconButton onClick={() => setIsInfoModalOpen(true)} size="small"> <InfoIcon color="info" /> </IconButton>
                  </Tooltip>
                  <Typography variant="subtitle1" component="div" fontWeight={600}>Proprietà Dati</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">{currentDataTypeInfo.title}</Typography>
                {classifiedByAI && ( <Chip icon={<SmartToyOutlinedIcon fontSize="small" />} label="Classificato con AI" size="small" color="primary" variant="outlined" sx={{ mt: 1 }} /> )}
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
          </Box>
        )}
      </Paper>

      <Container maxWidth={false} sx={{ flexGrow: 1, p: 2, height: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
        {!selectedFile ? (<Typography sx={{ textAlign: 'center', mt: 4 }}>Seleziona un file dal menu per iniziare.</Typography>) : 
        (csvData.length === 0 && !isClassifying) ? (<Typography sx={{ textAlign: 'center', mt: 4 }}>Nessun dato valido trovato in {selectedFile}.</Typography>) : 
        isClassifying ? (<Typography sx={{ textAlign: 'center', mt: 4 }}>Caricamento dati per {selectedFile}...</Typography>) :
        (
          <Box sx={{ display: 'flex', height: '100%', width: '100%', gap: 2 }}>
            <Box sx={{ width: '45%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tooltip title="Doppio click per ingrandire"><Paper onDoubleClick={() => handleZoom('radviz')} elevation={2} sx={{ width: '100%', height: '100%', p: 1, overflow: 'hidden', display: 'flex' }}>{chartComponents.radviz}</Paper></Tooltip>
            </Box>
            <Box sx={{ width: '55%', height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', height: '50%', gap: 2 }}>
                <Tooltip title="Doppio click per ingrandire"><Paper onDoubleClick={() => handleZoom('pie')} elevation={2} sx={{ width: '100%', height: '100%', p: 1, overflow: 'hidden' }}>{chartComponents.pie}</Paper></Tooltip>
              </Box>
              <Box sx={{ display: 'flex', height: '50%', gap: 2 }}>
                <Tooltip title="Doppio click per ingrandire"><Paper onDoubleClick={() => handleZoom('stacked')} elevation={2} sx={{ width: '70%', height: '100%', p: 1, overflow: 'hidden' }}>{chartComponents.stacked}</Paper></Tooltip>
                <Tooltip title="Doppio click per ingrandire"><Paper onDoubleClick={() => handleZoom('radar')} elevation={2} sx={{ width: '30%', height: '100%', p: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{chartComponents.radar}</Paper></Tooltip>
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

      <Modal open={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} aria-labelledby="info-modal-title">
        <Box sx={infoModalStyle}>
          <IconButton aria-label="close" onClick={() => setIsInfoModalOpen(false)} sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}> <CloseIcon /> </IconButton>
          <Typography id="info-modal-title" variant="h5" component="h2" gutterBottom>Spiegazione dei Tipi di Dati</Typography>
          <Box id="info-modal-description" sx={{ mt: 2 }}>
            {infoContent.map((item) => (
              <Fragment key={item.id}>
                <Paper elevation={item.id === dataTypeId ? 3 : 0} variant={item.id === dataTypeId ? 'elevation' : 'outlined'} sx={{ p: 2, mb: 2, transition: 'all 0.3s', borderColor: item.id === dataTypeId ? 'primary.main' : 'divider' }}>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>{item.title}</Typography>
                  <Typography variant="body1" color="text.secondary">{item.description}</Typography>
                </Paper>
              </Fragment>
            ))}
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}

export default App;