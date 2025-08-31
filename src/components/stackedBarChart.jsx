import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

export default function StackedBarChart({ data, features, colorScale, margin = { top: 40, right: 30, bottom: 50, left: 50 }, selectedNode, hoveredNode, onBarClick, dataTypeId, showTooltips = true }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const keys = features;
    if (!data || data.length === 0 || !keys || keys.length === 0 || !containerRef.current) {
        if(svgRef.current) d3.select(svgRef.current).selectAll("*").remove();
        return;
    }

    const processedData = data.map(d => {
      // If data is already in [0,1] domain, use original values for proportions
      if (dataTypeId === 'dominio_01' || dataTypeId === 'partizionali') {
        const total = keys.reduce((acc, key) => acc + (d[key] || 0), 0);
        const normalizedRow = { name: d.name, id: d.id };
        keys.forEach(key => {
          normalizedRow[key] = total > 0 ? (d[key] || 0) / total : 0;
        });
        return normalizedRow;
      }

      // For other data types, normalize each attribute to 0-1 scale first
      const normalizedValues = {};
      keys.forEach(key => {
        const values = data.map(item => item[key] || 0);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        // Normalize to 0-1 scale
        normalizedValues[key] = range > 0 ? (d[key] - min) / range : 0;
      });
      
      // Then calculate proportions based on normalized values
      const total = Object.values(normalizedValues).reduce((acc, val) => acc + val, 0);
      const normalizedRow = { name: d.name, id: d.id };
      keys.forEach(key => {
        normalizedRow[key] = total > 0 ? normalizedValues[key] / total : 0;
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
    const series = stackGen(processedData);
    
    const yMax = 1;
    
    const x = d3.scaleBand().domain(data.map(d => d.name)).range([0, width]).padding(0.1);
    const y = d3.scaleLinear().domain([0, yMax]).range([height, 0]);
    const color = colorScale || d3.scaleOrdinal().domain(keys).range(d3.schemeTableau10);
    
    // Create tooltip only if showTooltips is true
    let tooltip = null;
    if (showTooltips) {
      tooltip = d3.select("body").selectAll(".stacked-tooltip")
        .data([0])
        .join("div")
        .attr("class", "stacked-tooltip")
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
    
    const barGroups = g.append("g").selectAll("g").data(series).join("g")
        .attr("fill", d => color(d.key))
      .selectAll("rect").data(d => d).join("rect")
        .attr("x", d => x(d.data.name)) 
        .attr("y", d => y(d[1]))
        .attr("height", d => Math.max(0, y(d[0]) - y(d[1])))
        .attr("width", x.bandwidth());

    // Add tooltip events only if showTooltips is true
    if (showTooltips && tooltip) {
      barGroups
        .on("mouseover", function(event, d) {
          const segmentValue = d[1] - d[0];
          const percentage = (segmentValue * 100).toFixed(1);
          const feature = d3.select(this.parentNode).datum().key;
          tooltip.transition().duration(200).style("opacity", 1);
          tooltip.html(`${d.data.name}<br/>Feature: ${feature}<br/>Value: ${segmentValue.toFixed(3)}<br/>Percentage: ${percentage}%`)
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

    g.append("g").selectAll("g").data(data).join("rect")
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

    const selectedBarName = selectedNode?.attributes?.name || selectedNode?.name;
    const hoveredBarName = hoveredNode?.attributes?.name || hoveredNode?.name;

    if (selectedBarName || hoveredBarName) {
      barGroups
        .style("opacity", d => (d.data.name === selectedBarName || d.data.name === hoveredBarName) ? 1 : 0.3)
        .style("stroke", d => d.data.name === selectedBarName ? "black" : (d.data.name === hoveredBarName ? "dimgray" : "none"))
        .style("stroke-width", d => (d.data.name === selectedBarName || d.data.name === hoveredBarName) ? 2 : 0);
    } else {
      barGroups.style("opacity", 1).style("stroke", "none").style("stroke-width", 0);
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

  }, [data, features, selectedNode, hoveredNode, colorScale, margin, onBarClick, dataTypeId, showTooltips]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} />
    </div>
  );
}