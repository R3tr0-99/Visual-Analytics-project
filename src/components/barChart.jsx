import React, { useEffect, useRef, useState } from 'react';
import { select } from 'd3-selection';
import { scaleBand, scaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import * as d3 from 'd3';

export default function BarChart(props) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [nodeToDisplay, setNodeToDisplay] = useState(null);

  useEffect(() => {
    if (props.selectedNode) {
      setNodeToDisplay(props.selectedNode);
    } 
    else if (props.hoveredNode) {
      setNodeToDisplay(props.hoveredNode);
    } 
    else {
      setNodeToDisplay(null);
    }
  }, [props.selectedNode, props.hoveredNode]);
  console.log(props.selectedNode);
  const [lastLabels, setLastLabels] = useState([]);
  
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
      setDimensions(prev => prev.width !== w || prev.height !== h ? { width: w, height: h } : prev);
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const { width, height } = dimensions;
    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    if (!svgRef.current || width <= 0 || height <= 0 || !lastLabels || lastLabels.length === 0) {
      return;
    }

    const margin = { top: 40, right: 20, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;
    
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    
    const node = nodeToDisplay;
    if (!node) {
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', '#888')
        .text("Per visualizare il barchart seleziona un nodo tramite Radviz o Stackedbarchart");
      return;
    }
    
    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio', 'xMidYMid meet');
    
    // Trova i dati corretti (originali se da Radviz, altrimenti diretti)
    const realDataNode = node.original || node;

    
    // Calcola la somma di tutti i valori numerici per il nodo corrente
    const total = lastLabels.reduce((acc, feat) => {
        const val = +realDataNode[feat];
        return acc + (isNaN(val) ? 0 : val);
    }, 0);

    // Crea l'array di dati con i valori normalizzati (percentuali)
    const data = lastLabels.map(feat => {
        const rawValue = realDataNode[feat];
        const numericValue = +rawValue;
        return {
          feature: feat,
          // Calcola il valore come percentuale del totale
          value: total > 0 && !isNaN(numericValue) ? numericValue / total : 0
        };
    });
    // --- FINE MODIFICA 1 ---

    // --- MODIFICA CHIAVE 2: Usa una scala Y fissa per le percentuali ---
    const xScale = scaleBand().domain(lastLabels).range([0, innerWidth]).padding(0.2);
    const yScale = scaleLinear()
      .domain([0, 1]) // Scala fissa 0-1 per le percentuali
      .range([innerHeight, 0]);

    g.append('g')
      .call(
        axisLeft(yScale)
          .ticks(5)
          .tickFormat(d3.format(".0%")) // Formato percentuale
      )
      .selectAll('text')
      .style('font-size', '11px');
    // --- FINE MODIFICA 2 ---

    g.selectAll('line.grid')
      .data(yScale.ticks(5)).enter().append('line')
      .attr('class', 'grid')
      .attr('x1', 0).attr('x2', innerWidth)
      .attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
      .style('stroke', '#ddd').style('stroke-dasharray', '2,2');
    
    const xAxisG = g.append('g').attr('transform', `translate(0, ${innerHeight})`).call(axisBottom(xScale).tickSize(0));
    xAxisG.selectAll('text').attr('text-anchor', 'end').attr('transform', 'rotate(-40)').attr('dx', '-0.5em').attr('dy', '0.2em').style('font-size', '11px');

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text(`Distribuzione % di ${realDataNode.name || node.id}`);
    
    // Il disegno delle barre ora usa i valori percentuali calcolati
    g.selectAll('.bar')
      .data(data).enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.feature))
      .attr('y', d => yScale(d.value))
      .attr('width', xScale.bandwidth())
      .attr('height', d => Math.max(0, innerHeight - yScale(d.value)))
      .style('fill', d => props.colorScale ? props.colorScale(d.feature) : 'orange');

  }, [dimensions, nodeToDisplay, lastLabels, props.colorScale]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}