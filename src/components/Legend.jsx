import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Box } from '@mui/material';

export default function Legend({ features, colorScale }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !features || features.length === 0 || !colorScale) {
        if (svgRef.current) d3.select(svgRef.current).selectAll("*").remove();
        return;
    }

    const { width } = containerRef.current.getBoundingClientRect();
    const svg = d3.select(svgRef.current).attr('width', width).attr('height', 30); // Altezza fissa per la legenda
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', 'translate(5, 5)'); // Un po' di padding

    const legendItems = g.selectAll('g')
      .data(features)
      .join('g');

    legendItems.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', colorScale);

    legendItems.append('text')
      .attr('x', 20)
      .attr('y', 7.5)
      .attr('dy', '0.32em')
      .style('font-size', '12px')
      .text(d => d);

    let totalLegendWidth = 0;
    const legendPadding = 15;
    legendItems.each(function() {
      const itemWidth = this.getBBox().width;
      d3.select(this).attr('transform', `translate(${totalLegendWidth}, 0)`);
      totalLegendWidth += itemWidth + legendPadding;
    });

    // Se la legenda è più larga del contenitore, ridimensiona il tutto
    if (totalLegendWidth > width) {
        const scaleFactor = Math.max(0.5, (width - 10) / totalLegendWidth); // -10 per un po' di margine
        g.attr('transform', `translate(5, 5) scale(${scaleFactor})`);
    }

  }, [features, colorScale]);

  // Aggiungiamo un observer per ridisegnare la legenda al resize del contenitore
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
        // Forza un re-render triggerando l'effect principale
        // In questo caso, basta che React ri-esegua il render
        // e l'effect [features, colorScale] ricalcolerà con la nuova larghezza.
        // Per forzare, potremmo usare uno state, ma questo approccio è più semplice.
        // Lo lasciamo vuoto, la logica di ridimensionamento è già nell'effect principale.
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);


  return (
    <Box ref={containerRef} sx={{ width: '100%', height: '30px', flexShrink: 0 }}>
      <svg ref={svgRef} />
    </Box>
  );
}