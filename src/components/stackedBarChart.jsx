// stackedBarChart.jsx

import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

/**
 * StackedBarChart
 * @param {Array<Object>} data - array di oggetti, ciascuno con 'name' e altre chiavi numeriche
 * @param {Function} [providedColorScale] - Scala di colori D3 fornita dal genitore (alias di 'colorScale')
 * @param {Object} [margin] - margini opzionali ({ top, right, bottom, left })
 * @param {Object|null} [selectedNode] - nodo selezionato (con almeno .name) per evidenziare colonna
 */
// MODIFICA 1: Cambiata la prop da `colors` a `colorScale` e usato un alias `providedColorScale` per coerenza con PieChart.
export default function StackedBarChart({ data, colorScale: providedColorScale, margin = { top: 20, right: 30, bottom: 50, left: 50 }, selectedNode }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return;

    // Prendi tutte le chiavi eccetto 'name' 
    const keys = Object.keys(data[0]).filter(
      k => k !== 'name' && typeof data[0][k] === 'number'
    );
    if (keys.length === 0) return;

    // Dimensioni effettive
    const { width: fullWidth, height: fullHeight } = containerRef.current.getBoundingClientRect();
    const width = fullWidth - margin.left - margin.right;
    const height = fullHeight - margin.top - margin.bottom;

    // Clear e setup SVG
    const svg = d3.select(svgRef.current)
      .attr("width", fullWidth)
      .attr("height", fullHeight);
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Stack dei dati
    const stackGen = d3.stack().keys(keys);
    const series = stackGen(data);

    // Scale
    const x = d3
      .scaleBand()
      .domain(data.map(d => d.name))
      .range([0, width])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(series, s => d3.max(s, d => d[1]))])
      .nice()
      .range([height, 0]);

    // MODIFICA 2: Usa la scala di colori fornita da App.jsx. Se non c'è, ne crea una di fallback.
    // La variabile `providedColorScale` ora è correttamente definita grazie alla modifica nella firma della funzione.
    const color = providedColorScale || d3.scaleOrdinal().domain(keys).range(d3.schemeTableau10);

    // Disegna le barre
    const bars = g.append("g")
      .selectAll("g")
      .data(series)
      .join("g")
        .attr("fill", d => color(d.key)) // Applica il colore corretto
      .selectAll("rect")
      .data(d => d)
      .join("rect")
        // MODIFICA 3: Corretto l'accesso alla chiave 'name' per posizionare le barre sull'asse X.
        .attr("x", d => x(d.data.name)) 
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth());

    // Evidenzia la barra selezionata
    if (selectedNode && selectedNode.attributes && selectedNode.attributes.name) {
      bars
        .style("opacity", d => d.data.name === selectedNode.attributes.name ? 1 : 0.3)
        .style("stroke", d => d.data.name === selectedNode.attributes.name ? "black" : "none")
        .style("stroke-width", d => d.data.name === selectedNode.attributes.name ? 2 : 0);
    } else {
      bars
        .style("opacity", 1)
        .style("stroke", "none")
        .style("stroke-width", 0);
    }

    // Assi
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    g.append("g")
      .call(d3.axisLeft(y));

    // Legenda
    const legendSpacing = 120;
    const legendWidth = keys.length * legendSpacing;
    const legendX = Math.max(margin.left, margin.left + (width - legendWidth) / 2); // Assicura che non vada fuori a sinistra

    const legend = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "start")
      .attr("transform", `translate(${legendX}, 10)`) // Posiziona la legenda in alto
      .selectAll("g")
      .data(keys)
      .join("g")
        .attr("transform", (d, i) => `translate(${i * legendSpacing}, 0)`);

    legend.append("rect")
      .attr("x", 0)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", color); // Applica il colore corretto alla legenda

    legend.append("text")
      .attr("x", 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text(d => d);

  // MODIFICA 4: Pulita la lista delle dipendenze dell'useEffect.
  }, [data, selectedNode, providedColorScale, margin]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} />
    </div>
  );
}