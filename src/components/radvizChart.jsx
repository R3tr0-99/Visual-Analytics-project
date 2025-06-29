import { Box, Button } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import { minEffectivenessErrorHeuristic } from "../utils/arrangement"; 


export default function RadvizChart(props) {
    const containerRef = useRef(null);
    const svgRef = useRef(null);
    const chartRef = useRef(null); // Riferimento per l'istanza del grafico radviz
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const [selectedNodes, setSelectedNodes] = useState([]);
    const [nodeHovered, setNodeHovered] = useState(null);
    const [valoreRaggio, setValoreRaggio] = useState(0);
    const [type, setType] = useState("original");
    
    // Flag per gestire l'applicazione dell'euristica iniziale una sola volta per dataset
    const initialHeuristicApplied = useRef(false);

    // Effect #1: Eseguito UNA SOLA VOLTA per creare l'SVG e osservare il container
    useEffect(() => {
        if (!containerRef.current) return;

        // Crea l'SVG e lo appende al container
        svgRef.current = d3.select(containerRef.current).append('svg');

        // Imposta il ResizeObserver per monitorare le dimensioni del container
        const observeTarget = containerRef.current;
        const resizeObserver = new ResizeObserver(entries => {
            if (!entries || entries.length === 0) return;
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height });
        });
        
        resizeObserver.observe(observeTarget);
        
        // Funzione di pulizia: disconnette l'observer quando il componente viene smontato
        return () => resizeObserver.disconnect();
    }, []); // L'array di dipendenze vuoto assicura che venga eseguito solo al mount

    // Effect #2: Eseguito ogni volta che i dati, le dimensioni o il tipo di grafico cambiano
    useEffect(() => {
        // Condizioni di guardia: non fare nulla se non abbiamo tutto il necessario
        if (!props.data || props.data.length === 0 || dimensions.width === 0 || !svgRef.current) {
            return;
        }

        // Calcola la dimensione del quadrato più grande che entra nel container
        const size = Math.min(dimensions.width, dimensions.height);
        if (size <= 0) return;

        // Se l'istanza del grafico d3.radviz non esiste, creala e imposta le funzioni di interazione
        if (!chartRef.current) {
            chartRef.current = d3.radviz();

            let selectedNodeElement = null;
            chartRef.current.setFunctionClick((_, event) => {
                const clickedEl = d3.select(event.target);
                const data = event.target.__data__;
                
                // Deseleziona se si clicca lo stesso nodo
                if (selectedNodeElement && selectedNodeElement.node() === clickedEl.node()) {
                    const rPrev = +clickedEl.attr('r-prev') || +clickedEl.attr('r-default') || 1;
                    clickedEl.classed('selected', false).attr('r', rPrev).attr('stroke', 'black').attr('stroke-width', 0.2).attr('r-prev', null);
                    selectedNodeElement = null;
                    setNodeHovered(null);
                    setSelectedNodes([]);
                    props.nodeSelectedChanged([]);
                    return;
                }
                
                // Ripristina il nodo precedentemente selezionato
                if (selectedNodeElement) {
                    const prevEl = selectedNodeElement;
                    const rPrev = +prevEl.attr('r-prev') || +prevEl.attr('r-default') || 1;
                    prevEl.classed('selected', false).attr('r', rPrev).attr('stroke', 'black').attr('stroke-width', 0.2).attr('r-prev', null);
                }

                // Seleziona il nuovo nodo
                const defaultR = +clickedEl.attr('r-default') || 1;
                const currentR = +clickedEl.attr('r') || defaultR;
                clickedEl.attr('r-prev', currentR).classed('selected', true).attr('r', defaultR * 2).attr('stroke', 'red').attr('stroke-width', 2).raise();
                
                // Aggiorna lo stato di React
                selectedNodeElement = clickedEl;
                setNodeHovered(data);
                setSelectedNodes([data]);
                props.nodeSelectedChanged([data]);
            });
        }
        
        // Aggiorna i dati nell'istanza del grafico
        chartRef.current.data(props.data);

        // Imposta le dimensioni e lo stile dell'SVG per centrarlo
        svgRef.current
            .attr('width', size)
            .attr('height', size)
            .style('margin', 'auto'); // Centra l'SVG nel suo contenitore flex

        // Pulisci l'SVG prima di ridisegnare per evitare sovrapposizioni
        svgRef.current.selectAll('*').remove();
        
        // Chiama la funzione di disegno di d3.radviz sull'SVG pulito
        svgRef.current.call(chartRef.current);
        
        // Logica post-disegno per memorizzare il raggio di default dei punti
        d3.selectAll("circle.data_point").each(function () {
            const el = d3.select(this);
            const r = parseFloat(el.attr("r")) || 1;
            if (!el.attr("r-default")) el.attr("r-default", r);
            el.attr("r-current", r);
        });
        
        // Applica l'euristica se è stata selezionata o al primo caricamento
        if (initialHeuristicApplied.current) {
            if (type === "eemh") {
                 const updated = minEffectivenessErrorHeuristic(chartRef.current.data());
                 chartRef.current.updateRadviz(updated);
            }
        } else if (props.data.length > 0) {
            // Applica l'euristica la prima volta che i dati vengono caricati
            initialHeuristicApplied.current = true;
            setType("eemh");
        }

    }, [props.data, dimensions, type]); // Dipendenze per il ridisegno

    // Effect #3: Resetta lo stato quando i dati cambiano (es. cambio file)
    useEffect(() => {
        initialHeuristicApplied.current = false; // Permette all'euristica di essere riapplicata sul nuovo dataset
        resetSelectedNodes();
    }, [props.data]);

    // Effects per propagare gli aggiornamenti di stato al componente padre (App.jsx)
    useEffect(() => { props.changeType(type); }, [type, props]);
    useEffect(() => { props.nodeSelectedChanged(selectedNodes); }, [selectedNodes, props]);
    useEffect(() => { props.hoveredNodeChanged(nodeHovered); }, [nodeHovered, props]);
    
    // Funzioni di interazione per i bottoni
    function increaseRaggio() {
        if (chartRef.current && valoreRaggio < 5) {
            chartRef.current.increaseRadius();
            setValoreRaggio((prev) => prev + 1);
            d3.selectAll("circle.data_point.selected").each(function () {
                const el = d3.select(this);
                const currentR = parseFloat(el.attr("r-current")) || 1;
                const newR = currentR + 1;
                el.attr("r", newR).attr("r-current", newR);
            });
        }
    }

    function decreaseRaggio() {
        if (chartRef.current && valoreRaggio > -5) {
            chartRef.current.decreaseRadius();
            setValoreRaggio((prev) => prev - 1);
            d3.selectAll("circle.data_point.selected").each(function () {
                const el = d3.select(this);
                const currentR = parseFloat(el.attr("r-current")) || 1;
                const newR = Math.max(1, currentR - 1);
                el.attr("r", newR).attr("r-current", newR);
            });
        }
    }

    function resetSelectedNodes() {
        setType("original");
        setSelectedNodes([]);
        setNodeHovered(null);
        setValoreRaggio(0);
        if (chartRef.current) {
            chartRef.current.setRadiusPoints(1);
            // Non è necessario chiamare updateRadviz qui, perché il cambio di `type`
            // in 'original' attiverà il ridisegno nell'effect principale.
        }
    }
    
    // Struttura JSX del componente
    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Area del grafico: flessibile e centrata */}
            <Box
                ref={containerRef}
                sx={{
                    width: '100%',
                    flex: 1,
                    minHeight: 0,
                    display: 'flex', // Necessario per far funzionare 'margin: auto' sull'SVG
                }}
            >
                {/* L'SVG viene creato da D3 e appeso qui */}
            </Box>
            
            {/* Area dei bottoni: centrata */}
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