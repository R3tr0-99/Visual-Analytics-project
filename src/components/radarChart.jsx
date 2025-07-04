import { Typography } from "@mui/material";
import React, { useEffect, useRef, useState, Fragment, useMemo } from "react";
import * as d3 from 'd3';

// Funzione di utilità per l'ordinamento delle feature (se presente)
// Se non hai questo file, puoi rimuovere le parti relative a 'eehm'
// import { minEffectivenessErrorHeuristic } from "../utils/arrangement";

export default function RadarChart({ data, features, type }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Rimosso lo stato per 'labels', lo calcoliamo direttamente nell'effetto di disegno
  // per assicurarci che sia sempre sincronizzato.

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

  // Calcolo dei domini massimi per ogni feature
  const featureMaxDomains = useMemo(() => {
    if (!data || data.length === 0 || !features || features.length === 0) {
      return {};
    }
    const maxDomains = {};
    features.forEach(feature => {
      // Calcola il massimo per la feature corrente, assicurandosi sia almeno 1 per evitare divisioni per zero.
      const maxVal = d3.max(data, d => d[feature] || 0);
      maxDomains[feature] = Math.max(1, maxVal); // Usiamo almeno 1 per evitare divisioni per zero se tutti i valori sono 0
    });
    return maxDomains;
  }, [data, features]);


  useEffect(() => {
    const { width, height } = dimensions;
    const labels = features || []; // Usiamo direttamente le features passate

    if (!svgRef.current || labels.length < 2 || !data || data.length === 0 || width === 0 || height === 0) {
        d3.select(svgRef.current).selectAll("*").remove();
        return;
    }

    // Setup del grafico
    const size = Math.min(width, height);
    const margin = 40;
    const radius = (size / 2) - margin;
    const levels = 5;
    
    // Il valore massimo è SEMPRE 1 perché normalizziamo i dati
    const maxValue = 1;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", size).attr("height", size);

    const g = svg.append("g")
      .attr("transform", `translate(${size / 2},${size / 2})`);

    // Scala radiale fissa da 0 a 1
    const rScale = d3.scaleLinear().domain([0, maxValue]).range([0, radius]);
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(data.map(d => d.id));
    const angleSlice = (Math.PI * 2) / labels.length;

    // Disegno della griglia (cerchi concentrici e assi)
    for (let lvl = 1; lvl <= levels; lvl++) {
      g.append("circle").attr("r", (radius / levels) * lvl)
        .style("fill", "none").style("stroke", "#CDCDCD").style("stroke-opacity", 0.7);
    }
    
    // Etichette degli assi
    labels.forEach((feature, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = Math.cos(angle) * (radius + 15);
      const y = Math.sin(angle) * (radius + 15);
      g.append("text")
        .attr("x", x).attr("y", y)
        .text(feature).style("font-size", "11px").attr("text-anchor", "middle");
    });
    
    // Generatore della linea radiale
    const radarLine = d3.lineRadial()
      .radius(d => rScale(d.value)) // Il raggio è basato sul valore normalizzato
      .angle((_, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);
    
    // Disegno dei poligoni per ogni nodo di dati
    data.forEach(node => {
      // --- NORMALIZZAZIONE DINAMICA ---
      // Per ogni nodo, calcoliamo i suoi valori normalizzati prima di disegnarli.
      const normalizedValues = labels.map(feature => {
        const originalValue = node[feature] || 0;
        const maxValueForFeature = featureMaxDomains[feature] || 1;
        return { 
          axis: feature, 
          value: originalValue / maxValueForFeature // Ecco la normalizzazione!
        };
      });

      const nodeColor = colorScale(node.id);
      g.append("path")
        .datum(normalizedValues) // Passiamo i dati normalizzati
        .attr("d", radarLine)
        .style("stroke", nodeColor)
        .style("fill", nodeColor)
        .style("fill-opacity", 0.15)
        .style("stroke-width", 2);
    });

  }, [data, features, dimensions, featureMaxDomains]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="subtitle2">
        Nodi Visualizzati: <b>{data?.length ?? 0}</b>
      </Typography>
      <svg ref={svgRef}></svg>
    </div>
  );
}