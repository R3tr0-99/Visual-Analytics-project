import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

// Il margine ora serve solo per il titolo, quindi può essere più piccolo
export default function PieChart({ data, title, colorScale: providedColorScale, margin = { top: 30, right: 20, bottom: 20, left: 20 } }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const svg = d3.select(svgRef.current);

    if (!data || data.length === 0) {
        svg.selectAll("*").remove();
        return;
    }
    
    // Filtra i dati per rimuovere gli elementi con valore 0
    const dataWithValues = data.filter(d => d.value > 0);

    if (dataWithValues.length === 0) {
        svg.selectAll("*").remove();
        return;
    }
   
    const { width: fullWidth, height: fullHeight } = containerRef.current.getBoundingClientRect();
    const width = fullWidth - margin.left - margin.right;
    const height = fullHeight - margin.top - margin.bottom;
    const radius = Math.min(width, height) / 2;

    svg.attr("width", fullWidth).attr("height", fullHeight);
    svg.selectAll("*").remove();

    // Centra il gruppo del grafico nello spazio disponibile
    const g = svg.append("g")
      .attr("transform", `translate(${fullWidth / 2}, ${margin.top + height / 2})`);

    const colorScale = providedColorScale || d3.scaleOrdinal().domain(dataWithValues.map(d => d.label)).range(d3.schemeTableau10);
   
    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    g.selectAll("path")
      .data(pie(dataWithValues))
      .join("path")
        .attr("d", arc)
        .attr("fill", d => colorScale(d.data.label))
        .attr("stroke", "white")
        .style("stroke-width", "2px");

    // --- LOGICA ETICHETTE E LEGENDA COMPLETAMENTE RIMOSSA ---

    // Aggiunge solo il titolo
    svg.append("text")
        .attr("x", fullWidth / 2)
        .attr("y", margin.top / 2 + 5) // Posiziona il titolo in alto
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text(title || "Node Distribution");


  }, [data, title, providedColorScale, margin]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} />
    </div>
  );
}