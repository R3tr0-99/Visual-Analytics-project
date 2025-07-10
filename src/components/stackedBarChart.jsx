import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

export default function StackedBarChart({ data, features, colorScale, margin = { top: 40, right: 30, bottom: 50, left: 50 }, selectedNode, hoveredNode, onBarClick }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const keys = features;
    if (!data || data.length === 0 || !keys || keys.length === 0 || !containerRef.current) {
        if(svgRef.current) d3.select(svgRef.current).selectAll("*").remove();
        return;
    }

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

    const svg = d3.select(svgRef.current).attr("width", fullWidth).attr("height", fullHeight);
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const stackGen = d3.stack().keys(keys);
    const series = stackGen(normalizedData);
    
    const x = d3.scaleBand().domain(data.map(d => d.name)).range([0, width]).padding(0.1);
    const y = d3.scaleLinear().domain([0, 1]).range([height, 0]);
    const color = colorScale || d3.scaleOrdinal().domain(keys).range(d3.schemeTableau10);
    
    // NOTA: Qui raggruppiamo tutti i rettangoli sotto un'unica selezione "barGroups"
    // per applicare gli stili più facilmente.
    const barGroups = g.append("g").selectAll("g").data(series).join("g")
        .attr("fill", d => color(d.key))
      .selectAll("rect").data(d => d).join("rect")
        .attr("x", d => x(d.data.name)) 
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth());

    g.append("g").selectAll("g").data(normalizedData).join("rect")
        .attr("class", "click-target")
        .attr("x", d => x(d.name))
        .attr("y", 0)
        .attr("width", x.bandwidth())
        .attr("height", height)
        .style("fill", "transparent")
        .style("cursor", "pointer")
        .on("click", (event, d) => {
          if (onBarClick) onBarClick(d.name);
        });

    // --- NUOVA LOGICA DI EVIDENZIAZIONE ---

    // 1. Estrai il nome della barra selezionata (dal click) e di quella sotto il mouse (dall'hover)
    const selectedBarName = selectedNode?.attributes?.name || selectedNode?.name;
    const hoveredBarName = hoveredNode?.attributes?.name || hoveredNode?.name;

    // 2. Applica gli stili in base a selezione e hover
    if (selectedBarName || hoveredBarName) {
      barGroups
        .style("opacity", d => {
          const isSelected = d.data.name === selectedBarName;
          const isHovered = d.data.name === hoveredBarName;
          // La barra è completamente visibile se è selezionata O se è sotto il mouse
          return (isSelected || isHovered) ? 1 : 0.3;
        })
        .style("stroke", d => {
          const isSelected = d.data.name === selectedBarName;
          const isHovered = d.data.name === hoveredBarName;
          // Il bordo nero (selezione) ha la priorità sul bordo grigio (hover)
          if (isSelected) return "black";
          if (isHovered) return "dimgray"; // Stile per l'hover, puoi cambiarlo
          return "none";
        })
        .style("stroke-width", d => {
          const isSelected = d.data.name === selectedBarName;
          const isHovered = d.data.name === hoveredBarName;
          // Applica un bordo se la barra è selezionata o hoverata
          return (isSelected || isHovered) ? 2 : 0;
        });
    } else {
      // Se non c'è né selezione né hover, resetta tutti gli stili
      barGroups
        .style("opacity", 1)
        .style("stroke", "none")
        .style("stroke-width", 0);
    }
    
    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x)).selectAll("text").attr("transform", "rotate(-45)").style("text-anchor", "end");
    g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")));
    
    const legendGroup = svg.append("g").attr("font-family", "sans-serif").attr("font-size", 10).attr("text-anchor", "start").attr("transform", `translate(${margin.left}, 10)`);
    const legendItems = legendGroup.selectAll("g").data(keys).join("g");
    legendItems.append("rect").attr("width", 19).attr("height", 19).attr("fill", color);
    legendItems.append("text").attr("x", 24).attr("y", 9.5).attr("dy", "0.32em").text(d => d);
    let totalLegendWidth = 0; const legendPadding = 15;
    legendItems.each(function() { const itemWidth = this.getBBox().width; d3.select(this).attr("transform", `translate(${totalLegendWidth}, 0)`); totalLegendWidth += itemWidth + legendPadding; });
    totalLegendWidth -= legendPadding;
    if (totalLegendWidth > width) { const scaleFactor = width / totalLegendWidth; legendGroup.attr("font-size", 10 * scaleFactor); let newCurrentX = 0; legendItems.each(function() { const itemWidth = this.getBBox().width; d3.select(this).attr("transform", `translate(${newCurrentX}, 0)`); newCurrentX += itemWidth + legendPadding; }); }

  }, [data, features, selectedNode, hoveredNode, colorScale, margin, onBarClick]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} />
    </div>
  );
}