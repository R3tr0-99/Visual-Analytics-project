import { useCallback, useEffect, useMemo, useState, createRef, useRef } from 'react';
import * as d3 from 'd3';
import './App.css';
import { Typography, Box, ToggleButton, ToggleButtonGroup, Container, Slider, Modal, IconButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
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
    d3.csv(url)
      .then((rawData) => {
        if (!rawData || rawData.length === 0) {
          setCsvData([]); setFeatures([]); setNumberOfRows(0); return;
        }

        const filtered = rawData.filter((d) => d.name && d.name.trim() !== '');
        const parsed = filtered.map((row, index) => {
          const copy = { ...row, id: `${row.name}-${index}` };
          for (const k in copy) {
            if (k === 'name' || k === 'id') continue;
            const num = +copy[k];
            if (!isNaN(num)) copy[k] = num;
          }
          return copy;
        });

        setCsvData(parsed);
        setNumberOfRows(parsed.length);
        const allColumns = rawData.columns;
        const numericKeys = allColumns.filter(k => k !== 'name');
        setFeatures(numericKeys);
      })
      .catch((err) => {
        console.error('Errore caricamento CSV:', err);
        setCsvData([]); setFeatures([]); setNumberOfRows(0);
      });
  }, [selectedFile]);

  // --- FIX: MOVE slicedData DECLARATION UP ---
  const slicedData = useMemo(() => {
    if (!csvData || csvData.length === 0) return [];
    const count = Math.min(Math.max(1, numberOfRows || 0), csvData.length);
    return csvData.slice(0, count);
  }, [csvData, numberOfRows]);

  // --- Now it's safe to have hooks that depend on slicedData ---
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
  }, [slicedData]);

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


  const chartComponents = {
    radviz: <RadvizChart changeType={changeType} data={slicedData} hoveredNodeChanged={hoveredNodeChanged} nodeSelectedChanged={nodeSelectedChanged} />,
    bar: <BarChart hoveredNode={hoveredNode} features={features} colorScale={colorScale} />,
    radar: <RadarChart data={slicedData} features={features} type={type} />,
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
    <Container maxWidth={false} sx={{ height: '100vh', p: 2, boxSizing: 'border-box' }}>
      {/* Layout remains the same */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="h6" gutterBottom>Seleziona un file CSV</Typography>
        <ToggleButtonGroup value={selectedFile} exclusive onChange={(e, newValue) => { if (newValue !== null) setSelectedFile(newValue); }} aria-label="file selection">
          {fileList.map((fileName) => (<ToggleButton key={fileName} value={fileName} aria-label={fileName}>{fileName}</ToggleButton>))}
        </ToggleButtonGroup>
      </Box>
      {csvData.length > 0 && (
        <Box sx={{ my: 1, px: 2, width: '100%', maxWidth: '600px', mx: 'auto' }}>
          <Typography id="tuple-slider" gutterBottom>Numero di righe da visualizzare: {numberOfRows}</Typography>
          <Slider aria-labelledby="tuple-slider" value={numberOfRows} onChange={(e, newValue) => setNumberOfRows(newValue)} min={1} max={csvData.length} valueLabelDisplay="auto" disabled={csvData.length === 0} />
        </Box>
      )}


      {!selectedFile ? (
        <Typography>Nessun CSV selezionato. Seleziona un file per iniziare.</Typography>
      ) : slicedData.length === 0 && selectedFile ? (
        <Typography>Caricamento dati per {selectedFile}...</Typography>
      ) : (
        <Box sx={{ display: 'flex', height: `calc(100vh - ${csvData.length > 0 ? '160px' : '100px'})`, width: '100%', gap: 2 }}>
          <Box sx={{ width: '45%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tooltip title="Doppio click per ingrandire"><Box onDoubleClick={() => handleZoom('radviz')} sx={{ width: '100%', height: '100%', border: '1px solid #bbb', borderRadius: 2, p: 1, backgroundColor: '#fff', display: 'flex', overflow: 'hidden', boxSizing: 'border-box' }}>{chartComponents.radviz}</Box></Tooltip>
          </Box>
          <Box sx={{ width: '55%', height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', height: '50%', gap: 2 }}>
              <Tooltip title="Doppio click per ingrandire"><Box onDoubleClick={() => handleZoom('bar')} sx={{ width: '70%', height: '100%', border: '1px solid #bbb', borderRadius: 2, p: 1, backgroundColor: '#fff', boxSizing: 'border-box', overflow: 'hidden' }}>{chartComponents.bar}</Box></Tooltip>
              <Tooltip title="Doppio click per ingrandire"><Box onDoubleClick={() => handleZoom('radar')} sx={{ width: '30%', height: '100%', border: '1px solid #bbb', borderRadius: 2, p: 1, backgroundColor: '#fff', boxSizing: 'border-box', overflow: 'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>{chartComponents.radar}</Box></Tooltip>
            </Box>
            <Box sx={{ display: 'flex', height: '50%', gap: 2 }}>
              <Tooltip title="Doppio click per ingrandire"><Box onDoubleClick={() => handleZoom('stacked')} sx={{ width: '70%', height: '100%', border: '1px solid #bbb', borderRadius: 2, p: 1, backgroundColor: '#fff', boxSizing: 'border-box', overflow: 'hidden' }}>{chartComponents.stacked}</Box></Tooltip>
              <Tooltip title="Doppio click per ingrandire"><Box onDoubleClick={() => handleZoom('pie')} sx={{ width: '30%', height: '100%', border: '1px solid #bbb', borderRadius: 2, p: 1, backgroundColor: '#fff', boxSizing: 'border-box', overflow: 'hidden' }}>{chartComponents.pie}</Box></Tooltip>
            </Box>
          </Box>
        </Box>
      )}

      <Modal open={zoomedChart !== null} onClose={() => handleZoom(null)} aria-labelledby="zoomed-chart-title">
        <Box sx={modalStyle}>
          <IconButton aria-label="close" onClick={() => handleZoom(null)} sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500],}}><CloseIcon /></IconButton>
          {zoomedChart && chartComponents[zoomedChart]}
        </Box>
      </Modal>
    </Container>
  );
}

export default App;