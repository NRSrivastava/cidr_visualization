import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { numberToIpv4 } from './helpers.js';
import { IPV4_MAX, MIN_BAR_PX, SVG_OVERFLOW_PAD, GANTT_THEME } from './constants.js';
import './Gantt.css';

const GanttChart = ({ w = 800, h = 400, tasks = [], fitTrigger = 0, theme = 'dark', selectedCidr = null, onSelectCidr }) => {
  const svgRef = useRef();
  const transformRef = useRef(null);
  const prevTaskKeysRef = useRef('');
  const prevFitTriggerRef = useRef(0);
  // Stable refs so click handlers never capture stale closure values
  const selectedCidrRef = useRef(selectedCidr);
  const onSelectCidrRef = useRef(onSelectCidr);
  useEffect(() => { selectedCidrRef.current = selectedCidr; }, [selectedCidr]);
  useEffect(() => { onSelectCidrRef.current = onSelectCidr; }, [onSelectCidr]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const width = +w;
    const height = +h;
    const margin = { top: 20, right: 30, bottom: 65, left: 150 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const colors = GANTT_THEME[theme] || GANTT_THEME.dark;

    svg.selectAll('*').remove();

    const xScale = d3.scaleLinear()
      .domain([0, IPV4_MAX])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleBand()
      .domain(tasks.map(d => d.task))
      .range([margin.top, height - margin.bottom])
      .padding(0.2);

    svg.append('defs')
      .append('clipPath')
      .attr('id', 'chart-clip')
      .append('rect')
      .attr('x', margin.left).attr('y', margin.top)
      .attr('width', chartWidth).attr('height', chartHeight);

    svg.append('rect')
      .attr('x', margin.left).attr('y', margin.top)
      .attr('width', chartWidth).attr('height', chartHeight)
      .attr('fill', colors.chartBg);

    const barsGroup = svg.append('g')
      .attr('class', 'bars-group')
      .attr('clip-path', 'url(#chart-clip)');

    if (tasks.length > 0) {
      barsGroup.selectAll('rect')
        .data(tasks)
        .enter()
        .append('rect')
        .attr('class', 'bars')
        .attr('x', d => xScale(d.start))
        .attr('y', d => yScale(d.task))
        .attr('width', d => xScale(d.end) - xScale(d.start))
        .attr('height', yScale.bandwidth())
        .attr('fill', d => d.color || 'steelblue')
        .attr('opacity', d => selectedCidrRef.current === null ? 0.85 : d.task === selectedCidrRef.current ? 1.0 : 0.35)
        .attr('stroke', d => d.task === selectedCidrRef.current ? colors.selectedStroke : 'none')
        .attr('stroke-width', d => d.task === selectedCidrRef.current ? 1.5 : 0)
        .attr('rx', 2)
        .style('cursor', 'pointer')
        .on('click', (event, d) => {
          event.stopPropagation();
          onSelectCidrRef.current?.(d.task);
        });
    }

    const xAxis = d3.axisBottom(xScale).ticks(8).tickFormat(numberToIpv4);
    const gX = svg.append('g')
      .attr('class', 'axises')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(xAxis);

    svg.append('g')
      .attr('class', 'axises')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));

    gX.selectAll('text')
      .style('text-anchor', 'end')
      .attr('transform', 'rotate(-45)')
      .attr('fill', colors.axisText);

    svg.selectAll('.axises .domain, .axises .tick line')
      .attr('stroke', colors.axisLine);

    svg.selectAll('.axises text')
      .attr('fill', colors.axisText);

    if (tasks.length === 0) {
      svg.append('text')
        .attr('x', margin.left + chartWidth / 2)
        .attr('y', margin.top + chartHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.emptyHint)
        .attr('font-size', '13px')
        .text('Add a CIDR block to visualize it here');
    }

    const zoom = d3.zoom()
      .scaleExtent([1, IPV4_MAX])
      .translateExtent([[margin.left, 0], [width - margin.right, height]])
      .extent([[margin.left, 0], [width - margin.right, height]])
      .on('zoom', zoomed);

    svg.call(zoom);

    // Horizontal scroll (deltaX) and Shift+scroll → pan instead of zoom.
    // D3's wheel.zoom only uses deltaY, so we handle the horizontal axis here.
    svg.on('wheel.pan', (event) => {
      const isHoriz = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      const isShift = event.shiftKey && event.deltaY !== 0;
      if (!isHoriz && !isShift) return;   // let D3 handle vertical-only wheel (zoom)

      event.preventDefault();
      const pixelScale = event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? 200 : 1;
      const delta = (isHoriz ? event.deltaX : event.deltaY) * pixelScale;
      const t = transformRef.current || d3.zoomIdentity;
      svg.call(zoom.transform,
        d3.zoomIdentity.translate(t.x - delta, t.y).scale(t.k));
    }, { passive: false });

    // Decide whether to re-fit or restore previous transform
    const taskKeys = tasks.map(t => t.task).join(',');
    const tasksChanged  = taskKeys !== prevTaskKeysRef.current;
    const fitRequested  = fitTrigger !== prevFitTriggerRef.current;
    prevTaskKeysRef.current   = taskKeys;
    prevFitTriggerRef.current = fitTrigger;

    if (tasks.length > 0 && (tasksChanged || fitRequested)) {
      const minStart = Math.min(...tasks.map(t => t.start));
      const maxEnd   = Math.max(...tasks.map(t => t.end));
      const range    = Math.max(maxEnd - minStart, 256);
      const pad      = range * 0.15;

      const viewStart = Math.max(0,        minStart - pad);
      const viewEnd   = Math.min(IPV4_MAX, maxEnd   + pad);
      const viewRange = viewEnd - viewStart;

      const k  = IPV4_MAX / viewRange;
      const tx = margin.left - k * xScale(viewStart);

      transformRef.current = d3.zoomIdentity.translate(tx, 0).scale(k);
      svg.call(zoom.transform, transformRef.current);
    } else if (transformRef.current) {
      svg.call(zoom.transform, transformRef.current);
    }

    // Update bar positions using the rescaled xScale — crisp vector rendering.
    // Bars narrower than MIN_BAR_PX are expanded symmetrically so they stay visible
    // at every zoom level without distorting the axis labels.
    function zoomed({ transform }) {
      transformRef.current = transform;
      const zx = transform.rescaleX(xScale);

      barsGroup.selectAll('.bars')
        .attr('x', d => {
          const pw = zx(d.end) - zx(d.start);
          return pw < MIN_BAR_PX ? zx(d.start) - (MIN_BAR_PX - pw) / 2 : zx(d.start);
        })
        .attr('width', d => Math.max(MIN_BAR_PX, zx(d.end) - zx(d.start)));

      gX.call(xAxis.scale(zx));
      gX.selectAll('text')
        .style('text-anchor', 'end')
        .attr('transform', 'rotate(-45)')
        .attr('fill', colors.axisText);
      gX.selectAll('.domain, .tick line')
        .attr('stroke', colors.axisLine);
    }

  }, [tasks, w, h, fitTrigger, theme]);

  // Update bar highlight whenever selection or theme changes — no full redraw needed
  useEffect(() => {
    const colors = GANTT_THEME[theme] || GANTT_THEME.dark;
    const svg = d3.select(svgRef.current);
    svg.selectAll('.bars')
      .attr('opacity', d => selectedCidr === null ? 0.85 : d.task === selectedCidr ? 1.0 : 0.35)
      .attr('stroke', d => d.task === selectedCidr ? colors.selectedStroke : 'none')
      .attr('stroke-width', d => d.task === selectedCidr ? 1.5 : 0);
  }, [selectedCidr, theme]);

  return (
      <div style={{ width: w + SVG_OVERFLOW_PAD, height: h + SVG_OVERFLOW_PAD, overflow: 'hidden' }}>
        <svg ref={svgRef} width={w} height={h} style={{ overflow: 'visible', fontFamily: "'Courier New', Consolas, monospace" }}></svg>
      </div>
  );
};

export default GanttChart;
