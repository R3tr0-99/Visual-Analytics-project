import { Box, Button } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { minEffectivenessErrorHeuristic, minEffectivenessErrorHeuristicFast } from "../utils/arrangement";

export default function RadvizChart(props) {
    const containerRef = useRef(null);
    const chartRef = useRef(null);

    const [selectedNodes, setSelectedNodes] = useState([]);
    const [nodeHovered, setNodeHovered] = useState(null);
    const [nodeSelected, setNodeSelected] = useState(null);
    const [valoreRaggio, setValoreRaggio] = useState(0);
    const [type, setType] = useState("original");


    useEffect(() => {
        if (props.data !== undefined && props.data.length > 0) {
            const chart = d3.radviz().data(props.data)
            chartRef.current = chart;

            //FUNZIONE NODO SELEZIONATO
      // fuori dal callback riepiloghiamo lo stato
let selectedNodeElement = null;

chart.setFunctionClick((_, event) => {
    const clickedEl = d3.select(event.target);
    const data = event.target.__data__;

    // se sto cliccando di nuovo lo stesso nodo: deseleziono
    if (selectedNodeElement && selectedNodeElement.node() === clickedEl.node()) {
        // ripristino attributi dal prev salvato
        const rPrev = +clickedEl.attr('r-prev') || +clickedEl.attr('r-default') || 1;
        clickedEl
            .classed('selected', false)
            .attr('r', rPrev)
            .attr('stroke', 'black')
            .attr('stroke-width', 0.2)
            .attr('r-prev', null);       // facoltativo: pulisco il prev

        selectedNodeElement = null;
        setNodeHovered(null);
        setSelectedNodes([]);
        return;
    }

    // sto selezionando un nodo diverso:
    // se ne avevo già uno, lo ripristino
    if (selectedNodeElement) {
        const prevEl = selectedNodeElement;
        const rPrev = +prevEl.attr('r-prev') || +prevEl.attr('r-default') || 1;
        prevEl
            .classed('selected', false)
            .attr('r', rPrev)
            .attr('stroke', 'black')
            .attr('stroke-width', 0.2)
            .attr('r-prev', null);
    }

    // ora salvo il raggio corrente del nuovo nodo
    const defaultR = +clickedEl.attr('r-default') || 1;
    const currentR = +clickedEl.attr('r') || defaultR;
    clickedEl
        .attr('r-prev', currentR)      // memorizzo
        .classed('selected', true)
        .attr('r', defaultR * 2)
        .attr('stroke', 'red')
        .attr('stroke-width', 2)
        .raise();

    // aggiorno lo stato
    selectedNodeElement = clickedEl;
    setNodeHovered(data);
    setSelectedNodes([data]);
    props.nodeSelectedChanged([data]);

});

            // chart.setFunctionMouseOver((_, event) => {
            //     const nodeData = event.target.__data__;
            //     console.log(nodeData)
            //     console.log(nodeHovered)
            //     if (nodeHovered && (nodeData !== nodeHovered)) {
            //         console.log(nodeData, nodeHovered)
            //         nodeHovered.attr("r", defaultR * 10)
            //     }
            //     setNodeHovered(nodeData);
            //     const node = d3.select(event.target);
            //     node.raise();
            //     const defaultR = parseFloat(node.attr("r-default")) || 1
            //     node
            //         .attr("r", defaultR * 2)
            //         .attr("stroke", "red")
            //         .attr("stroke-width", 2)


            // })


            // chart.setFunctionMouseOut(() => {
            //     setNodeHovered(null);
            // });

            d3.select(containerRef.current).selectAll("*").remove();
            d3.select(containerRef.current).call(chart);

            d3.selectAll("circle.data_point").each(function () {
                const el = d3.select(this);
                const r = parseFloat(el.attr("r")) || 1;
                if (!el.attr("r-default")) el.attr("r-default", r);
                el.attr("r-current", r);
            });

            // Avvia l'euristica al caricamento
            setType("eemh");
            const data = chartRef.current?.data();
            if (data) {
                setSelectedNodes([]);
                const updated = minEffectivenessErrorHeuristic(data);
                chartRef.current.updateRadviz(updated);
            }
        }
    }, [props.data]);


    //Perchè per visualizzarlo come nell'esempio serve la documentazione, a tentativi non penso che ci si riesce
    //Il calcolo nuovo è basato sui valori minimi e massimi, il problema è che metà funzioni sono inutilizzate o non hanno un nome


    useEffect(() => {
        if (type) props.changeType(type);
    }, [type])

    useEffect(() => {
        if (props.nodeSelectedChanged) {
            //I nodi sono composti cosi:
            /*

            {
                id: "p16",
                dimensions: { STG: 0.05, SCG: 0.07, STR: 0.7, LPR: 0.4, PEG: 0.85 },  // già normalizzati
                original: { STG: 0.05, SCG: 0.07, STR: 0.7, LPR: 0.4, PEG: 0.85, UNS: "very_low" }, // valori grezzi
                attributes: { UNS: "very_low" }
            } 
            */
            props.nodeSelectedChanged(selectedNodes);

        }
    }, [selectedNodes])

    useEffect(() => {
        if (props.hoveredNodeChanged) {
            //I nodi sono composti cosi:
            /*
            {
                id: "p16",
                dimensions: { STG: 0.05, SCG: 0.07, STR: 0.7, LPR: 0.4, PEG: 0.85 },  // già normalizzati
                original: { STG: 0.05, SCG: 0.07, STR: 0.7, LPR: 0.4, PEG: 0.85, UNS: "very_low" }, // valori grezzi
                attributes: { UNS: "very_low" }
            } 
            */
            props.hoveredNodeChanged(nodeHovered);

        }
    }, [nodeHovered])
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
        // 1. Resetta lo stato di React
        setType("original");
        setSelectedNodes([]);
        setNodeHovered(null);
        setValoreRaggio(0);

        // 2. Resetta il raggio di base nella libreria e ridisegna
        if (chartRef.current) {
            chartRef.current.setRadiusPoints(1); // Usa il valore di default della libreria
            chartRef.current.updateRadviz();
        }

        // 3. Forza il ripristino degli attributi di raggio su ogni punto dopo il ridisegno
        // Questo assicura che ogni punto, anche quello in hover, torni allo stato iniziale
        setTimeout(() => {
            d3.selectAll("circle.data_point").each(function () {
                const el = d3.select(this);
                const defaultR = el.attr("r-default") || 1;
                el.attr("r", defaultR);
                el.attr("r-current", defaultR);
                el.classed("selected", false)
                    .attr("stroke", "black")
                    .attr("stroke-width", 0.2);
            });
        }, 100); //ritardo per permettere a D3 di completare l'updateRadviz
    }





    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexWrap: 'wrap', width: '100%' }}>
            <Box className="visualization" sx={{ width: '100%' }}>
                <Box id="container" sx={{ width: '100%', height: '100%' }}>
                    <Box ref={containerRef} sx={{ width: '100%', height: '100%' }}>
                    </Box>
                </Box>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <Button disabled={valoreRaggio >= 5} variant="outlined" onClick={increaseRaggio}>
                    Raggio +
                </Button>
                <Button disabled={valoreRaggio <= -5} variant="outlined" onClick={decreaseRaggio}>
                    Raggio -
                </Button>

                <Button
                    disabled={type === "eemh"}
                    variant="outlined"
                    onClick={() => {
                        setType("eemh");
                        d3.selectAll(".data_point").remove();
                        d3.selectAll(".AP_points").remove();
                        d3.selectAll(".attr_label").remove();
                        d3.selectAll(".legend").remove();
                        d3.selectAll(".radarlevel").remove();
                        d3.selectAll(".grid")
                        const data = chartRef.current?.data();
                        if (data) {
                            setSelectedNodes([]);
                            const updated = minEffectivenessErrorHeuristic(data);
                            chartRef.current.updateRadviz(updated);
                        }
                    }}
                >
                    EEMH Heuristic
                </Button>


                <Button

                    disabled={type === "original" && selectedNodes.length === 0}
                    variant="outlined"
                    onClick={resetSelectedNodes}
                >
                    Reset
                </Button>

            </Box>
        </Box>
    );
};

