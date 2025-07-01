import React, { useEffect, useRef, useState, Fragment } from "react";
import { Typography } from "@mui/material";
import { select } from "d3-selection";
import { scaleLinear, scaleOrdinal } from "d3-scale";
import { lineRadial, curveLinearClosed } from "d3-shape";
// Using a specific color scheme for better distinction
import { schemeTableau10 } from "d3-scale-chromatic";
import { minEffectivenessErrorHeuristic } from "../utils/arrangement";

export default function RadarChart({ data, features, type }) {
  const ref = useRef(null);
  const size = 300;
  const levels = 5;
  const maxValue = 1;
  const radius = size / 2 - 40;

  const [labels, setLabels] = useState(features || []);

  useEffect(() => {
    if (type !== "eehm") {
      setLabels(features || []);
      return;
    }
    if (!Array.isArray(data) || data.length === 0) {
      setLabels([]);
      return;
    }
    const featureNames = Array.isArray(features) && features.length
      ? features
      : Object.keys(data[0]).filter(k => typeof data[0][k] === 'number');

    if (featureNames.length === 0) return;

    const dataStruct = {
      entries: data,
      dimensions: featureNames.map(name => ({
        values: data.map(node => + (node[name] ?? 0))
      }))
    };

    const perm = minEffectivenessErrorHeuristic(dataStruct, false);
    const ordered = perm.map(idx => featureNames[idx]);
    setLabels(ordered);
  }, [type, features, data]);

  useEffect(() => {
    if (!ref.current || labels.length === 0 || !data || data.length === 0) {
        select(ref.current).selectAll("*").remove();
        return;
    }

    const svg = select(ref.current);
    svg.selectAll("*").remove();
    svg.attr("width", size).attr("height", size);

    const g = svg.append("g")
      .attr("transform", `translate(${size / 2},${size / 2})`);

    const angleSlice = (Math.PI * 2) / labels.length;
    const rScale = scaleLinear().domain([0, maxValue]).range([0, radius]);
    
    // --- KEY CHANGE: Use a color scale based on node IDs ---
    // This assigns a unique color from the scheme to each unique node ID.
    const colorScale = scaleOrdinal(schemeTableau10)
      .domain(data.map(d => d.id));
    // --- END OF KEY CHANGE ---

    g.append("circle").attr("r", radius).style("fill", "#eee");

    for (let lvl = 1; lvl <= levels; lvl++) {
      const r = (radius / levels) * lvl;
      g.append("circle").attr("r", r).style("fill", "none").style("stroke", "#999").style("stroke-opacity", 0.3);
    }

    labels.forEach((feature, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = Math.cos(angle) * (radius + 15);
      const y = Math.sin(angle) * (radius + 15);
      g.append("text").attr("x", x).attr("y", y).text(feature).style("fill", "black").style("font-size", "10px").attr("text-anchor", "middle");
    });
    
    const radarLine = lineRadial().radius(d => rScale(d.value)).angle((_, i) => i * angleSlice).curve(curveLinearClosed);
    
    data.forEach(node => {
      const values = labels.map(feature => ({
        axis: feature,
        value: node[feature] ?? 0
      }));

      // Use the color from the scale for both stroke and fill
      const nodeColor = colorScale(node.id);

      g.append("path")
        .datum(values)
        .attr("d", radarLine)
        .style("stroke", nodeColor) // <-- Use the assigned color
        .style("fill", nodeColor)   // <-- Use the assigned color
        .style("fill-opacity", 0.15)
        .style("stroke-width", 2);
    });

  }, [data, labels, type]); // Dependency array is correct

  return (
    <Fragment>
      <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
        <Typography variant="subtitle2">
          Nodi Visualizzati: <b>{data?.length ?? 0}</b>
        </Typography>
        <svg ref={ref}></svg>
      </div>
    </Fragment>
  );
}