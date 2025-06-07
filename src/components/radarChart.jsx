import React, { useEffect, useRef, useState, Fragment } from "react";
import { Typography } from "@mui/material";
import { select } from "d3-selection";
import { scaleLinear, scaleOrdinal } from "d3-scale";
import { lineRadial, curveLinearClosed } from "d3-shape";
import { schemeCategory10 } from "d3-scale-chromatic";
import { minEffectivenessErrorHeuristic } from "../utils/arrangement";

export default function RadarChart({ data, selectedNodesFromRadviz, features, type }) {
  const ref = useRef(null);
  const size = 400;
  const levels = 5;
  const maxValue = 1;
  const radius = size / 2 - 40;

  // labels: o props.features, o permutazione dall'heuristic
  const [labels, setLabels] = useState(features || []);

  // 1) Calcola labels in base a `type`
  useEffect(() => {
    // se non chiedi l'heuristic, uso semplicemente features
    if (type !== "eehm") {
      setLabels(features || []);
      return;
    }

    // altrimenti, applico heuristic
    if (!Array.isArray(data) || data.length === 0) {
      setLabels([]);
      return;
    }

    // decido la lista di feature: props.features se fornita, altrimenti prendo le keys di data[0].dimensions
    const featureNames = Array.isArray(features) && features.length
      ? features
      : Object.keys(data[0].dimensions);

    // costruisco la struttura che l'heuristic si aspetta
    const dataStruct = {
      entries: data,
      dimensions: featureNames.map(name => ({
        values: data.map(node => + (node.dimensions[name] ?? 0))
      }))
    };

    // calcolo permutazione e la applico ai nomi
    const perm = minEffectivenessErrorHeuristic(dataStruct, false);
    const ordered = perm.map(idx => featureNames[idx]);
    setLabels(ordered);
  }, [type, features, data]);

  // 2) Disegno il radar
  useEffect(() => {
    if (!ref.current || labels.length === 0) return;

    const svg = select(ref.current);
    svg.selectAll("*").remove();
    svg.attr("width", size).attr("height", size);

    const g = svg.append("g")
      .attr("transform", `translate(${size / 2},${size / 2})`);

    const angleSlice = (Math.PI * 2) / labels.length;
    const rScale = scaleLinear()
      .domain([0, maxValue])
      .range([0, radius]);

    const colorScale = scaleOrdinal(
      data.map(d => d.id),
      schemeCategory10
    );

    // 2.1 sfondo
    g.append("circle")
      .attr("r", radius)
      .style("fill", "#111");

    // 2.2 cerchi concentrici
    for (let lvl = 1; lvl <= levels; lvl++) {
      const r = (radius / levels) * lvl;
      g.append("circle")
        .attr("r", r)
        .style("fill", "none")
        .style("stroke", "white")
        .style("stroke-opacity", 0.5);
    }

    // 2.3 etichette assi
    labels.forEach((feature, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = Math.cos(angle) * (radius + 10);
      const y = Math.sin(angle) * (radius + 10);
      g.append("text")
        .attr("x", x)
        .attr("y", y)
        .text(feature)
        .style("fill", "black")
        .style("font-size", "11px")
        .attr("text-anchor", "middle");
    });

    // 2.4 definisco la lineRadial con CHIUSURA automatica
    const radarLine = lineRadial()
      .radius(d => rScale(d.value))
      .angle((_, i) => i * angleSlice)
      .curve(curveLinearClosed);

    // 2.5 path per ogni nodo
    data.forEach(node => {
      if (!node.dimensions) return;

      // mappo i valori secondo `labels` (ordine calcolato o passato)
      const values = labels.map(feature => ({
        axis: feature,
        value: node.dimensions[feature] ?? 0
      }));

      g.append("path")
        .datum(values)
        .attr("d", radarLine)
        .style("stroke", colorScale(node.id))
        .style("fill", colorScale(node.id))
        .style("fill-opacity", 0.2)
        .style("stroke-width", 2);
    });

  }, [data, labels]);

  return (
    <Fragment>
      <Typography>
        Nodi selezionati da radviz: <b>{selectedNodesFromRadviz?.length ?? 0}</b>
      </Typography>
      <div>
        <svg ref={ref}></svg>
      </div>
    </Fragment>
  );
}
