import { Typography } from "@mui/material";
import { useEffect, useRef, Fragment, useState } from "react";
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';

export default function RadarNoVectorChart(props) {
    const ref = useRef(null);
    const size = 600;
    const levels = 5;
    const maxValue = 1;
    const radius = size / 2 - 40;


    const [lastHoveredNode, setLastHoveredNode] = useState(null);
    const [lastLabels, setLastLabels] = useState([]);


    useEffect(() => {
        if (props.hoveredNode) {
            setLastHoveredNode(props.hoveredNode)
        }
    }, [props.hoveredNode])
    useEffect(() => {
        if (props.features) {
            setLastLabels(props.features)
        }
    }, [props.features])


    useEffect(() => {
        if (!ref.current || !lastLabels?.length) return;

        const svg = select(ref.current);
        svg.selectAll('*').remove();
        svg.attr('width', size).attr('height', size);

        const g = svg.append('g')
            .attr('transform', `translate(${size / 2}, ${size / 2})`);

        const angleSlice = (Math.PI * 2) / lastLabels.length;
        const rScale = scaleLinear().domain([0, maxValue]).range([0, radius]);

        // Sfondo
        g.append('circle')
            .attr('r', radius)
            .style('fill', '#eee');

        // Cerchi concentrici
        for (let level = 1; level <= levels; level++) {
            const r = (radius / levels) * level;
            g.append('circle')
                .attr('r', r)
                .style('fill', 'none')
                .style('stroke', '#999')
                .style('stroke-opacity', 0.3);
        }

        // Etichette
        lastLabels.forEach((feature, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const x = Math.cos(angle) * (radius + 20);
            const y = Math.sin(angle) * (radius + 20);

            let label = feature;
            const value = lastHoveredNode?.original?.[feature];
            if (value !== undefined) {
                label += `\n${value.toFixed(2)}`;
            }

            g.append('text')
                .attr('x', x)
                .attr('y', y)
                .text(label)
                .style('fill', 'black')
                .style('font-size', '11px')
                .style('text-anchor', 'middle')
                .style('dominant-baseline', 'middle');
        });

        const node = lastHoveredNode;
        if (node?.dimensions) {
            lastLabels.forEach((feature, i) => {
                const value = node.dimensions[feature] ?? 0;
                const angle = angleSlice * i - Math.PI / 2;
                const r = rScale(value);
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;

                // Linea dal centro al punto
                g.append('line')
                    .attr('x1', 0)
                    .attr('y1', 0)
                    .attr('x2', x)
                    .attr('y2', y)
                    .style('stroke', 'orange')
                    .style('stroke-width', 4)
                    .style('stroke-linecap', 'round');

                // Punto finale
                g.append('circle')
                    .attr('cx', x)
                    .attr('cy', y)
                    .attr('r', 3)
                    .style('fill', 'orange');
            });
        }

    }, [lastHoveredNode, lastLabels]);

    return (
        <Fragment>
            <div>
                <svg ref={ref}></svg>
            </div>
        </Fragment>
    );
}
