import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import {ipv4ToNumber, numberToIpv4} from './helpers.js';
import './Gantt.css'


const GanttChart = ({ w="800", h="400",tasks = [
  { task: "Planning", start: "100", end: "200" },
  { task: "Development", start: 0, end: ipv4ToNumber('192.168.255.255') },
  { task: "Testing", start: ipv4ToNumber('10.10.0.0'), end: ipv4ToNumber('169.168.0.0') },
  { task: "Testing2", start: ipv4ToNumber('255.0.0.0'), end: ipv4ToNumber('255.255.255.255') },
  { task: "Deployment", start: "0", end: "500" }
] }) => {
  const svgRef = useRef();
  const transformRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const width = w;
    const height = h;
    const margin = { top: 20, right: 30, bottom: 50, left: 100 };

    // Clear previous content (optimize rendering updates)
    svg.selectAll('*').remove();

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
      
    // Draw bars
    let view = {}
    if (tasks && tasks.length > 0) {
      view = svg.selectAll('rect')
        .data(tasks)
        .enter()
        .append('rect')
        .attr('class','bars')
        .attr('x', d => xScale(d.start))
        .attr('y', d => yScale(d.task))
        .attr('width', d => xScale(d.end) - xScale(d.start))
        .attr('height', yScale.bandwidth())
        .attr('fill', 'steelblue');
        
    }

    // Draw axes
    let xAxis = d3.axisBottom(xScale).ticks(10).tickFormat(numberToIpv4)
    let gX = svg.append('g')
      .attr('class','axises')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(xAxis);
    

    let yAxis = d3.axisLeft(yScale)
    let gY = svg.append('g')
      .attr('class','axises')
      .attr('transform', `translate(${margin.left},0)`)
      .call(yAxis);


    if(transformRef.current){
      view.attr('transform', `translate(${transformRef.current.x}, 0) scale(${transformRef.current.k}, 1)`);
      gX.call(xAxis.scale(transformRef.current.rescaleX(xScale)));
    }
  
    // Set up zoom with updated boundaries
    const zoom = d3.zoom()
      .scaleExtent([1, 10000])
      .translateExtent([[margin.left, 0], [width - margin.right, height - margin.bottom]]) // Dynamically updated boundaries
      .extent([[margin.left, 0], [width - margin.right, height - margin.bottom]]) // Dynamically updated zoomable area
      .on("zoom", zoomed);

    svg.call(zoom);

    function zoomed({ transform }) {
      transformRef.current=transform
      view.attr("transform", `translate(${transform.x}, 0) scale(${transform.k}, 1)`);
      gX.call(xAxis.scale(transform.rescaleX(xScale)));
      gY.attr("transform", `translate(${margin.left}, 0)`);
    }

    // Function to rotate text (to be used after every axis update)
    function rotateXAxisLabels() {
      gX.selectAll("text")  // Select tick labels
          .style("text-anchor", "end")  // Keep text aligned properly
          .attr("transform", "rotate(-60)");
    }

  }, [tasks,w,h]);

  return (
    
    <svg ref={svgRef} width={w} height={h}></svg>
  );
};

export default GanttChart;