// StackedBarChart.js
import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

/**
 * StackedBarChart
 * @param {Array<Object>} data - array of data objects, each with 'group' and other numeric keys
 * @param {Array<string>} [colors] - optional array of colors
 * @param {Object} [margin] - optional margins ({ top, right, bottom, left })
 */
export default function StackedBarChart({ data, colors, margin = { top: 20, right: 30, bottom: 30, left: 40 } }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Derive stack keys from first row (exclude 'group')
    const keys = Object.keys(data[0]).filter(
      k => k !== 'group' && typeof data[0][k] === 'number'
    );
    if (keys.length === 0) return;

    // Measure container dimensions
    const { width: fullWidth, height: fullHeight } = containerRef.current.getBoundingClientRect();
    const width = fullWidth - margin.left - margin.right;
    const height = fullHeight - margin.top - margin.bottom;

    // Select and clear SVG
    const svg = d3.select(svgRef.current)
      .attr("width", fullWidth)
      .attr("height", fullHeight);
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Generate stacks
    const stackGen = d3.stack().keys(keys);
    const series = stackGen(data);

    // Scales
    const x = d3
      .scaleBand()
      .domain(data.map(d => d.group))
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
      .range(colors || d3.schemeCategory10);

    // Draw bars
    g.append("g")
      .selectAll("g")
      .data(series)
      .join("g")
      .attr("fill", d => colorScale(d.key))
      .selectAll("rect")
      .data(d => d)
      .join("rect")
      .attr("x", d => x(d.data.group))
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth());

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    g.append("g").call(d3.axisLeft(y));
  }, [data, colors, margin]);

  return (
    <div ref={containerRef} style={{ width: '100%', height:'50vh' }}>
      <svg ref={svgRef} />
    </div>
  );
}
