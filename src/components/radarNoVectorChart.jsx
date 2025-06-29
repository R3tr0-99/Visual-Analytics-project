import React, { Fragment, useEffect, useRef, useState, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { select } from "d3-selection";
import { scaleLinear } from "d3-scale";
import { minEffectivenessErrorHeuristic } from "../utils/arrangement";

export default function RadarNoVectorChart(props) {
  const { csvData, hoveredNode, features, type } = props;
  const ref = useRef(null);

  // Dimensioni SVG e radar
  const size = 300;
  const levels = 5;
  const radius = size / 2 - 40;

  const [lastHoveredNode, setLastHoveredNode] = useState(null);
  const [lastLabels, setLastLabels] = useState([]);

  // 1) Rileva dinamicamente l'ultima colonna da csvData (fallback per titolo o heuristic)
  const lastColumnName = useMemo(() => {
    if (Array.isArray(csvData) && csvData.length > 0) {
      const keys = Object.keys(csvData[0]);
      if (keys.length > 0) {
        return keys[keys.length - 1];
      }
    }
    return null;
  }, [csvData]);

  // 2) Aggiorna lastHoveredNode quando cambia hoveredNode
  useEffect(() => {
    if (hoveredNode) {
      setLastHoveredNode(hoveredNode);
    } else {
      setLastHoveredNode(null);
    }
  }, [hoveredNode]);

  // 3) Calcolo delle etichette/features (lastLabels)
  useEffect(() => {
    // Se non uso heuristic, uso features esplicite; se non fornite, prendo tutte le colonne tranne l'ultima
    if (type !== "eehm") {
      if (Array.isArray(features) && features.length > 0) {
        setLastLabels(features);
      } else if (Array.isArray(csvData) && csvData.length > 0 && lastColumnName) {
        const keys = Object.keys(csvData[0]);
        setLastLabels(keys.slice(0, Math.max(0, keys.length - 1)));
      } else {
        setLastLabels([]);
      }
      return;
    }
    // Caso type === 'eehm': uso heuristic per ordinare le feature
    if (!Array.isArray(csvData) || csvData.length === 0 || !lastColumnName) {
      setLastLabels([]);
      return;
    }
    const allKeys = Object.keys(csvData[0]);
    const featureNames = allKeys.slice(0, Math.max(0, allKeys.length - 1));
    if (featureNames.length === 0) {
      setLastLabels([]);
      return;
    }
    // Preparo struttura per heuristic
    const dataStruct = {
      entries: csvData,
      dimensions: featureNames.map((name) => ({
        values: csvData.map((r) => {
          const v = +r[name];
          return isNaN(v) ? 0 : v;
        }),
      })),
    };
    const perm = minEffectivenessErrorHeuristic(dataStruct, /*fast=*/ false);
    const ordered = perm.map((idx) => featureNames[idx]);
    setLastLabels(ordered);
  }, [type, features, csvData, lastColumnName]);

  // 4) Disegno del radar con D3
  useEffect(() => {
    if (!ref.current) return;
    const svg = select(ref.current);
    svg.selectAll("*").remove();
    svg.attr("width", size).attr("height", size);

    if (!Array.isArray(lastLabels) || lastLabels.length === 0) {
      // niente da disegnare
      return;
    }

    const g = svg
      .append("g")
      .attr("transform", `translate(${size / 2},${size / 2})`);
    const angleSlice = (Math.PI * 2) / lastLabels.length;

    // Sfondo: cerchio grande
    g.append("circle").attr("r", radius).style("fill", "#eee");

    // Livelli concentrici
    for (let lvl = 1; lvl <= levels; lvl++) {
      const r = (radius / levels) * lvl;
      g.append("circle")
        .attr("r", r)
        .style("fill", "none")
        .style("stroke", "#999")
        .style("stroke-opacity", 0.3);
    }

    // Se ho un nodo hovered, calcolo maxRaw per scale
    let maxRaw = 0;
    if (lastHoveredNode) {
      // per ogni feature, prendo raw da dimensions o original
      lastLabels.forEach((feature) => {
        let rawVal = 0;
        if (
          lastHoveredNode.dimensions &&
          lastHoveredNode.dimensions[feature] !== undefined
        ) {
          rawVal = +lastHoveredNode.dimensions[feature];
        } else if (
          lastHoveredNode.original &&
          lastHoveredNode.original[feature] !== undefined
        ) {
          rawVal = +lastHoveredNode.original[feature];
        }
        if (isNaN(rawVal)) rawVal = 0;
        if (rawVal > maxRaw) maxRaw = rawVal;
      });
    }
    // Se maxRaw è zero (es. nodo senza dati), per evitare domain [0,0], imposto 1
    const domainMax = maxRaw > 0 ? maxRaw : 1;
    const rScale = scaleLinear().domain([0, domainMax]).range([0, radius]);

    // Etichette per ogni asse
    lastLabels.forEach((feature, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = Math.cos(angle) * (radius + 20);
      const y = Math.sin(angle) * (radius + 20);

      // Determino il valore raw da mostrare
      let valueText = "";
      if (lastHoveredNode) {
        let rawVal;
        if (
          lastHoveredNode.dimensions &&
          lastHoveredNode.dimensions[feature] !== undefined
        ) {
          rawVal = lastHoveredNode.dimensions[feature];
        } else if (
          lastHoveredNode.original &&
          lastHoveredNode.original[feature] !== undefined
        ) {
          rawVal = lastHoveredNode.original[feature];
        }
        rawVal = rawVal != null && !isNaN(+rawVal) ? +rawVal : null;
        if (rawVal !== null) {
          // mostro in percentuale: assumo rawVal in [0,1]
          valueText = `${(rawVal * 100).toFixed(2)}%`;
        }
      }

      // Testo con tspan per andare a capo
      const textEl = g
        .append("text")
        .attr("x", x)
        .attr("y", y)
        .style("text-anchor", "middle")
        .style("dominant-baseline", "middle")
        .style("font-size", "11px");

      textEl
        .append("tspan")
        .text(feature)
        .attr("x", x)
        .attr("dy", "0em");
      if (valueText) {
        textEl
          .append("tspan")
          .text(valueText)
          .attr("x", x)
          .attr("dy", "1.2em");
      }
    });

    // Raggi e punti se ho un nodo hovered
    if (lastHoveredNode) {
      lastLabels.forEach((feature, i) => {
        let rawVal = 0;
        if (
          lastHoveredNode.dimensions &&
          lastHoveredNode.dimensions[feature] !== undefined
        ) {
          rawVal = +lastHoveredNode.dimensions[feature];
        } else if (
          lastHoveredNode.original &&
          lastHoveredNode.original[feature] !== undefined
        ) {
          rawVal = +lastHoveredNode.original[feature];
        }
        if (isNaN(rawVal)) rawVal = 0;

        const angle = angleSlice * i - Math.PI / 2;
        const r = rScale(rawVal);
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;

        // Linea dall'origine al punto
        g.append("line")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", x)
          .attr("y2", y)
          .style("stroke", "orange")
          .style("stroke-width", 4)
          .style("stroke-linecap", "round");

        // Punto
        g.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 3)
          .style("fill", "orange");
      });
    }
  }, [lastHoveredNode, lastLabels, size, radius, levels]);

  // Funzione per ottenere il nome da mostrare nel titolo
  const displayName = () => {
    if (!lastHoveredNode) return null;
    // 1) Se esiste hoveredNode.attributes (come in BarChart), prendo la prima chiave
    if (
      lastHoveredNode.attributes &&
      typeof lastHoveredNode.attributes === "object"
    ) {
      const keys = Object.keys(lastHoveredNode.attributes);
      if (keys.length > 0) {
        return lastHoveredNode.attributes[keys[0]];
      }
    }
    // 2) Se esiste hoveredNode.id
    if (
      lastHoveredNode.id !== undefined &&
      lastHoveredNode.id !== null
    ) {
      return lastHoveredNode.id;
    }
    // 3) Fallback: se ho lastColumnName e original
    if (
      lastColumnName &&
      lastHoveredNode.original &&
      lastHoveredNode.original[lastColumnName] !== undefined
    ) {
      return lastHoveredNode.original[lastColumnName];
    }
    return null;
  };

  return (
    <Box sx={{display:"flex", flexDirection:'column', justifyContent:"center", alignItems:"center"}}>
        <Typography variant="subtitle1" align="center">
          {lastHoveredNode
            ? `Valori di ${displayName()}`
            : "Nessun nodo selezionato"}
        </Typography>
        <svg ref={ref}></svg>
    </Box>
  );
}
