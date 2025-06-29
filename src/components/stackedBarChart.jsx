import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

/**
 * 100% StackedBarChart. Assumes input data is already normalized where each row sums to 1.
 * @param {Array<Object>} data - array di oggetti, ciascuno con 'name' e altre chiavi numeriche
 * @param {Function} [colorScale] - Scala di colori D3 fornita dal genitore
 * @param {Object} [margin] - margini opzionali ({ top, right, bottom, left })
 * @param {Object|null} [selectedNode] - nodo selezionato per evidenziare colonna
 */
export default function StackedBarChart({ data, colorScale, margin = { top: 40, right: 30, bottom: 50, left: 50 }, selectedNode }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return;

    const keys = Object.keys(data[0]).filter(
      k => k !== 'name' && typeof data[0][k] === 'number'
    );
    if (keys.length === 0) return;

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

    // D3 stack lavora direttamente sui dati, che si assume siano già normalizzati
    const stackGen = d3.stack().keys(keys);
    const series = stackGen(data);
    
    const x = d3.scaleBand().domain(data.map(d => d.name)).range([0, width]).padding(0.1);

    // --- FIX 1: IL DOMINIO DELLA SCALA Y DEVE ESSERE FISSO ---
    // Poiché è un grafico al 100% e i dati sono già normalizzati,
    // il dominio deve essere SEMPRE [0, 1]. Questo assicura che una barra
    // che somma a 1 riempia l'intera altezza del grafico.
    const y = d3.scaleLinear()
      .domain([0, 1]) 
      .range([height, 0]);

    const color = colorScale || d3.scaleOrdinal().domain(keys).range(d3.schemeTableau10);
    
    const bars = g.append("g").selectAll("g").data(series).join("g").attr("fill", d => color(d.key))
      .selectAll("rect").data(d => d).join("rect")
        .attr("x", d => x(d.data.name)) 
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth());

    if (selectedNode?.attributes?.name) {
      const selectedName = selectedNode.attributes.name;
      bars.style("opacity", d => d.data.name === selectedName ? 1 : 0.3)
          .style("stroke", d => d.data.name === selectedName ? "black" : "none")
          .style("stroke-width", d => d.data.name === selectedName ? 2 : 0);
    }
    
    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x)).selectAll("text").attr("transform", "rotate(-45)").style("text-anchor", "end");

    
    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")));
    
    // --- Fine disegno grafico ---


    // --- INIZIO LOGICA PER LEGGENDA CON FONT DINAMICO ---

    // 1. Crea il gruppo principale per la legenda
    const legendGroup = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10) // Dimensione di partenza del font
      .attr("text-anchor", "start")
      .attr("transform", `translate(${margin.left}, 10)`); // Posiziona in alto

    // 2. Crea tutti gli elementi della legenda
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

    // 3. Misura la larghezza totale e posiziona inizialmente
    let totalLegendWidth = 0;
    const legendPadding = 15; // Spazio tra gli elementi

    legendItems.each(function() {
      const itemWidth = this.getBBox().width;
      // Posiziona l'elemento corrente
      d3.select(this).attr("transform", `translate(${totalLegendWidth}, 0)`);
      // Aggiorna la larghezza totale per il prossimo
      totalLegendWidth += itemWidth + legendPadding;
    });

    totalLegendWidth -= legendPadding;

    // 4. Se la legenda è troppo larga, calcola il fattore di scala e riposiziona
    if (totalLegendWidth > width) {
      const scaleFactor = width / totalLegendWidth;
      
      // Applica la nuova dimensione del font al gruppo principale
      legendGroup.attr("font-size", 10 * scaleFactor);

      // Ora che il font è più piccolo, ri-calcolare le posizioni
      let newCurrentX = 0;
      legendItems.each(function() {
        const itemWidth = this.getBBox().width; // Ottieni la nuova larghezza (più piccola)
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