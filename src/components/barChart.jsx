import React, { Fragment, useEffect, useRef, useState } from 'react';
import { select } from 'd3-selection';
import { scaleBand, scaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { Typography } from '@mui/material';

export default function BarChart(props) {
    const ref = useRef(null);

    // Imposta larghezza e altezza indipendenti
    const width = 600;   // <-- Modifica qui la larghezza desiderata
    const height = 400;  // <-- Altezza fissa

    const margin = { top: 20, right: 10, bottom: 80, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const levels = 5;
    const maxValue = 1;

    const [lastHoveredNode, setLastHoveredNode] = useState(null);
    const [lastLabels, setLastLabels] = useState([]);
    const [keyNode, setKeyNode] = useState("");

    // Aggiorna il nodo al passaggio del mouse
    useEffect(() => {
        if (props.hoveredNode) {
            const key = Object.keys(props.hoveredNode.attributes)[0];
            setKeyNode(key);
            setLastHoveredNode(props.hoveredNode);
        }
    }, [props.hoveredNode]);

    // Aggiorna le labels/features
    useEffect(() => {
        if (props.features) {
            setLastLabels(props.features);
        }
    }, [props.features]);

    // Disegna il grafico
    useEffect(() => {
        if (!ref.current || !lastLabels.length) return;

        const svg = select(ref.current);
        svg.selectAll('*').remove();
        svg
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        const g = svg
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // scale X
        const xScale = scaleBand()
            .domain(lastLabels)
            .range([0, innerWidth])
            .padding(0.2);

        // scale Y da 0 a 1
        const yScale = scaleLinear()
            .domain([0, maxValue])
            .range([innerHeight, 0]);

        // asse Y con percentuali
        g.append('g')
            .call(
                axisLeft(yScale)
                    .ticks(levels)
                    .tickFormat(d => `${(d * 100).toFixed(0)}%`)
            )
            .selectAll('text')
            .style('font-size', '11px');

        // linee di griglia orizzontali
        for (let i = 1; i <= levels; i++) {
            const yVal = (innerHeight / levels) * i;
            g.append('line')
                .attr('x1', 0)
                .attr('x2', innerWidth)
                .attr('y1', yVal)
                .attr('y2', yVal)
                .style('stroke', '#999')
                .style('stroke-dasharray', '2,2')
                .style('stroke-opacity', 0.3);
        }

        // asse X
        g.append('g')
            .attr('transform', `translate(0, ${innerHeight})`)
            .call(axisBottom(xScale).tickSize(0))
            .selectAll('text')
            .attr('text-anchor', 'end')
            .attr('transform', 'rotate(-40)')
            .attr('dx', '-0.5em')
            .attr('dy', '0.2em')
            .style('font-size', '11px');

        // barre
        const node = lastHoveredNode;
        if (node?.dimensions) {
            const data = lastLabels.map(feat => ({
                feature: feat,
                value: node.dimensions[feat] ?? 0
            }));

            g.selectAll('.bar')
                .data(data)
                .enter()
                .append('rect')
                .attr('class', 'bar')
                .attr('x', d => xScale(d.feature))
                .attr('y', d => yScale(d.value))
                .attr('width', xScale.bandwidth())
                .attr('height', d => innerHeight - yScale(d.value))
                .style('fill', 'orange');
        }
    }, [lastHoveredNode, lastLabels, width, height]);

    return (
        <Fragment>
            {lastHoveredNode && (
                <Typography sx={{ mb: 1 }}>
                    Regione selezionata: <b>{lastHoveredNode.attributes[keyNode]}</b>
                </Typography>
            )}
            <svg ref={ref} width="100%" height={height}></svg>
        </Fragment>
    );
}