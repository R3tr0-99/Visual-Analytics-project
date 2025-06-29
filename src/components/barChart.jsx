import React, { useEffect, useRef, useState } from 'react';
import { select } from 'd3-selection';
import { scaleBand, scaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
// Rimuoviamo Box e Typography che non sono usati
// import { Box, Typography } from '@mui/material';

export default function BarChart(props) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [lastHoveredNode, setLastHoveredNode] = useState(null);
  const [lastLabels, setLastLabels] = useState([]);

  // --- FIX: useEffect corretto e semplificato ---
  // Rimuoviamo la logica che causa l'errore. Aggiorniamo semplicemente lo stato.
  useEffect(() => {
    setLastHoveredNode(props.hoveredNode);
  }, [props.hoveredNode]);

  useEffect(() => {
    if (Array.isArray(props.features)) {
      setLastLabels(props.features);
    } else {
      setLastLabels([]);
    }
  }, [props.features]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      setDimensions(prev => {
        if (prev.width !== w || prev.height !== h) {
          return { width: w, height: h };
        }
        return prev;
      });
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const { width, height } = dimensions;
    if (!svgRef.current || width <= 0 || height <= 0 || !lastLabels || lastLabels.length === 0) {
      select(svgRef.current).selectAll('*').remove();
      return;
    }

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) {
      select(svgRef.current).selectAll('*').remove();
      return;
    }

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();
    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = scaleBand()
      .domain(lastLabels)
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = scaleLinear()
      .domain([0, 1]) // Dominio fisso per dati normalizzati [0, 1]
      .range([innerHeight, 0]);

    g.append('g')
      .call(
        axisLeft(yScale)
          .ticks(5)
          .tickFormat(d => `${(d * 100).toFixed(0)}%`) // Formatta come percentuale
      )
      .selectAll('text')
      .style('font-size', '11px');

    g.selectAll('line.grid')
      .data(yScale.ticks(5))
      .enter()
      .append('line')
      .attr('class', 'grid')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .style('stroke', '#ddd')
      .style('stroke-dasharray', '2,2');
    
    const xAxisG = g
      .append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(axisBottom(xScale).tickSize(0));
    xAxisG
      .selectAll('text')
      .attr('text-anchor', 'end')
      .attr('transform', 'rotate(-40)')
      .attr('dx', '-0.5em')
      .attr('dy', '0.2em')
      .style('font-size', '11px');

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
        .style('fill', d => props.colorScale ? props.colorScale(d.feature) : 'orange');
    }
  }, [dimensions, lastHoveredNode, lastLabels, props.colorScale]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}