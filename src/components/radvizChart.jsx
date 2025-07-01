import { Box, Button } from "@mui/material";
import { useEffect, useRef, useState } from "react";
// Assumendo che d3 e la libreria radviz siano importate correttamente nel tuo progetto
// Potrebbe essere necessario un import come 'import * as d3 from "d3";' se non è globale
import { minEffectivenessErrorHeuristic } from "../utils/arrangement"; 

export default function RadvizChart(props) {
    const containerRef = useRef(null);
    const svgRef = useRef(null);
    const chartRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const [selectedNodes, setSelectedNodes] = useState([]);
    const [nodeHovered, setNodeHovered] = useState(null);
    const [valoreRaggio, setValoreRaggio] = useState(0);
    const [type, setType] = useState("original");
    
    const initialHeuristicApplied = useRef(false);

    // Effect #1: Eseguito UNA SOLA VOLTA per creare l'SVG e osservare il container
    useEffect(() => {
        if (!containerRef.current) return;

        // Pulisce completamente il contenitore prima di creare l'SVG
        d3.select(containerRef.current).selectAll('*').remove();
        
        svgRef.current = d3.select(containerRef.current).append('svg');

        const observeTarget = containerRef.current;
        const resizeObserver = new ResizeObserver(entries => {
            if (!entries || entries.length === 0) return;
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height });
        });
        
        resizeObserver.observe(observeTarget);
        
        return () => {
            resizeObserver.disconnect();
            // Pulisce anche quando il componente viene smontato
            if (containerRef.current) {
                d3.select(containerRef.current).selectAll('*').remove();
            }
        };
    }, []);

    // Effect #2: Eseguito per il disegno e l'aggiornamento del grafico
    useEffect(() => {
        if (!props.data || !svgRef.current || dimensions.width === 0) {
            // Se non ci sono dati, pulisce l'svg
            if (svgRef.current) svgRef.current.selectAll('*').remove();
            return;
        }

        const size = Math.min(dimensions.width, dimensions.height);
        if (size <= 0) return;

        // Assicuriamoci che ci sia solo un SVG nel contenitore
        if (containerRef.current) {
            const existingSvgs = d3.select(containerRef.current).selectAll('svg');
            if (existingSvgs.size() > 1) {
                // Se ci sono più SVG, rimuovi tutti tranne il primo
                existingSvgs.nodes().slice(1).forEach(node => node.remove());
                svgRef.current = d3.select(existingSvgs.node());
            }
        }

        if (!chartRef.current) {
            chartRef.current = d3.radviz();

            let selectedNodeElement = null;
            chartRef.current.setFunctionClick((_, event) => {
                const clickedEl = d3.select(event.target);
                const data = event.target.__data__;
                
                if (selectedNodeElement && selectedNodeElement.node() === clickedEl.node()) {
                    const rPrev = +clickedEl.attr('r-prev') || +clickedEl.attr('r-default') || 1;
                    clickedEl.classed('selected', false).attr('r', rPrev).attr('stroke', 'black').attr('stroke-width', 0.2).attr('r-prev', null);
                    selectedNodeElement = null;
                    setNodeHovered(null);
                    setSelectedNodes([]);
                    return;
                }
                
                if (selectedNodeElement) {
                    const prevEl = selectedNodeElement;
                    const rPrev = +prevEl.attr('r-prev') || +prevEl.attr('r-default') || 1;
                    prevEl.classed('selected', false).attr('r', rPrev).attr('stroke', 'black').attr('stroke-width', 0.2).attr('r-prev', null);
                }

                const defaultR = +clickedEl.attr('r-default') || 1;
                const currentR = +clickedEl.attr('r') || defaultR;
                clickedEl.attr('r-prev', currentR).classed('selected', true).attr('r', defaultR * 2).attr('stroke', 'red').attr('stroke-width', 2).raise();
                
                selectedNodeElement = clickedEl;
                setNodeHovered(data);
                setSelectedNodes([data]);
            });
        }
        
        chartRef.current.data(props.data);

        svgRef.current
            .attr('width', size)
            .attr('height', size)
            .style('margin', 'auto');

        svgRef.current.selectAll('*').remove();
        
        svgRef.current.call(chartRef.current);
        
        d3.selectAll("circle.data_point").each(function () {
            const el = d3.select(this);
            const r = parseFloat(el.attr("r")) || 1;
            if (!el.attr("r-default")) el.attr("r-default", r);
            el.attr("r-current", r);
        });
        
        if (type === "eemh") {
            const updated = minEffectivenessErrorHeuristic(chartRef.current.data());
            chartRef.current.updateRadviz(updated);
        } else if (type === "original") {
            // Ripristina la configurazione originale del radviz
            chartRef.current.updateRadviz();
        }

    }, [props.data, dimensions, type]);

    // Effect #3: Resetta lo stato quando i dati cambiano (es. cambio file)
    useEffect(() => {
        initialHeuristicApplied.current = false;
        resetSelectedNodes();
        // Applica l'euristica al primo caricamento di un nuovo dataset
        if(props.data && props.data.length > 0) {
            setType('eemh');
        } else {
            setType('original');
        }
    }, [props.data]);

    // Effects per propagare gli aggiornamenti di stato al componente padre (App.jsx)
    useEffect(() => { props.changeType(type); }, [type, props.changeType]);
    useEffect(() => { props.nodeSelectedChanged(selectedNodes); }, [selectedNodes, props.nodeSelectedChanged]);
    useEffect(() => { props.hoveredNodeChanged(nodeHovered); }, [nodeHovered, props.hoveredNodeChanged]);
    
    // Funzioni di interazione per i bottoni
    function increaseRaggio() {
        if (chartRef.current && valoreRaggio < 5) {
            chartRef.current.increaseRadius();
            setValoreRaggio((prev) => prev + 1);
        }
    }

    function decreaseRaggio() {
        if (chartRef.current && valoreRaggio > -5) {
            chartRef.current.decreaseRadius();
            setValoreRaggio((prev) => prev - 1);
        }
    }

    function resetSelectedNodes() {
        setType("original");
        setSelectedNodes([]);
        setNodeHovered(null);
        setValoreRaggio(0);
        if (chartRef.current) {
            chartRef.current.setRadiusPoints(1);
            // Forza il ridisegno completo per riavviare l'animazione
            setTimeout(() => {
                if (svgRef.current && chartRef.current) {
                    svgRef.current.selectAll('*').remove();
                    svgRef.current.call(chartRef.current);
                    
                    // Ripristina gli attributi dei punti
                    d3.selectAll("circle.data_point").each(function () {
                        const el = d3.select(this);
                        const r = parseFloat(el.attr("r")) || 1;
                        if (!el.attr("r-default")) el.attr("r-default", r);
                        el.attr("r-current", r);
                    });
                }
            }, 50);
        }
    }
    
    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box
                ref={containerRef}
                sx={{
                    width: '100%',
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    justifyContent: 'center', // Centra orizzontalmente
                    alignItems: 'center',     // Centra verticalmente
                }}
            >
                {/* L'SVG sarà perfettamente centrato nel contenitore */}
            </Box>
            
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: 'center', pt: 1, flexShrink: 0 }}>
                 <Button disabled={valoreRaggio >= 5} variant="outlined" onClick={increaseRaggio}>Raggio +</Button>
                 <Button disabled={valoreRaggio <= -5} variant="outlined" onClick={decreaseRaggio}>Raggio -</Button>
                 <Button
                    disabled={type === "eemh"}
                    variant="outlined"
                    onClick={() => setType("eemh")}
                 >EEMH Heuristic</Button>
                 <Button
                    disabled={type === "original" && selectedNodes.length === 0}
                    variant="outlined"
                    onClick={resetSelectedNodes}
                 >Reset</Button>
            </Box>
        </Box>
    );
}
