import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

// Il margine di default è stato modificato per rimuovere lo spazio laterale
export default function PieChart({ 
  data, 
  title, 
  colorScale: providedColorScale, 
  margin = { top: 30, right: 0, bottom: 20, left: 0 }, // <-- MODIFICA QUI
  showTitle = true,
  isSelected = false,
  isHovered = false,
  showTooltips = true
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

    // Create tooltip only if showTooltips is true
    let tooltip = null;
    if (showTooltips) {
      tooltip = d3.select("body").selectAll(".pie-tooltip")
        .data([0])
        .join("div")
        .attr("class", "pie-tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("z-index", 1000);
    }

    // Calculate total for percentage calculation
    const total = dataWithValues.reduce((sum, d) => sum + d.value, 0);

    const paths = g.selectAll("path")
      .data(pie(dataWithValues))
      .join("path")
        .attr("d", arc)
        .attr("fill", d => colorScale(d.data.label))
        .attr("stroke", "white")
        .style("stroke-width", "2px");

    // Add tooltip events only if showTooltips is true
    if (showTooltips && tooltip) {
      paths
        .on("mouseover", function(event, d) {
          const percentage = ((d.data.value / total) * 100).toFixed(1);
          const raw = d.data.originalValue !== undefined ? d.data.originalValue : d.data.value;
          const displayValue = typeof raw === 'number' ? raw.toLocaleString() : raw;
          tooltip.transition().duration(200).style("opacity", 1);
          tooltip.html(`${d.data.label}<br/>Value: ${displayValue}<br/>Percentage: ${percentage}%`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on("mousemove", function(event) {
          tooltip.style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
          tooltip.transition().duration(200).style("opacity", 0);
        });
    }

    // Applica stili di evidenziazione se il pie chart è selezionato o in hover
    if (isSelected || isHovered) {
      paths.style("opacity", 1)
           .style("stroke", isSelected ? "black" : (isHovered ? "dimgray" : "white"))
           .style("stroke-width", isSelected || isHovered ? "3px" : "2px");
      
      // Aggiungi un bordo esterno al contenitore
      svg.append("rect")
         .attr("x", 2)
         .attr("y", 2)
         .attr("width", fullWidth - 4)
         .attr("height", fullHeight - 4)
         .attr("fill", "none")
         .attr("stroke", isSelected ? "black" : "dimgray")
         .attr("stroke-width", 2)
         .attr("rx", 10);
    } else {
      paths.style("opacity", 1)
           .style("stroke", "white")
           .style("stroke-width", "2px");
    }

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

  }, [data, title, providedColorScale, margin, showTitle, isSelected, isHovered, showTooltips]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} />
    </div>
  );
}