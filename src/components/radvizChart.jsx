import { Button } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { minEffectivenessErrorHeuristic, minEffectivenessErrorHeuristicFast } from "../utils/arrangement";

export default function RadvizChart(props) {
    const containerRef = useRef(null);
    const chartRef = useRef(null);

    const [selectedNodes, setSelectedNodes] = useState([]);
    const [nodeHovered, setNodeHovered] = useState(null);
    const [valoreRaggio, setValoreRaggio] = useState(0);
    const [type, setType] = useState("original");


    useEffect(() => {
        if (props.data !== undefined && props.data.length > 0) {
            console.log(props.data)
            const chart = d3.radviz().data(props.data)
            chart.disableDraggableAnchors(false);
            chartRef.current = chart;

            chart.setFunctionClick((_, event) => {
                const clickedNode = d3.select(event.target);
                const nodeData = event.target.__data__;

                const wasSelected = clickedNode.classed("selected");
                const originalR = clickedNode.attr("r-default") || clickedNode.attr("r");

                if (wasSelected) {
                    clickedNode
                        .classed("selected", false)
                        .attr("stroke", "black")
                        .attr("stroke-width", 0.2)
                        .attr("r", originalR)
                        .attr("r-current", originalR);

                    setSelectedNodes(prev => prev.filter((node) => node.id !== nodeData.id));
                } else {
                    const currentR = parseFloat(clickedNode.attr("r")) || 1;

                    clickedNode
                        .classed("selected", true)
                        .attr("stroke", "red")
                        .attr("stroke-width", 2)
                        .attr("r", currentR + 1)
                        .attr("r-current", currentR + 1)
                        .raise();

                    setSelectedNodes(prev => [...prev, nodeData]);
                }
            });

            chart.setFunctionMouseOver((_, event) => {
                const nodeData = event.target.__data__;
                setNodeHovered(nodeData);
            });

            chart.setFunctionMouseOut(() => {
                setNodeHovered(null);
            });

            d3.select(containerRef.current).selectAll("*").remove();
            d3.select(containerRef.current).call(chart);

            d3.selectAll("circle.data_point").each(function () {
                const el = d3.select(this);
                const r = parseFloat(el.attr("r")) || 1;
                if (!el.attr("r-default")) el.attr("r-default", r);
                el.attr("r-current", r);
            });
        }
    }, [props.data]);

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
        setType("original");
        setSelectedNodes([]);

        d3.selectAll(".data_point").remove();
        d3.selectAll(".AP_points").remove();
        d3.selectAll(".attr_label").remove();
        d3.selectAll(".legend").remove();
        d3.selectAll(".radarlevel").remove();
        d3.selectAll(".grid")
            .each(function (d) {
                d3.select(this).attr("fill", "white")
            })
        chartRef.current?.updateRadviz();
    }





    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexWrap: 'wrap' }}>
            <div style={{ width: 400, height: 400 }} ref={containerRef}></div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>

                <Button disabled={valoreRaggio >= 5} variant="outlined" onClick={increaseRaggio}>
                    Raggio +
                </Button>
                <Button disabled={valoreRaggio <= -5} variant="outlined" onClick={decreaseRaggio}>
                    Raggio -
                </Button>
                <Button variant="outlined" onClick={() => chartRef.current?.increaseLevelGrid()}>
                    Level +
                </Button>
                <Button variant="outlined" onClick={() => chartRef.current?.decreaseLevelGrid()}>
                    Level -
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

            </div>

            <div>


            </div>
        </div>
    );
};

