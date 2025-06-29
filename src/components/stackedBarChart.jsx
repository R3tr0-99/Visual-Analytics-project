// StackedBarChart.js
import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

/**
 * StackedBarChart
 * @param {Array<Object>} data - array di oggetti, ciascuno con 'name' e altre chiavi numeriche
 * @param {Array<string>} [colors] - array opzionale di colori
 * @param {Object} [margin] - margini opzionali ({ top, right, bottom, left })
 * @param {Object|null} [selectedNode] - nodo selezionato (con almeno .name) per evidenziare colonna
 */
export default function StackedBarChart({ data, colors, margin = { top: 20, right: 30, bottom: 50, left: 50 }, selectedNode }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Prendi tutte le chiavi eccetto 'name' (cioè i partiti)
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

    const colorScale = d3
      .scaleOrdinal()
      .domain(keys)
      .range(colors || d3.schemeSet2);

    // Disegna le barre
    const bars = g.append("g")
      .selectAll("g")
      .data(series)
      .join("g")
      .attr("fill", d => colorScale(d.key))
      .selectAll("rect")
      .data(d => d)
      .join("rect")
      .attr("x", d => x(d.data.name))
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth());


    
    //log(selectedNode)
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
    const legendX = margin.left + (width - legendWidth) / 2;

    const legend = svg.append("g")
      .attr("transform", `translate(${legendX}, 10)`)
      .selectAll("g")
      .data(keys)
      .join("g")
      .attr("transform", (d, i) => `translate(${i * legendSpacing}, 0)`);

    legend.append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", d => colorScale(d));

    legend.append("text")
      .attr("x", 24)
      .attr("y", 9)
      .attr("dy", "0.35em")
      .text(d => d);

  }, [data, colors, margin, selectedNode]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} />
    </div>
  );
}
