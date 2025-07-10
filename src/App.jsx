import { useCallback, useEffect, useMemo, useState, createRef, useRef, Fragment } from 'react';

// --- Import dei Componenti UI ---
import {
  Typography, Box, ToggleButton, ToggleButtonGroup, Container, Slider, Modal, IconButton, Tooltip,
  Paper, Button, FormGroup, FormControlLabel, Checkbox, Divider, CircularProgress, Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import InfoIcon from '@mui/icons-material/Info';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';

// --- Import dei Componenti Grafico ---
import RadvizChart from './components/RadvizChart';
import RadarChart from './components/radarChart';
import BarChart from './components/barChart';
import StackedBarChart from './components/stackedBarChart';
import PieChart from './components/pieChart';

// --- Import dei Servizi e Contenuti Esterni ---
import infoContent from './data-types-info.json';
import { loadAndClassifyData } from './services/dataClassifier.js';
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

  // useRef per assicurare che il test API venga eseguito una sola volta
  const apiTestRun = useRef(false);

  // --- Hook per il Test dell'API (eseguito solo una volta in sviluppo) ---
  useEffect(() => {
    if (import.meta.env.DEV && !apiTestRun.current) {
      runApiTest();
      apiTestRun.current = true; // Imposta il flag per prevenire esecuzioni future
    }
  }, []);

  // --- Hook per Caricare la Lista dei File disponibili ---
  useEffect(() => {
    fetch('/data/files.json')
      .then((res) => res.json())
      .then((lista) => setFileList(lista))
      .catch((err) => console.error("Errore nel caricamento di files.json:", err));
  }, []);
  
  // --- Hook Principale: Carica e Classifica i Dati quando un file viene selezionato ---
  useEffect(() => {
    if (!selectedFile) {
      setCsvData([]);
      setFeatures([]);
      setDataTypeId(null);
      setClassifiedByAI(false);
      return;
    }

    const processFile = async () => {
      setIsClassifying(true);
      setDataTypeId(null);
      setClassifiedByAI(false);

      try {
        const { parsedData, features, dataTypeId, classifiedByAI } = await loadAndClassifyData(selectedFile);
        
        setCsvData(parsedData);
        setFeatures(features);
        setVisibleFeatures(features);
        setNumberOfRows(parsedData.length);
        setSelectedNodes([]);
        setDataTypeId(dataTypeId);
        setClassifiedByAI(classifiedByAI);

      } catch (error) {
        console.error("Errore durante il processo di caricamento:", error);
        setDataTypeId('insufficienti');
        setCsvData([]);
        setFeatures([]);
      } finally {
        setIsClassifying(false);
      }
    };

    processFile();
  }, [selectedFile]);

  // --- Valori Derivati e Memoizzati ---
  const currentDataTypeInfo = useMemo(() => {
    if (!dataTypeId) return null;
    return infoContent.find(item => item.id === dataTypeId);
  }, [dataTypeId]);

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

  // --- MODIFICA CHIAVE QUI ---
  const handleBarClick = useCallback((clickedNodeName) => {
    // 1. Chiudi il pannello laterale se è aperto
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
    
    // 2. Seleziona il nodo (logica esistente)
    handleNodeSelection(clickedNodeName);
    
    // 3. Chiudi il modale se un grafico è ingrandito (logica esistente)
    if (zoomedChart) { handleZoom(null); }
    
    // 4. Esegui lo scroll verso il grafico a torta corrispondente (logica esistente)
    setTimeout(() => {
      const nodeIndex = slicedData.findIndex(node => node.name === clickedNodeName);
      if (nodeIndex !== -1 && pieChartRefs.current[nodeIndex]?.current) {
        pieChartRefs.current[nodeIndex].current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 100); // Ritardo per permettere la transizione di chiusura del pannello
  }, [slicedData, handleNodeSelection, zoomedChart, isMenuOpen]); // Aggiungi isMenuOpen alle dipendenze

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

  // --- Definizione dei Componenti Grafico da Renderizzare ---
  const chartComponents = {
    radviz: <RadvizChart changeType={changeType} data={slicedData} features={visibleFeatures} hoveredNodeChanged={hoveredNodeChanged} nodeSelectedChanged={handleNodeSelection}/>,
    bar: <BarChart hoveredNode={hoveredNode} selectedNode={selectedNodes.length > 0 ? selectedNodes[0] : null} features={visibleFeatures} colorScale={colorScale} />,
    radar: <RadarChart data={slicedData} features={visibleFeatures} type={type} />,
    stacked: <StackedBarChart data={slicedData} features={visibleFeatures} selectedNode={selectedNodes.length > 0 ? selectedNodes[0] : null} colorScale={colorScale} onBarClick={handleBarClick} />,
    pie: (
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        height: '100%',
        width: '100%',
        overflow: 'auto',
        p: 1,
        gap: 1,
        '&::-webkit-scrollbar': { width: '8px', height: '8px' },
        '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px' }
      }}>
        {slicedData.map((node, index) => (
          <Paper
            key={node.id}
            ref={pieChartRefs.current[index]}
            elevation={2}
            sx={{
              minWidth: '220px',
              maxWidth: '260px',
              minHeight: '220px',
              maxHeight: '260px',
              flex: '1 1 220px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <PieChart title={`${node.name || node.id}`} data={visibleFeatures.map(key => ({ label: key, value: node[key] }))} colorScale={colorScale} />
          </Paper>
        ))}
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
            <Box sx={{width: '100%'}}>
              <Typography variant="subtitle1" gutterBottom sx={{ textAlign: 'center', mb: 1 }}>Seleziona File CSV</Typography>
              <ToggleButtonGroup value={selectedFile} exclusive onChange={(e, newValue) => { if (newValue !== null) setSelectedFile(newValue); }} aria-label="file selection" orientation="vertical" fullWidth>
                {fileList.map((fileName) => (<ToggleButton sx={{ textTransform: 'none' }} key={fileName} value={fileName} aria-label={fileName}>{fileName}</ToggleButton>))}
              </ToggleButtonGroup>
            </Box>

            {isClassifying ? (
              <Paper variant="outlined" sx={{ width: '90%', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, bgcolor: 'action.hover' }}>
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary">Classificazione dati...</Typography>
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
                {classifiedByAI && (
                  <Chip
                    icon={<SmartToyOutlinedIcon fontSize="small" />}
                    label="Classificato con AI"
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                )}
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

      <Modal open={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} aria-labelledby="info-modal-title">
        <Box sx={infoModalStyle}>
          <IconButton aria-label="close" onClick={() => setIsInfoModalOpen(false)} sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}>
            <CloseIcon />
          </IconButton>
          <Typography id="info-modal-title" variant="h5" component="h2" gutterBottom>
            Spiegazione dei Tipi di Dati
          </Typography>
          <Box id="info-modal-description" sx={{ mt: 2 }}>
            {infoContent.map((item) => (
              <Fragment key={item.id}>
                <Paper elevation={item.id === dataTypeId ? 3 : 0} variant={item.id === dataTypeId ? 'elevation' : 'outlined'} sx={{ p: 2, mb: 2, transition: 'all 0.3s', borderColor: item.id === dataTypeId ? 'primary.main' : 'divider' }}>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {item.description}
                  </Typography>
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