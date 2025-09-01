
import React, { useEffect, useRef, useState } from "react";
import * as d3 from 'd3';
import { Box, Typography, Paper } from "@mui/material";

// --- MODIFICA 1: Ripristino della logica del tooltip ---
const tooltipStyle = {
  position: 'absolute',
  textAlign: 'center',
  padding: '6px',
  fontSize: '12px',
  background: 'rgba(0, 0, 0, 0.7)',
  color: 'white',
  borderRadius: '4px',
  pointerEvents: 'none',
  opacity: 0,
  transition: 'opacity 0.2s',
};

export default function RadarChart({ data, features }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const { width, height } = dimensions;
    if (!svgRef.current || features.length < 2 || !data || data.length === 0 || width === 0 || height === 0) {
        d3.select(svgRef.current).selectAll("*").remove();
        return;
    }

    const size = Math.min(width, height);
    const margin = 50;
    const radius = (size / 2) - margin;
    const levels = 5;

    const svg = d3.select(svgRef.current).attr("width", size).attr("height", size);
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", `translate(${size / 2},${size / 2})`);
    
    // Ripristino della creazione del div per il tooltip
    const tooltip = d3.select(containerRef.current)
      .append("div")
      .attr("style", Object.entries(tooltipStyle).map(([k, v]) => `${k.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}:${v}`).join(';'))
      .attr("class", "radarchart-tooltip");

    const rScale = d3.scaleLinear().domain([0, 1]).range([0, radius]);
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(data.map(d => d.id));
    const angleSlice = (Math.PI * 2) / features.length;

    // --- DISEGNO GRIGLIA E ASSI ---
    const gridWrapper = g.append("g").attr("class", "grid-wrapper");

    gridWrapper.selectAll(".levels").data(d3.range(1, levels + 1).reverse())
      .enter().append("circle").attr("class", "levels")
      .attr("r", d => rScale(d / levels))
      .style("fill", "#CDCDCD").style("stroke", "#CDCDCD").style("fill-opacity", 0.1);
    
    gridWrapper.selectAll(".level-label").data(d3.range(1, levels + 1).reverse())
      .enter().append("text").attr("class", "level-label")
      .attr("x", 4).attr("y", d => -rScale(d / levels))
      .attr("dy", "0.4em").style("font-size", "10px").attr("fill", "#737373")
      .text(d => `${(100 * d / levels).toFixed(0)}%`);

    const axis = gridWrapper.selectAll(".axis").data(features).enter().append("g").attr("class", "axis");
    
    axis.append("line")
      .attr("x1", 0).attr("y1", 0)
      .attr("x2", (_, i) => rScale(1.05) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y2", (_, i) => rScale(1.05) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("class", "line").style("stroke", "grey").style("stroke-width", "1px");

    axis.append("text")
      .attr("class", "legend")
      .style("font-size", "12px").attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("x", (_, i) => rScale(1.1) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y", (_, i) => rScale(1.1) * Math.sin(angleSlice * i - Math.PI / 2))
      .text(d => d)
      .call(wrap, 80);

    // --- DISEGNO DEI DATI ---
    const radarLine = d3.lineRadial()
      .radius(d => rScale(d.value))
      .angle((_, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);
    
    data.forEach(node => {
      const total = features.reduce((acc, feature) => acc + (node[feature] || 0), 0);
      const nodeData = features.map(feature => {
        const originalValue = node[feature] || 0;
        const normalizedValue = total > 0 ? originalValue / total : 0;
        return {
          axis: feature, 
          value: normalizedValue,
          originalValue: originalValue
        };
      });
      const nodeColor = colorScale(node.id);

      // Disegna solo il contorno, senza riempimento.
      g.append("path")
        .datum(nodeData).attr("d", radarLine)
        .style("stroke", nodeColor).style("stroke-width", 3).style("fill", "none");
        
      // --- MODIFICA 2: Aggiunta di cerchi TRASPARENTI per l'hover ---
      // Questi cerchi sono invisibili ma servono come area di "aggancio" per il mouse.
      g.selectAll(`.hover-dot-${node.id.replace(/\s+/g, '-')}`)
        .data(nodeData)
        .enter().append("circle")
        .attr("class", `hover-dot-${node.id.replace(/\s+/g, '-')}`)
        .attr("r", 6) // Raggio ampio per facilitare l'hover
        .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .style("fill", "transparent") // Reso invisibile
        .style("stroke", "none")
        .style("cursor", "pointer")
        .on("mouseover", (event, d) => {
          tooltip.transition().duration(200).style("opacity", 1);
          const percentage = (d.value * 100).toFixed(1);
          tooltip.html(`<strong>${d.axis}</strong><br>${d.originalValue.toFixed(2)} (${percentage}%)`)
            .style("left", `${event.pageX + 15}px`).style("top", `${event.pageY - 15}px`);
        })
        .on("mousemove", (event) => {
          tooltip.style("left", `${event.pageX + 15}px`).style("top", `${event.pageY - 15}px`);
        })
        .on("mouseout", () => {
          tooltip.transition().duration(500).style("opacity", 0);
        });
    });

    // Ripristino della funzione di cleanup per il tooltip
    return () => {
        d3.select(containerRef.current).select(".radarchart-tooltip").remove();
    };

  }, [data, features, dimensions]); 

  // Funzione helper wrap 
  function wrap(text, width) {
    text.each(function() {
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1, // ems
          y = text.attr("y"),
          dy = parseFloat(text.attr("dy")),
          tspan = text.text(null).append("tspan").attr("x", text.attr("x")).attr("y", y).attr("dy", dy + "em");
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", text.attr("x")).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
        }
      }
    });
  }

  return (
    <Box ref={containerRef} sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={0} sx={{width: '100%', p:1}}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, textAlign: 'center' }}>
          Visualizzazione Radar
        </Typography>
      </Paper>
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <svg ref={svgRef}></svg>
      </Box>
    </Box>
  );
}