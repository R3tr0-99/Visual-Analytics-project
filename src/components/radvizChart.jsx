import { Box, Button, Typography, Paper } from "@mui/material"; // Aggiunto Paper e Typography per il tooltip
import { useEffect, useMemo, useRef, useState } from "react";
import { minEffectivenessErrorHeuristic } from "../utils/arrangement"; 

export default function RadvizChart(props) {
    const containerRef = useRef(null);
    const svgRef = useRef(null);
    const chartRef = useRef(null);
    const [containerDims, setContainerDims] = useState({ width: 0, height: 0 });

    const [nodeHovered, setNodeHovered] = useState(null);
    const [trulyHoveredNode, setTrulyHoveredNode] = useState(null); // Per il vero hover del mouse
    const [valoreRaggio, setValoreRaggio] = useState(0);
    const [type, setType] = useState("original");
    
    const selectedNodeElement = useRef(null);

    // --- MODIFICA CHIAVE 1: Usa le ref per stabilizzare le callback ---
    // Questo previene ri-render inutili quando le funzioni cambiano in App.jsx
    const nodeSelectedChangedRef = useRef(props.nodeSelectedChanged);
    const hoveredNodeChangedRef = useRef(props.hoveredNodeChanged);
    useEffect(() => {
        nodeSelectedChangedRef.current = props.nodeSelectedChanged;
        hoveredNodeChangedRef.current = props.hoveredNodeChanged;
    });
    // --- FINE MODIFICA 1 ---

    useEffect(() => {
        if (!containerRef.current) return;
        d3.select(containerRef.current).selectAll('*').remove();
        svgRef.current = d3.select(containerRef.current).append('svg');

        const resizeObserver = new ResizeObserver(entries => {
            if (!entries || !entries.length) return;
            const { width, height } = entries[0].contentRect;
            setContainerDims({ width, height });
        });
        
        resizeObserver.observe(containerRef.current);
        
        return () => resizeObserver.disconnect();
    }, []);

    const radvizData = useMemo(() => {
        if (!props.data || !props.features) return [];
        return props.data.map(d => {
            const newObj = { name: d.name, id: d.id };
            props.features.forEach(feature => {
                newObj[feature] = d[feature];
            });
            return newObj;
        });
    }, [props.data, props.features]);

    useEffect(() => {
        if (radvizData.length === 0 || props.features.length < 2 || !svgRef.current || containerDims.width === 0) {
            if (svgRef.current) svgRef.current.selectAll('*').remove();
            return;
        }

        const size = Math.min(containerDims.width, containerDims.height);
        if (size <= 0) return;

        if (!chartRef.current) {
            chartRef.current = d3.radviz();

            chartRef.current.setFunctionClick((_, event) => {
                const clickedEl = d3.select(event.target);
                const data = event.target.__data__;
                
                if (selectedNodeElement.current && selectedNodeElement.current.node() === clickedEl.node()) {
                    const rPrev = +clickedEl.attr('r-prev') || +clickedEl.attr('r-default') || 1;
                    clickedEl.classed('selected', false).attr('r', rPrev).attr('stroke', 'black').attr('stroke-width', 0.2).attr('r-prev', null);
                    
                    selectedNodeElement.current = null;
                    setNodeHovered(null);
                    // --- MODIFICA CHIAVE 2: Usa la ref ---
                    nodeSelectedChangedRef.current(null);
                    return;
                }
                
                if (selectedNodeElement.current) {
                    const prevEl = selectedNodeElement.current;
                    const rPrev = +prevEl.attr('r-prev') || +prevEl.attr('r-default') || 1;
                    prevEl.classed('selected', false).attr('r', rPrev).attr('stroke', 'black').attr('stroke-width', 0.2).attr('r-prev', null);
                }

                const defaultR = +clickedEl.attr('r-default') || 1;
                const currentR = +clickedEl.attr('r') || defaultR;
                clickedEl.attr('r-prev', currentR).classed('selected', true).attr('r', defaultR * 2).attr('stroke', 'red').attr('stroke-width', 2).raise();
                
                selectedNodeElement.current = clickedEl;
                setNodeHovered(data);
                // --- MODIFICA CHIAVE 2: Usa la ref ---
                nodeSelectedChangedRef.current(data.name); 
            });

            // Aggiungiamo i listener per l'hover del mouse per il tooltip
            chartRef.current.setFunctionMouseOver((_, data) => {
                setTrulyHoveredNode(data);
            });
            chartRef.current.setFunctionMouseOut(() => {
                setTrulyHoveredNode(null);
            });
        }
        
        chartRef.current.data(radvizData);
        svgRef.current.attr('width', size).attr('height', size).style('margin', 'auto');
        svgRef.current.selectAll('*').remove();
        svgRef.current.call(chartRef.current);
        
        d3.selectAll("circle.data_point").each(function () {
            const el = d3.select(this);
            const r = parseFloat(el.attr("r")) || 1;
            if (!el.attr("r-default")) el.attr("r-default", r);
        });
        
        // La logica di animazione viene eseguita qui, triggerata solo dal cambio di 'type' o 'radvizData'
        if (type === "eemh") {
            const updated = minEffectivenessErrorHeuristic(chartRef.current.data());
            chartRef.current.updateRadviz(updated);
        } else if (type === "original") {
            chartRef.current.updateRadviz();
        }

    // --- MODIFICA CHIAVE 3: Rimuovi le callback dalle dipendenze ---
    }, [radvizData, props.features, containerDims, type]); 

    // Questo effect è corretto: si attiva solo quando arrivano nuovi dati.
    useEffect(() => {
        resetState();
        if(props.data && props.data.length > 0) {
            setType('eemh');
        } else {
            setType('original');
        }
    }, [props.data]);

    // Questo effect ora usa la ref, quindi non causa problemi
    useEffect(() => { 
        hoveredNodeChangedRef.current(nodeHovered); 
    }, [nodeHovered]);
    
    useEffect(() => { props.changeType(type); }, [type, props.changeType]);
    
    const increaseRaggio = () => {
        if (chartRef.current && valoreRaggio < 5) {
            chartRef.current.increaseRadius();
            setValoreRaggio(v => v + 1);
        }
    }

    const decreaseRaggio = () => {
        if (chartRef.current && valoreRaggio > -5) {
            chartRef.current.decreaseRadius();
            setValoreRaggio(v => v - 1);
        }
    }

    const resetState = () => {
        setType("original");
        // --- MODIFICA CHIAVE 2: Usa la ref ---
        nodeSelectedChangedRef.current(null); 
        setNodeHovered(null);
        setValoreRaggio(0);
        if (chartRef.current) {
            chartRef.current.setRadiusPoints(1);
        }
    }
    
    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
             {trulyHoveredNode && (
                <Paper 
                    elevation={4} 
                    sx={{
                        position: 'absolute', top: 10, left: 10, zIndex: 10,
                        pointerEvents: 'none', backgroundColor: '#ffffe0', p: 1.5,
                        borderRadius: '8px', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', textAlign: 'center',
                     }}
                >
                    <Typography variant="subtitle2" component="div">{trulyHoveredNode.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Effectiveness Error: {trulyHoveredNode.errorE != null ? trulyHoveredNode.errorE.toFixed(4) : 'N/A'}
                    </Typography>
                </Paper>
            )}

            <Box
                ref={containerRef}
                sx={{ width: '100%', flex: 1, minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            />
            
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: 'center', pt: 1, flexShrink: 0 }}>
                 <Button disabled={valoreRaggio >= 5} variant="outlined" onClick={increaseRaggio}>Raggio +</Button>
                 <Button disabled={valoreRaggio <= -5} variant="outlined" onClick={decreaseRaggio}>Raggio -</Button>
                 <Button disabled={type === "eemh"} variant="outlined" onClick={() => setType("eemh")}>EEMH Heuristic</Button>
                 <Button variant="outlined" onClick={resetState}>Reset</Button>
            </Box>
        </Box>
    );
}