import React, { useEffect, useRef, useState } from "react";
import * as d3 from 'd3';
import { Box, Typography, Paper } from "@mui/material";

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
    
    // --- MODIFICA ANIMAZIONE 1: Definiamo la durata della transizione ---
    const transitionDuration = 750; // in millisecondi

    const svg = d3.select(svgRef.current).attr("width", size).attr("height", size);

    // --- MODIFICA ANIMAZIONE 2: Non cancelliamo tutto! Selezioniamo o creiamo il gruppo 'g' ---
    // Questo è fondamentale. Il gruppo 'g' ora persiste tra i render.
    const g = svg.selectAll("g.radar-chart-group").data([null]);
    const gEnter = g.enter().append("g").attr("class", "radar-chart-group");
    const gUpdate = g.merge(gEnter).attr("transform", `translate(${size / 2},${size / 2})`);

    // Il tooltip viene ancora gestito allo stesso modo
    const tooltip = d3.select(containerRef.current).selectAll(".radarchart-tooltip").data([null])
      .join("div")
      .attr("style", Object.entries(tooltipStyle).map(([k, v]) => `${k.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}:${v}`).join(';'))
      .attr("class", "radarchart-tooltip");

    const rScale = d3.scaleLinear().domain([0, 1]).range([0, radius]);
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(data.map(d => d.id));
    const angleSlice = (Math.PI * 2) / features.length;

    // --- GRIGLIA E ETICHETTE LIVELLI (queste non necessitano di animazione complessa) ---
    const gridWrapper = gUpdate.selectAll(".grid-wrapper").data([null]).join("g").attr("class", "grid-wrapper");
    gridWrapper.selectAll(".levels").data(d3.range(1, levels + 1).reverse())
      .join("circle").attr("class", "levels")
      .attr("r", d => rScale(d / levels))
      .style("fill", "#CDCDCD").style("stroke", "#CDCDCD").style("fill-opacity", 0.1);
    
    gridWrapper.selectAll(".level-label").data(d3.range(1, levels + 1).reverse())
      .join("text").attr("class", "level-label")
      .attr("x", 4).attr("y", d => -rScale(d / levels))
      .attr("dy", "0.4em").style("font-size", "10px").attr("fill", "#737373")
      .text(d => `${(100 * d / levels).toFixed(0)}%`);

    // --- MODIFICA ANIMAZIONE 3: Applichiamo il General Update Pattern agli ASSI ---
    const axis = gridWrapper.selectAll(".axis")
      .data(features, d => d); // La chiave (d => d) è FONDAMENTALE per tracciare gli assi per nome

    // EXIT: Rimuovi gli assi che non ci sono più
    axis.exit()
      .transition().duration(transitionDuration)
      .style("opacity", 0)
      .remove();

    // ENTER: Crea i nuovi assi
    const axisEnter = axis.enter().append("g").attr("class", "axis");
    axisEnter.append("line").style("opacity", 0);
    axisEnter.append("text").style("opacity", 0);

    // UPDATE + ENTER: Anima tutti gli assi (vecchi e nuovi) verso la loro posizione finale
    const axisUpdate = axis.merge(axisEnter);

    axisUpdate.select("line")
      .transition().duration(transitionDuration)
      .style("opacity", 1)
      .attr("x1", 0).attr("y1", 0)
      .attr("x2", (_, i) => rScale(1.05) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y2", (_, i) => rScale(1.05) * Math.sin(angleSlice * i - Math.PI / 2))
      .style("stroke", "grey").style("stroke-width", "1px");

    axisUpdate.select("text")
      .transition().duration(transitionDuration)
      .style("opacity", 1)
      .attr("class", "legend")
      .style("font-size", "12px").attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("x", (_, i) => rScale(1.1) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y", (_, i) => rScale(1.1) * Math.sin(angleSlice * i - Math.PI / 2))
      .text(d => d)
      .call(wrap, 80);

    // --- MODIFICA ANIMAZIONE 4: Applichiamo il General Update Pattern ai DATI ---
    const radarLine = d3.lineRadial()
      .radius(d => rScale(d.value))
      .angle((_, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);
    
    const nodePaths = gUpdate.selectAll(".radar-path")
      .data(data, d => d.id); // Traccia i path per ID del nodo

    nodePaths.exit()
      .transition().duration(transitionDuration)
      .style("opacity", 0)
      .remove();
    
    const nodePathsEnter = nodePaths.enter().append("path").attr("class", "radar-path");

    nodePaths.merge(nodePathsEnter)
      .each(function(node) {
        const total = features.reduce((acc, feature) => acc + (node[feature] || 0), 0);
        const nodeData = features.map(feature => {
          const originalValue = node[feature] || 0;
          return {
            axis: feature, 
            value: total > 0 ? originalValue / total : 0,
            originalValue: originalValue
          };
        });
        
        // Applica la transizione all'attributo 'd' del path
        d3.select(this)
          .datum(nodeData)
          .transition().duration(transitionDuration)
          .style("stroke", colorScale(node.id))
          .style("stroke-width", 3)
          .style("fill", "none")
          .attr("d", radarLine);

        // --- MODIFICA ANIMAZIONE 5: Anche i punti per l'hover devono essere animati ---
        const hoverDots = gUpdate.selectAll(`.hover-dot-group-${node.id.replace(/\s+/g, '-')}`).data([node]);
        const hoverDotsEnter = hoverDots.enter().append("g").attr("class", `hover-dot-group-${node.id.replace(/\s+/g, '-')}`);
        
        hoverDots.merge(hoverDotsEnter).selectAll("circle")
          .data(nodeData)
          .join(
            enter => enter.append("circle")
                .attr("r", 6)
                .style("fill", "transparent")
                .style("stroke", "none")
                .style("cursor", "pointer")
                .on("mouseover", (event, d) => {
                    tooltip.transition().duration(200).style("opacity", 1);
                    const percentage = (d.value * 100).toFixed(1);
                    tooltip.html(`<strong>${d.axis}</strong><br>${d.originalValue.toFixed(2)} (${percentage}%)`)
                        .style("left", `${event.pageX + 15}px`).style("top", `${event.pageY - 15}px`);
                })
                .on("mousemove", (event) => tooltip.style("left", `${event.pageX + 15}px`).style("top", `${event.pageY - 15}px`))
                .on("mouseout", () => tooltip.transition().duration(500).style("opacity", 0)),
            update => update,
            exit => exit.remove()
          )
          .transition().duration(transitionDuration)
          .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
          .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2));
      });

    // La cleanup del tooltip è ora gestita dal .join() sopra, ma la lasciamo per sicurezza
    return () => {
        d3.select(containerRef.current).select(".radarchart-tooltip").remove();
    };

  }, [data, features, dimensions]); 

  // Funzione helper wrap (invariata)
  function wrap(text, width) {
    text.each(function() {
      var text = d3.select(this), words = text.text().split(/\s+/).reverse(), word, line = [], lineNumber = 0, lineHeight = 1.1, y = text.attr("y"), dy = parseFloat(text.attr("dy")), tspan = text.text(null).append("tspan").attr("x", text.attr("x")).attr("y", y).attr("dy", dy + "em");
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