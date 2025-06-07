import { Typography } from "@mui/material";
import { useEffect, useRef, Fragment } from "react";
import { select } from 'd3-selection';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { lineRadial, curveLinearClosed } from 'd3-shape';
import { schemeCategory10 } from 'd3-scale-chromatic';

export default function RadarChart(props) {
  const ref = useRef(null);
  const size = 400; //La dimensione del grafico
  const levels = 5;
  const maxValue = 1; // valori normalizzati da 0 a 1
  const radius = size / 2 - 40;

  useEffect(() => {
    if (!ref.current) return;

    const svg = select(ref.current);
    svg.selectAll('*').remove();

    svg.attr('width', size).attr('height', size);
    const g = svg.append('g').attr('transform', `translate(${size / 2}, ${size / 2})`);

    const angleSlice = (Math.PI * 2) / props.features.length;
    const rScale = scaleLinear().domain([0, maxValue]).range([0, radius]);

    const colorScale = scaleOrdinal(
      props.data.map(d => d.id),
      schemeCategory10
    );

    g.append('circle') //Il cerchio (background)
      .attr('r', radius)
      .style('fill', '#111');

    for (let level = 1; level <= levels; level++) { //I cerchi interni
      const r = (radius / levels) * level;
      g.append('circle')
        .attr('r', r)
        .style('fill', 'none')
        .style('stroke', 'white')
        .style('stroke-opacity', 0.5);
    }


    props.features.forEach((feature, i) => { //Le label fuori dal cerchio
      const angle = angleSlice * i - Math.PI / 2;
      const x = Math.cos(angle) * (radius + 10);
      const y = Math.sin(angle) * (radius + 10);
      g.append('text')
        .attr('x', x)
        .attr('y', y)
        .text(feature)
        .style('fill', 'black')
        .style('font-size', '11px')
        .attr('text-anchor', 'middle');
    });

    const radarLine = lineRadial()
      .radius(d => rScale(d.value))
      .angle((_, i) => i * angleSlice)
      .curve(curveLinearClosed);

    props.data.forEach((node) => {
      if (!node.dimensions) return;

      const values = props.features.map((feature) => ({
        axis: feature,
        value: node.dimensions[feature] ?? 0,
      }));

      g.append('path')
        .datum(values)
        .attr('d', radarLine)
        .style('stroke', colorScale(node.id))
        .style('fill', colorScale(node.id))
        .style('fill-opacity', 0.2)
        .style('stroke-width', 2);
    });
  }, [props.data, props.features]);

  return (
    <Fragment>
      <Typography>
        Nodi selezionati da radviz: <b>{props?.selectedNodesFromRadviz.length ?? 0}</b>
      </Typography>

      <div >
        <svg ref={ref}></svg>
      </div>
    </Fragment>
  );
}
