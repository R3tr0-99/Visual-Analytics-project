import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

/**
 * 100% StackedBarChart. Normalizza i dati e gestisce il click sulla barra.
 * @param {Array<Object>} data
 * @param {Function} [colorScale]
 * @param {Object} [margin]
 * @param {Object|null} [selectedNode]
 * @param {Function} [onBarClick] - Callback da eseguire al click, passa il `name` della barra.
 */
export default function StackedBarChart({ data, colorScale, margin = { top: 40, right: 30, bottom: 50, left: 50 }, selectedNode, onBarClick }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const gRef = useRef(null); // Ref per il gruppo principale delle barre

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return;

    const keys = Object.keys(data[0]).filter(
      k => k !== 'name' && k !== 'id' && typeof data[0][k] === 'number'
    );
    if (keys.length === 0) return;

    const normalizedData = data.map(d => {
      const total = keys.reduce((acc, key) => acc + (d[key] || 0), 0);
      const normalizedRow = { name: d.name, id: d.id };
      keys.forEach(key => {
        normalizedRow[key] = total > 0 ? (d[key] || 0) / total : 0;
      });
      return normalizedRow;
    });

    const { width: fullWidth, height: fullHeight } = containerRef.current.getBoundingClientRect();
    const width = fullWidth - margin.left - margin.right;
    const height = fullHeight - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", fullWidth)
      .attr("height", fullHeight);
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Salva il riferimento al gruppo per poter aggiungere l'evento di click dopo
    gRef.current = g;

    const stackGen = d3.stack().keys(keys);
    const series = stackGen(normalizedData);
    
    const x = d3.scaleBand().domain(data.map(d => d.name)).range([0, width]).padding(0.1);
    const y = d3.scaleLinear().domain([0, 1]).range([height, 0]);
    const color = colorScale || d3.scaleOrdinal().domain(keys).range(d3.schemeTableau10);
    
    // Disegniamo i gruppi di barre
    const barGroups = g.append("g")
      .selectAll("g")
      .data(series)
      .join("g")
        .attr("fill", d => color(d.key))
      .selectAll("rect")
      .data(d => d)
      .join("rect")
        .attr("x", d => x(d.data.name)) 
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth());

    // --- NUOVA LOGICA DI CLICK ---
    // Invece di aggiungere l'evento a ogni `rect`, lo aggiungiamo a un gruppo invisibile
    // che copre l'intera colonna. Questo è più efficiente e più facile da gestire.
    g.append("g")
      .selectAll("g")
      .data(normalizedData)
      .join("rect")
        .attr("class", "click-target")
        .attr("x", d => x(d.name))
        .attr("y", 0)
        .attr("width", x.bandwidth())
        .attr("height", height)
        .style("fill", "transparent") // Rende il rettangolo invisibile
        .style("cursor", "pointer")  // Cambia il cursore per indicare che è cliccabile
        .on("click", (event, d) => {
          if (onBarClick) {
            onBarClick(d.name); // Chiama il callback con il nome della barra cliccata
          }
        });
    // --- FINE LOGICA DI CLICK ---

    // Evidenziazione del nodo selezionato da Radviz
    if (selectedNode?.attributes?.name) {
      const selectedName = selectedNode.attributes.name;
      barGroups
          .style("opacity", d => d.data.name === selectedName ? 1 : 0.3)
          .style("stroke", d => d.data.name === selectedName ? "black" : "none")
          .style("stroke-width", d => d.data.name === selectedName ? 2 : 0);
    }
    
    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x)).selectAll("text").attr("transform", "rotate(-45)").style("text-anchor", "end");
    g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")));
    
    // ... (La logica della legenda rimane invariata) ...
    const legendGroup = svg.append("g").attr("font-family", "sans-serif").attr("font-size", 10).attr("text-anchor", "start").attr("transform", `translate(${margin.left}, 10)`);
    const legendItems = legendGroup.selectAll("g").data(keys).join("g");
    legendItems.append("rect").attr("width", 19).attr("height", 19).attr("fill", color);
    legendItems.append("text").attr("x", 24).attr("y", 9.5).attr("dy", "0.32em").text(d => d);
    let totalLegendWidth = 0; const legendPadding = 15;
    legendItems.each(function() { const itemWidth = this.getBBox().width; d3.select(this).attr("transform", `translate(${totalLegendWidth}, 0)`); totalLegendWidth += itemWidth + legendPadding; });
    totalLegendWidth -= legendPadding;
    if (totalLegendWidth > width) { const scaleFactor = width / totalLegendWidth; legendGroup.attr("font-size", 10 * scaleFactor); let newCurrentX = 0; legendItems.each(function() { const itemWidth = this.getBBox().width; d3.select(this).attr("transform", `translate(${newCurrentX}, 0)`); newCurrentX += itemWidth + legendPadding; }); }

  }, [data, selectedNode, colorScale, margin, onBarClick]); // Aggiunta dipendenza onBarClick

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} />
    </div>
  );
}