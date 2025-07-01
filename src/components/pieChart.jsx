import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

export default function PieChart({ data, title, colorScale: providedColorScale, margin = { top: 40, right: 20, bottom: 20, left: 20 } }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const svg = d3.select(svgRef.current);

    if (!data || data.length === 0) {
        svg.selectAll("*").remove();
        return;
    }

    // --- MODIFICA CHIAVE: Filtra i dati per rimuovere gli elementi con valore 0 ---
    // Questo previene sia il disegno della fetta (che sarebbe invisibile) sia dell'etichetta.
    const dataWithValues = data.filter(d => d.value > 0);

    // Se dopo il filtro non ci sono più dati, pulisci e esci.
    if (dataWithValues.length === 0) {
        svg.selectAll("*").remove();
        return;
    }
    // --- FINE MODIFICA ---

    const { width: fullWidth, height: fullHeight } = containerRef.current.getBoundingClientRect();
    const width = fullWidth - margin.left - margin.right;
    const height = fullHeight - margin.top - margin.bottom;
    const radius = Math.min(width, height) / 2;

    svg.attr("width", fullWidth).attr("height", fullHeight);
    svg.selectAll("*").remove();

    const g = svg.append("g")
      .attr("transform", `translate(${fullWidth / 2}, ${fullHeight / 2})`);

    const colorScale = providedColorScale || d3.scaleOrdinal().domain(dataWithValues.map(d => d.label)).range(d3.schemeTableau10);

    // Ora usiamo `dataWithValues` per generare il grafico
    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    g.selectAll("path")
      .data(pie(dataWithValues)) // <-- Usa i dati filtrati
      .join("path")
        .attr("d", arc)
        .attr("fill", d => colorScale(d.data.label))
        .attr("stroke", "white")
        .style("stroke-width", "2px");

    const total = d3.sum(dataWithValues, d => d.value); // <-- Usa i dati filtrati
    const formatPercent = d3.format(".1%");
    const labelArc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius * 0.6);

    // Le etichette vengono create solo per i dati con valori
    const labels = g.selectAll('text.label')
      .data(pie(dataWithValues)) // <-- Usa i dati filtrati
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
            //lo lasciamo per sicurezza
            // nel caso di valori molto piccoli ma non nulli.
            return percent > 0.001 ? formatPercent(percent) : "";
        });

    svg.append("text")
        .attr("x", fullWidth / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text(title || "Distribuzione Valori Nodo");


  }, [data, title, providedColorScale, margin]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} />
    </div>
  );
}