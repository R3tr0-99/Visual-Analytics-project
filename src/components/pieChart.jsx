import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Box, Typography } from '@mui/material';

const PieChart = ({ data = [], features = [], hoveredNode = null }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!hoveredNode || features.length === 0) return;

    const width = 250;
    const height = 250;
    const radius = Math.min(width, height) / 2;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Costruisci i dati da mostrare nel pie chart
    const pieData = features.map((key) => ({
      label: key,
      value: hoveredNode[key],
    }));

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const pie = d3.pie().value((d) => d.value);
    const data_ready = pie(pieData);

    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    svg
      .selectAll('path')
      .data(data_ready)
      .join('path')
      .attr('d', arc)
      .attr('fill', (d) => color(d.data.label))
      .attr('stroke', 'white')
      .style('stroke-width', '2px');

    // Opzionale: etichette
    svg
      .selectAll('text')
      .data(data_ready)
      .join('text')
      .text((d) => d.data.label)
      .attr('transform', (d) => `translate(${arc.centroid(d)})`)
      .style('font-size', '10px')
      .style('text-anchor', 'middle');
  }, [hoveredNode, features]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="subtitle1" gutterBottom>
        Pie Chart
      </Typography>
      <svg ref={svgRef}></svg>
    </Box>
  );
};

export default PieChart;
