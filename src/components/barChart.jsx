import React, { Fragment, useEffect, useRef, useState } from 'react';
import { select } from 'd3-selection';
import { scaleBand, scaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { Box, Typography } from '@mui/material';

export default function BarChart(props) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  // Stato per larghezza/altezza del container
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Stati per dati
  const [lastHoveredNode, setLastHoveredNode] = useState(null);
  const [lastLabels, setLastLabels] = useState([]);
  const [keyNode, setKeyNode] = useState("");

  // Aggiorna hoveredNode
  useEffect(() => {
    if (props.hoveredNode) {
      const key = Object.keys(props.hoveredNode.attributes)[0];
      setKeyNode(key);
      setLastHoveredNode(props.hoveredNode);
    } else {
      setLastHoveredNode(null);
      setKeyNode("");
    }
  }, [props.hoveredNode]);

  // Aggiorna labels/features
  useEffect(() => {
    if (Array.isArray(props.features)) {
      setLastLabels(props.features);
    } else {
      setLastLabels([]);
    }
  }, [props.features]);

  // Osserva resize del container per aggiornare dimensions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Funzione per aggiornare WIDTH/HEIGHT
    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      // Solo se cambiano
      setDimensions(prev => {
        if (prev.width !== w || prev.height !== h) {
          return { width: w, height: h };
        }
        return prev;
      });
    };

    updateSize();
    // ResizeObserver per reagire ai cambiamenti dinamici
    const ro = new ResizeObserver(() => {
      updateSize();
    });
    ro.observe(container);
    return () => {
      ro.disconnect();
    };
  }, []);

  // Disegna o ridisegna il grafico quando cambiano dati o dimensioni
  useEffect(() => {
    const { width, height } = dimensions;
    if (!svgRef.current || width <= 0 || height <= 0) return;
    if (!lastLabels || lastLabels.length === 0) {
      // Pulisce SVG se non ci sono label
      select(svgRef.current).selectAll('*').remove();
      return;
    }

    // Margini: puoi regolarli a seconda se vuoi spazi per assi/etichette
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    if (innerWidth <= 0 || innerHeight <= 0) {
      // area troppo piccola: pulisci
      select(svgRef.current).selectAll('*').remove();
      return;
    }

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();
    // Usa viewBox per rendere responsive
    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scale X con band per le labels
    const xScale = scaleBand()
      .domain(lastLabels)
      .range([0, innerWidth])
      .padding(0.2);

    // Scale Y: dominio dinamico basato sui valori nel nodo hovered, se presente
    // Se vuoi dominio fisso [0,1], mantieni maxValue=1. Altrimenti calcola max reale:
    const maxValue = 1;
    const yScale = scaleLinear()
      .domain([0, maxValue])
      .range([innerHeight, 0]);

    // Asse Y con percentuali
    g.append('g')
      .call(
        axisLeft(yScale)
          .ticks(5)
          .tickFormat(d => `${(d * 100).toFixed(0)}%`)
      )
      .selectAll('text')
      .style('font-size', '11px');

    // Griglia orizzontale
    const levels = 5;
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

    // Asse X
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

    // Barre: se c'è nodo hovered con dimensions
    const node = lastHoveredNode;
    if (node?.dimensions) {
      // Prepara dati
      const data = lastLabels.map(feat => ({
        feature: feat,
        value: node.dimensions[feat] ?? 0
      }));
      // Disegna barre
      g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.feature))
        .attr('y', d => yScale(d.value))
        .attr('width', d => xScale.bandwidth())
        .attr('height', d => innerHeight - yScale(d.value))
        .style('fill', 'orange');
    }
  }, [dimensions, lastHoveredNode, lastLabels]);

  return (

    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} />
    </div>
  );

}


