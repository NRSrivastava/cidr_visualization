import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import './App.css';
import './react-resizable.css'
import Gantt from './Gantt.js';
import { ResizableBox } from 'react-resizable';

function App() {
  const [cidrList, setCidrList] = useState([]);
  const [cidrInput, setCidrInput] = useState('');
  const [height, setHeight] = useState(400);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    drawVisualization();
  }, [cidrList]);

  const handleAddCidr = () => {
    if (validateCidr(cidrInput)) {
      setCidrList([...cidrList, cidrInput]);
      setCidrInput('');
    } else {
      alert('Invalid CIDR format');
    }
  };

  const validateCidr = (cidr) => {
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    return cidrRegex.test(cidr);
  };

  const drawVisualization = () => {
    const width = 800;
    const height = 100;

    d3.select('#visualization').selectAll('*').remove();

    const svg = d3.select('#visualization')
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Full IPv4 range represented as a scale (0 to 2^32 - 1)
    const xScale = d3.scaleLinear()
      .domain([0, Math.pow(2, 32) - 1])
      .range([0, width]);

    // Draw the base line representing the entire IPv4 range
    svg.append('rect')
      .attr('x', 0)
      .attr('y', height / 3)
      .attr('width', width)
      .attr('height', height / 3)
      .attr('fill', '#f0f0f0');

    // Draw each CIDR block as a colored rectangle
    cidrList.forEach((cidr, index) => {
      const [start, end] = calculateRange(cidr);
      const xStart = xScale(start);
      const xEnd = xScale(end);

      svg.append('rect')
        .attr('x', xStart)
        .attr('y', 0)
        .attr('width', xEnd - xStart)
        .attr('height', height / 3)
        .attr('fill', d3.schemeCategory10[index % 10])
        .attr('opacity', 0.6);
        
    });
  };

  const calculateRange = (cidr) => {
    // Simple logic to calculate the range from a CIDR block
    const [ip, prefix] = cidr.split('/');
    const ipParts = ip.split('.').map(Number);
    const ipNum =
      (ipParts[0] << 24) +
      (ipParts[1] << 16) +
      (ipParts[2] << 8) +
      ipParts[3];
    const mask = ~(Math.pow(2, 32 - prefix) - 1);
    const start = ipNum & mask;
    const end = start + Math.pow(2, 32 - prefix) - 1;
    return [start, end];
  };

  const onResize = (event, {node, size, handle}) => {;
    setHeight(size.height);
    setWidth(size.width);
  };

  return (
    <div className="App">
      <h1>IPv4 CIDR Visualization</h1>
      <ResizableBox className="box" width={800} height={400} onResize={onResize} >

      <Gantt w={width} h={height}/>

      </ResizableBox>
      <div className="cidr-input">
        <input
          type="text"
          value={cidrInput}
          onChange={(e) => setCidrInput(e.target.value)}
          placeholder="Enter CIDR (e.g., 192.168.0.0/24)"
        />
        <button onClick={handleAddCidr}>Add CIDR</button>
      </div>
      <div className="cidr-list">
        {cidrList.map((cidr, index) => (
          <div key={index} className="cidr-item">
            {cidr}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

