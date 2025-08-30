import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

// Il margine di default è stato modificato per rimuovere lo spazio laterale
export default function PieChart({ 
  data, 
  title, 
  colorScale: providedColorScale, 
  margin = { top: 30, right: 0, bottom: 20, left: 0 }, // <-- MODIFICA QUI
  showTitle = true
}) {
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
   
    // Ottieni le dimensioni complete del contenitore
    const { width: fullWidth, height: fullHeight } = containerRef.current.getBoundingClientRect();
    
    // Calcola l'area di disegno sottraendo i margini
    // Con margin.left/right = 0, 'width' sarà uguale a 'fullWidth'
    const width = fullWidth - margin.left - margin.right;
    const height = fullHeight - margin.top - margin.bottom;
    
    // Il raggio è basato sulla dimensione più piccola per garantire che il cerchio si adatti
    const radius = Math.min(width, height) / 2;

    svg.attr("width", fullWidth).attr("height", fullHeight);
    svg.selectAll("*").remove();

    // Centra il gruppo del grafico nello spazio totale disponibile.
    // L'asse X è centrato su 'fullWidth / 2'.
    // L'asse Y è centrato sull'altezza disponibile dopo aver considerato il margine superiore.
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

    // Aggiunge il titolo centrato nella parte superiore dell'SVG solo se showTitle è true
    if (showTitle) {
      svg.append("text")
          .attr("x", fullWidth / 2)
          .attr("y", margin.top / 2 + 5) 
          .attr("text-anchor", "middle")
          .style("font-size", "14px")
          .style("font-weight", "bold")
          .style("fill", "#333")
          .text(title || "Node Distribution");
    }

  }, [data, title, providedColorScale, margin, showTitle]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} />
    </div>
  );
}