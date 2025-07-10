import { Box, Button } from "@mui/material";

import { useEffect, useMemo, useRef, useState } from "react";
import { minEffectivenessErrorHeuristic } from "../utils/arrangement"; 

export default function RadvizChart(props) {
    const containerRef = useRef(null);
    const svgRef = useRef(null);
    const chartRef = useRef(null);
    const [containerDims, setContainerDims] = useState({ width: 0, height: 0 });

    const [nodeHovered, setNodeHovered] = useState(null);
    const [valoreRaggio, setValoreRaggio] = useState(0);
    const [type, setType] = useState("original");
    
    // Memorizza l'elemento DOM del nodo selezionato per gestirne lo stile
    const selectedNodeElement = useRef(null);

    // Effect #1: Creazione SVG e osservazione del container
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

   // Pre-processa i dati da visualizzare basandosi sulle features 
    const radvizData = useMemo(() => {
        if (!props.data || !props.features) return [];
        // Crea un nuovo array di oggetti che contengono solo le features visibili + 'name'/'id'
        return props.data.map(d => {
            const newObj = {
                name: d.name, // 'name'  per la comunicazione e le etichette
                id: d.id,
            };
            props.features.forEach(feature => {
                newObj[feature] = d[feature];
            });
            return newObj;
        });
    }, [props.data, props.features]);


    // Effect #2: Disegno e aggiornamento del grafico
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
                
                // Se si clicca sullo stesso nodo, deselezionalo
                if (selectedNodeElement.current && selectedNodeElement.current.node() === clickedEl.node()) {
                    // Ripristina lo stile del nodo deselezionato
                    const rPrev = +clickedEl.attr('r-prev') || +clickedEl.attr('r-default') || 1;
                    clickedEl.classed('selected', false).attr('r', rPrev).attr('stroke', 'black').attr('stroke-width', 0.2).attr('r-prev', null);
                    
                    selectedNodeElement.current = null;
                    setNodeHovered(null);
                    props.nodeSelectedChanged(null); //  Notifica all'App la deselezione con null
                    return;
                }
                
                // Deseleziona il nodo precedente, se esiste
                if (selectedNodeElement.current) {
                    const prevEl = selectedNodeElement.current;
                    const rPrev = +prevEl.attr('r-prev') || +prevEl.attr('r-default') || 1;
                    prevEl.classed('selected', false).attr('r', rPrev).attr('stroke', 'black').attr('stroke-width', 0.2).attr('r-prev', null);
                }

                // Seleziona e evidenzia il nuovo nodo
                const defaultR = +clickedEl.attr('r-default') || 1;
                const currentR = +clickedEl.attr('r') || defaultR;
                clickedEl.attr('r-prev', currentR).classed('selected', true).attr('r', defaultR * 2).attr('stroke', 'red').attr('stroke-width', 2).raise();
                
                selectedNodeElement.current = clickedEl;
                setNodeHovered(data);
                //  Notifica all'App il NOME del nodo selezionato
                props.nodeSelectedChanged(data.name); 
            });
        }
        
        //  Passa i dati pre-filtrati e rimuovi la chiamata a .dimensions()
        chartRef.current.data(radvizData);

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
        });
        
        if (type === "eemh") {
            const updated = minEffectivenessErrorHeuristic(chartRef.current.data());
            chartRef.current.updateRadviz(updated);
        } else if (type === "original") {
            chartRef.current.updateRadviz();
        }

    }, [radvizData, props.features, containerDims, type, props.nodeSelectedChanged]); 

    // Effect #3: Reset quando cambiano i dati
    useEffect(() => {
        resetState();
        if(props.data && props.data.length > 0) {
            setType('eemh');
        } else {
            setType('original');
        }
    }, [props.data]);

    // Effects per gli stati interni
    useEffect(() => { props.changeType(type); }, [type, props.changeType]);
    useEffect(() => { props.hoveredNodeChanged(nodeHovered); }, [nodeHovered, props.hoveredNodeChanged]);
    
    // Funzioni di interazione
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
        props.nodeSelectedChanged(null); // Notifica al genitore il reset
        setNodeHovered(null);
        setValoreRaggio(0);
        if (chartRef.current) {
            chartRef.current.setRadiusPoints(1);
        }
        // Il re-render pilotato dal cambio di props/stato si occuperà di ridisegnare
    }
    
    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
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