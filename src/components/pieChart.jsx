import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

export default function PieChart({ data, colorScale: providedColorScale, margin = { top: 40, right: 20, bottom: 20, left: 20 } }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const svg = d3.select(svgRef.current);

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
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${fullWidth / 2}, ${fullHeight / 2})`);

    // 3. SCALE DI COLORI (usa quella fornita da App.jsx per coerenza)
    const colorScale = providedColorScale || d3.scaleOrdinal().domain(data.map(d => d.label)).range(d3.schemeTableau10);

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

   

    // Calcola il valore totale per poter derivare le percentuali
    const total = d3.sum(data, d => d.value);

    // Definisci il formato per le percentuali (es. 25.1%)
    const formatPercent = d3.format(".1%");

    const labelArc = d3.arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius * 0.6);

    const labels = g.selectAll('text.label')
      .data(pie(data))
      .join('text')
      .attr('class', 'label')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .style('text-shadow', '0 0 3px black, 0 0 3px black'); // Ombra più marcata per leggibilità
      
    // Aggiungi la prima riga di testo (l'etichetta)
    labels.append('tspan')
        .attr('x', 0)
        .attr('y', '-0.4em') // Sposta leggermente verso l'alto
        .text(d => d.data.label);

    // Aggiungi la seconda riga di testo (la percentuale)
    labels.append('tspan')
        .attr('x', 0)
        .attr('y', '0.7em') // Sposta leggermente verso il basso
        .style('font-size', '10px')
        .text(d => {
            // Calcola la percentuale
            const percent = total > 0 ? d.data.value / total : 0;
            // Mostra la percentuale solo se è significativa (es. > 1%)
            return percent > 0.01 ? formatPercent(percent) : "";
        });

    // --- FINE MODIFICA ---

    // 7. TITOLO
    svg.append("text")
        .attr("x", fullWidth / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text("Distribuzione Valori Nodo");


  }, [data, providedColorScale, margin]); // Aggiornata la dipendenza

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} />
    </div>
  );
}