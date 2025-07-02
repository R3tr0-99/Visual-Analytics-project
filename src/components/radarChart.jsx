import React, { useEffect, useRef, useState, Fragment } from "react";
import { Typography } from "@mui/material";
import { select } from "d3-selection";
import { scaleLinear, scaleOrdinal } from "d3-scale";
import { lineRadial, curveLinearClosed } from "d3-shape";
import { schemeTableau10 } from "d3-scale-chromatic";
import { minEffectivenessErrorHeuristic } from "../utils/arrangement";

export default function RadarChart({ data, features, type }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [labels, setLabels] = useState(features || []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);


  useEffect(() => {
    if (type !== "eehm") { setLabels(features || []); return; }
    if (!Array.isArray(data) || data.length === 0) { setLabels([]); return; }
    const featureNames = Array.isArray(features) && features.length ? features : Object.keys(data[0]).filter(k => typeof data[0][k] === 'number');
    if (featureNames.length === 0) return;
    const dataStruct = { entries: data, dimensions: featureNames.map(name => ({ values: data.map(node => + (node[name] ?? 0)) })) };
    const perm = minEffectivenessErrorHeuristic(dataStruct, false);
    const ordered = perm.map(idx => featureNames[idx]);
    setLabels(ordered);
  }, [type, features, data]);

  useEffect(() => {
    const { width, height } = dimensions;
    if (!svgRef.current || labels.length === 0 || !data || data.length === 0 || width === 0 || height === 0) {
        select(svgRef.current).selectAll("*").remove();
        return;
    }

    const size = Math.min(width, height);
    const margin = 40;
    const radius = (size / 2) - margin;
    const levels = 5;
    const maxValue = 1;

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", size).attr("height", size);

    const g = svg.append("g")
      .attr("transform", `translate(${size / 2},${size / 2})`);

    const angleSlice = (Math.PI * 2) / labels.length;
    const rScale = scaleLinear().domain([0, maxValue]).range([0, radius]);
    const colorScale = scaleOrdinal(schemeTableau10).domain(data.map(d => d.id));

    g.append("circle").attr("r", radius).style("fill", "#eee");

    for (let lvl = 1; lvl <= levels; lvl++) {
      const r = (radius / levels) * lvl;
      g.append("circle").attr("r", r).style("fill", "none").style("stroke", "#999").style("stroke-opacity", 0.3);
    }

    labels.forEach((feature, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = Math.cos(angle) * (radius + 15);
      const y = Math.sin(angle) * (radius + 15);
      g.append("text").attr("x", x).attr("y", y).text(feature).style("fill", "black").style("font-size", "11px").attr("text-anchor", "middle");
    });
    
    const radarLine = lineRadial().radius(d => rScale(d.value)).angle((_, i) => i * angleSlice).curve(curveLinearClosed);
    
    data.forEach(node => {
      const values = labels.map(feature => ({ axis: feature, value: node[feature] ?? 0 }));
      const nodeColor = colorScale(node.id);
      g.append("path")
        .datum(values)
        .attr("d", radarLine)
        .style("stroke", nodeColor)
        .style("fill", nodeColor)
        .style("fill-opacity", 0.15)
        .style("stroke-width", 2);
    });

  }, [data, labels, type, dimensions]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="subtitle2">
        Nodi Visualizzati: <b>{data?.length ?? 0}</b>
      </Typography>
      <svg ref={svgRef}></svg>
    </div>
  );
}