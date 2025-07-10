import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from 'd3';
import { Box, Typography } from "@mui/material";

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

  // --- MODIFICA CHIAVE 1: Calcola il valore massimo per ogni feature ---
  // Questo serve per normalizzare i dati in modo che ogni asse sia proporzionato.
  const featureMaxDomains = useMemo(() => {
    if (!data || data.length === 0 || !features || features.length === 0) return {};
    const maxDomains = {};
    features.forEach(feature => {
      const maxVal = d3.max(data, d => d[feature] || 0);
      maxDomains[feature] = Math.max(0.001, maxVal); // Evita divisione per zero
    });
    return maxDomains;
  }, [data, features]);

  useEffect(() => {
    const { width, height } = dimensions;
    if (!svgRef.current || features.length < 2 || !data || data.length === 0 || width === 0 || height === 0) {
        d3.select(svgRef.current).selectAll("*").remove();
        return;
    }

    const size = Math.min(width, height);
    const margin = 40;
    const radius = (size / 2) - margin;
    const levels = 5;
    const maxValue = 1; // Il valore massimo è SEMPRE 1 dopo la normalizzazione

    const svg = d3.select(svgRef.current).attr("width", size).attr("height", size);
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", `translate(${size / 2},${size / 2})`);

    const rScale = d3.scaleLinear().domain([0, maxValue]).range([0, radius]);
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(data.map(d => d.id));
    const angleSlice = (Math.PI * 2) / features.length;

    // Disegno griglia (cerchi e assi)
    const gridWrapper = g.append("g").attr("class", "grid-wrapper");
    gridWrapper.selectAll(".levels").data(d3.range(1, levels + 1).reverse())
      .enter().append("circle").attr("class", "levels")
      .attr("r", d => (radius / levels) * d)
      .style("fill", "#CDCDCD").style("stroke", "#CDCDCD").style("fill-opacity", 0.05);

    const axis = gridWrapper.selectAll(".axis").data(features).enter().append("g").attr("class", "axis");
    axis.append("line")
      .attr("x1", 0).attr("y1", 0)
      .attr("x2", (_, i) => rScale(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y2", (_, i) => rScale(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("class", "line").style("stroke", "grey").style("stroke-width", "1px");

    axis.append("text")
      .attr("class", "legend")
      .style("font-size", "11px").attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("x", (_, i) => rScale(maxValue * 1.2) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y", (_, i) => rScale(maxValue * 1.2) * Math.sin(angleSlice * i - Math.PI / 2))
      .text(d => d);
    
    // --- MODIFICA CHIAVE 2: Normalizzazione e disegno ---
    const radarLine = d3.lineRadial()
      .radius(d => rScale(d.value))
      .angle((_, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);
    
    data.forEach(node => {
      // Per ogni nodo, calcoliamo i suoi valori normalizzati
      const normalizedValues = features.map(feature => ({
        axis: feature, 
        value: (node[feature] || 0) / featureMaxDomains[feature]
      }));

      const nodeColor = colorScale(node.id);
      g.append("path")
        .datum(normalizedValues)
        .attr("d", radarLine)
        .style("stroke", nodeColor).style("fill", nodeColor)
        .style("fill-opacity", 0.00).style("stroke-width", 4);
    });

  }, [data, features, dimensions, featureMaxDomains]);

  return (
    <Box ref={containerRef} sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        Nodi Visualizzati: {data?.length ?? 0}
      </Typography>
      <svg ref={svgRef}></svg>
    </Box>
  );
}