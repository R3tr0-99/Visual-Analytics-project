import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

export default function PieChart({ data, title, colorScale: providedColorScale, margin = { top: 30, right: 20, bottom: 20, left: 20 } }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const { width: fullWidth, height: fullHeight } = containerRef.current.getBoundingClientRect();
    svg.selectAll("*").remove();

    if (!data || data.length === 0 || fullWidth <= 0 || fullHeight <= 0) {
        return;
    }
    
    // --- MODIFICA CHIAVE: Filtra i dati per rimuovere gli elementi con valore 0 o nullo ---
    const dataWithValues = data.filter(d => d.value > 0);

    if (dataWithValues.length === 0) {
        // Opzionale: mostra un messaggio se non ci sono dati da visualizzare
        svg.append("text")
            .attr("x", fullWidth / 2)
            .attr("y", fullHeight / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "#888")
            .text("Nessun dato > 0");
        return;
    }

    const width = fullWidth - margin.left - margin.right;
    const height = fullHeight - margin.top - margin.bottom;
    const radius = Math.min(width, height) / 2;

    svg.attr("width", fullWidth).attr("height", fullHeight);

    const g = svg.append("g")
      .attr("transform", `translate(${fullWidth / 2}, ${fullHeight / 2})`);

    const colorScale = providedColorScale || d3.scaleOrdinal().domain(dataWithValues.map(d => d.label)).range(d3.schemeTableau10);
   
    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    g.selectAll("path")
      .data(pie(dataWithValues)) // Usa i dati filtrati
      .join("path")
        .attr("d", arc)
        .attr("fill", d => colorScale(d.data.label))
        .attr("stroke", "white")
        .style("stroke-width", "2px");

    const total = d3.sum(dataWithValues, d => d.value);
    const formatPercent = d3.format(".1%");
    const labelArc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius * 0.6);

    const labels = g.selectAll('text.label')
      .data(pie(dataWithValues)) 
      .join('text')
      .attr('class', 'label')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .style('text-shadow', '0 0 3px black, 0 0 3px black');
      
    labels.append('tspan')
        .attr('x', 0)
        .attr('y', '-0.4em')
        .text(d => d.data.label);

    labels.append('tspan')
        .attr('x', 0)
        .attr('y', '0.7em')
        .style('font-size', '10px')
        .text(d => {
            const percent = total > 0 ? d.data.value / total : 0;
            return percent > 0.01 ? formatPercent(percent) : ""; // Mostra solo se > 1%
        });

    svg.append("text")
        .attr("x", fullWidth / 2)
        .attr("y", margin.top)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text(title || "Distribuzione");

  }, [data, title, providedColorScale, margin]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} />
    </div>
  );
}