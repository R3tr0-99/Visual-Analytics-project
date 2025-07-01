import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

/**
 * 100% StackedBarChart. Normalizza i dati in ingresso per mostrare le proporzioni percentuali.
 * @param {Array<Object>} data - array di oggetti, ciascuno con 'name' e altre chiavi numeriche (dati raw).
 * @param {Function} [colorScale] - Scala di colori D3 fornita dal genitore.
 * @param {Object} [margin] - margini opzionali.
 * @param {Object|null} [selectedNode] - nodo selezionato per evidenziare la colonna.
 */
export default function StackedBarChart({ data, colorScale, margin = { top: 40, right: 30, bottom: 50, left: 50 }, selectedNode }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return;

    // Estrae le chiavi numeriche che verranno usate per gli "stack"
    const keys = Object.keys(data[0]).filter(
      k => k !== 'name' && k !== 'id' && typeof data[0][k] === 'number'
    );
    if (keys.length === 0) return;

    // --- INIZIO FIX: NORMALIZZAZIONE DEI DATI ---
    // Poiché questo è un grafico 100% stacked, dobbiamo calcolare le percentuali per ogni riga.
    const normalizedData = data.map(d => {
      // 1. Calcola la somma totale dei valori per la riga corrente.
      const total = keys.reduce((acc, key) => acc + (d[key] || 0), 0);
      
      // 2. Crea un nuovo oggetto per la riga con i valori normalizzati.
      const normalizedRow = { name: d.name, id: d.id };
      
      // 3. Calcola il valore percentuale per ogni chiave.
      keys.forEach(key => {
        normalizedRow[key] = total > 0 ? (d[key] || 0) / total : 0;
      });
      
      return normalizedRow;
    });
    // --- FINE FIX ---

    // Dimensioni
    const { width: fullWidth, height: fullHeight } = containerRef.current.getBoundingClientRect();
    const width = fullWidth - margin.left - margin.right;
    const height = fullHeight - margin.top - margin.bottom;

    // Setup SVG
    const svg = d3.select(svgRef.current)
      .attr("width", fullWidth)
      .attr("height", fullHeight);
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // D3 stack ora lavora sui dati normalizzati
    const stackGen = d3.stack().keys(keys);
    const series = stackGen(normalizedData); // <-- USA I DATI NORMALIZZATI
    
    // La scala X usa i nomi originali
    const x = d3.scaleBand().domain(data.map(d => d.name)).range([0, width]).padding(0.1);

    // La scala Y ora funziona correttamente perché il dominio [0, 1] corrisponde
    // ai dati normalizzati (dove il totale massimo per ogni barra è 1).
    const y = d3.scaleLinear()
      .domain([0, 1]) 
      .range([height, 0]);

    const color = colorScale || d3.scaleOrdinal().domain(keys).range(d3.schemeTableau10);
    
    const bars = g.append("g").selectAll("g").data(series).join("g").attr("fill", d => color(d.key))
      .selectAll("rect").data(d => d).join("rect")
        .attr("x", d => x(d.data.name)) 
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1])) // Ora questa altezza è proporzionale al valore %
        .attr("width", x.bandwidth());

    // La logica di evidenziazione rimane invariata e funziona correttamente
    if (selectedNode?.attributes?.name) {
      const selectedName = selectedNode.attributes.name;
      bars.style("opacity", d => d.data.name === selectedName ? 1 : 0.3)
          .style("stroke", d => d.data.name === selectedName ? "black" : "none")
          .style("stroke-width", d => d.data.name === selectedName ? 2 : 0);
    }
    
    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x)).selectAll("text").attr("transform", "rotate(-45)").style("text-anchor", "end");

    // L'asse Y ora mostra correttamente le percentuali
    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")));
    
    // La logica per la legenda non cambia
    const legendGroup = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "start")
      .attr("transform", `translate(${margin.left}, 10)`);

    const legendItems = legendGroup.selectAll("g")
      .data(keys)
      .join("g");

    legendItems.append("rect")
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", color);

    legendItems.append("text")
      .attr("x", 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text(d => d);

    let totalLegendWidth = 0;
    const legendPadding = 15;

    legendItems.each(function() {
      const itemWidth = this.getBBox().width;
      d3.select(this).attr("transform", `translate(${totalLegendWidth}, 0)`);
      totalLegendWidth += itemWidth + legendPadding;
    });

    totalLegendWidth -= legendPadding;

    if (totalLegendWidth > width) {
      const scaleFactor = width / totalLegendWidth;
      legendGroup.attr("font-size", 10 * scaleFactor);
      let newCurrentX = 0;
      legendItems.each(function() {
        const itemWidth = this.getBBox().width;
        d3.select(this).attr("transform", `translate(${newCurrentX}, 0)`);
        newCurrentX += itemWidth + legendPadding;
      });
    }

  }, [data, selectedNode, colorScale, margin]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} />
    </div>
  );
}