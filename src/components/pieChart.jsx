// src/components/PieChart.jsx

import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

/**
 * PieChart
 * @param {Array<Object>} data - array di oggetti, ciascuno con 'label' e 'value'.
 * @param {Array<string>} [colors] - array opzionale di colori.
 * @param {Object} [margin] - margini opzionali.
 */
export default function PieChart({ data, colors, margin = { top: 40, right: 20, bottom: 20, left: 20 } }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const svg = d3.select(svgRef.current);

    // Se non ci sono dati, pulisci l'SVG e interrompi.
    if (!data || data.length === 0) {
        svg.selectAll("*").remove();
        return;
    }

    // 1. DIMENSIONI
    const { width: fullWidth, height: fullHeight } = containerRef.current.getBoundingClientRect();
    const width = fullWidth - margin.left - margin.right;
    const height = fullHeight - margin.top - margin.bottom;
    const radius = Math.min(width, height) / 2;

    // 2. SETUP SVG
    svg
      .attr("width", fullWidth)
      .attr("height", fullHeight);
    svg.selectAll("*").remove(); // Pulisci prima di ridisegnare

    const g = svg
      .append("g")
      .attr("transform", `translate(${fullWidth / 2}, ${fullHeight / 2})`);

    // 3. SCALE DI COLORI
    const colorScale = d3
      .scaleOrdinal()
      .domain(data.map(d => d.label))
      .range(colors || d3.schemeTableau10);

    // 4. GENERATORI DI DATI
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    // 5. DISEGNO DELLE FETTE
    g.selectAll("path")
      .data(pie(data))
      .join("path")
        .attr("d", arc)
        .attr("fill", d => colorScale(d.data.label))
        .attr("stroke", "white")
        .style("stroke-width", "2px");

    // 6. ETICHETTE
    const labelArc = d3.arc()
      .innerRadius(radius * 0.7)
      .outerRadius(radius * 0.7);

    g.selectAll('text.label')
      .data(pie(data))
      .join('text')
      .attr('class', 'label')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', 'white')
      .style('text-shadow', '0 0 2px black')
      .text(d => d.data.label);

    // 7. TITOLO
    svg.append("text")
        .attr("x", fullWidth / 2)
        .attr("y", margin.top / 2 + 5)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text("Distribuzione Valori Nodo");


  }, [data, colors, margin]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} />
    </div>
  );
}