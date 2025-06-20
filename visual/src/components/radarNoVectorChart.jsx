import { Typography } from "@mui/material";
import { useEffect, useRef, Fragment, useState } from "react";
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { minEffectivenessErrorHeuristic } from "../utils/arrangement";

export default function RadarNoVectorChart(props) {
    const { csvData, hoveredNode, features, type } = props;
    const ref = useRef(null);
    const size = 600;
    const levels = 5;
    const radius = size / 2 - 40;

    const [lastHoveredNode, setLastHoveredNode] = useState(null);
    const [lastLabels, setLastLabels] = useState([]);

    // 1) Hovered node
    useEffect(() => {
        if (hoveredNode) setLastHoveredNode(hoveredNode);
    }, [hoveredNode]);

    // 2) Labels: se type==="eehm" calcola con heuristic, altrimenti usa features
    useEffect(() => {
        // caso default: props.features
        if (type !== 'eemh') {
            if (Array.isArray(features)) {
                setLastLabels(features);
            }
            return;
        }

        // caso "eehm": applica heuristic sul csvData
        if (!Array.isArray(csvData) || csvData.length === 0) {
            setLastLabels([]);
            return;
        }

        // estrai nomi di colonna (esclude "regione")
        const featureNames = Object.keys(csvData[0]).filter(k => k !== 'regione');

        // prepara struttura per l'heuristic
        const dataStruct = {
            entries: csvData,
            dimensions: featureNames.map(name => ({
                values: csvData.map(r => +r[name])
            }))
        };

        // calcola ordine con heuristic
        const perm = minEffectivenessErrorHeuristic(dataStruct, /*fast=*/false);
        const ordered = perm.map(idx => featureNames[idx]);
        setLastLabels(ordered);

    }, [type, features, csvData]);

    // 3) Disegno del radar
    useEffect(() => {
        if (!ref.current || lastLabels.length === 0) return;

        const svg = select(ref.current);
        svg.selectAll('*').remove();
        svg.attr('width', size).attr('height', size);

        const g = svg.append('g')
            .attr('transform', `translate(${size / 2},${size / 2})`);

        const angleSlice = (Math.PI * 2) / lastLabels.length;

        // sfondo
        g.append('circle').attr('r', radius).style('fill', '#eee');

        // livelli concentrici
        for (let lvl = 1; lvl <= levels; lvl++) {
            const r = (radius / levels) * lvl;
            g.append('circle')
                .attr('r', r)
                .style('fill', 'none')
                .style('stroke', '#999')
                .style('stroke-opacity', 0.3);
        }

        // etichette
        lastLabels.forEach((feature, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const x = Math.cos(angle) * (radius + 20);
            const y = Math.sin(angle) * (radius + 20);

            let label = feature;
            const raw = lastHoveredNode?.original?.[feature];
            if (raw !== undefined) {
                label += `\n${(raw * 100).toFixed(2)}%`;
            }

            g.append('text')
                .attr('x', x).attr('y', y)
                .text(label)
                .style('text-anchor', 'middle')
                .style('dominant-baseline', 'middle')
                .style('font-size', '11px');
        });

        // raggi e punti
        if (lastHoveredNode) {
            const maxRaw = Math.max(
                ...lastLabels.map(f => lastHoveredNode.original[f] || 0)
            );
            const rScale = scaleLinear()
                .domain([0, maxRaw])
                .range([0, radius]);

            lastLabels.forEach((feature, i) => {
                const raw = lastHoveredNode.original[feature] ?? 0;
                const angle = angleSlice * i - Math.PI / 2;
                const r = rScale(raw);
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;

                g.append('line')
                    .attr('x1', 0).attr('y1', 0)
                    .attr('x2', x).attr('y2', y)
                    .style('stroke', 'orange')
                    .style('stroke-width', 4)
                    .style('stroke-linecap', 'round');

                g.append('circle')
                    .attr('cx', x).attr('cy', y)
                    .attr('r', 3)
                    .style('fill', 'orange');
            });
        }
    }, [lastHoveredNode, lastLabels]);

    return (
        <Fragment>
            <div>
                <Typography variant="subtitle1" align="center">
                    {lastHoveredNode
                        ? `Valori di ${lastHoveredNode.id}`
                        : "Nessun nodo selezionato"}
                </Typography>
                <svg ref={ref}></svg>
            </div>
        </Fragment>
    );
}
