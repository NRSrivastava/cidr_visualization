import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import {ipv4ToNumber, numberToIpv4} from './helpers.js';


const GanttChart = ({ tasks = [
  { task: "Planning", start: "100", end: "200" },
  { task: "Development", start: "100", end: "9000" },
  { task: "Testing", start: "600", end: "900" },
  { task: "Testing2", start: "600", end: "900" },
  { task: "Deployment", start: "0", end: "500" }
] }) => {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 30, left: 100 };

    // Clear previous content selectively (optimize rendering updates)
    svg.selectAll('rect').remove();
    svg.selectAll('g').remove();

    // Set up scales
    const defaultStart = ipv4ToNumber('0.0.0.0');
    const defaultEnd = ipv4ToNumber('255.255.255.255');

    const xScale = d3.scaleLinear()
      .domain([
        defaultStart,
        defaultEnd
      ])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleBand()
      .domain(tasks.map(d => d.task))
      .range([margin.top, height - margin.bottom])
      .padding(0.1);

    // Draw axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).tickFormat(numberToIpv4));

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));

    // Draw bars
    if (tasks && tasks.length > 0) {
      svg.selectAll('rect')
        .data(tasks)
        .enter()
        .append('rect')
        .attr('x', d => d.start)
        .attr('y', d => yScale(d.task))
        .attr('width', d => xScale(d.end) - xScale(d.start))
        .attr('height', yScale.bandwidth())
        .attr('fill', 'steelblue');
    }

  }, [tasks]);

  return (
    <svg ref={svgRef} width="800" height="400"></svg>
  );
};

export default GanttChart;