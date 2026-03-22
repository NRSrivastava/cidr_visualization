import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import Gantt from './Gantt.js';
import { getCidrInfo } from './helpers.js';
import BinaryView from './BinaryView.js';
import { CIDR_COLORS, LAYOUT } from './constants.js';

const validateCidr = (cidr) => {
  if (!/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(cidr)) return false;
  const [ip, prefix] = cidr.split('/');
  if (ip.split('.').map(Number).some(p => p > 255)) return false;
  if (parseInt(prefix) > 32) return false;
  return true;
};

// Safe localStorage helpers
const ls = {
  get: (key, fallback) => {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
};

function App() {
  const [cidrList, setCidrList] = useState(() => ls.get('cidr-lens:cidrList', []));
  const [cidrInput, setCidrInput] = useState('');
  const [selectedCidr, setSelectedCidr] = useState(null);
  const [fitTrigger, setFitTrigger] = useState(0);
  const [theme, setTheme] = useState(() => ls.get('cidr-lens:theme', 'dark'));
  const [dragState, setDragState] = useState(null);
  // dragState: { idx, dy, insertIdx, itemHeight } | null
  const itemRefs = useRef([]);

  // Pane sizes — restored from localStorage, falling back to viewport-relative defaults
  const usableH = () => window.innerHeight - LAYOUT.HEADER_HEIGHT_PX;
  const [sidebarWidth, setSidebarWidth] = useState(() =>
    ls.get('cidr-lens:sidebarWidth', Math.round(window.innerWidth * LAYOUT.SIDEBAR_INIT_VW)));
  const [ganttHeight,  setGanttHeight]  = useState(() =>
    ls.get('cidr-lens:ganttHeight',  Math.round(usableH() * LAYOUT.GANTT_INIT_VH)));
  const [listHeight,   setListHeight]   = useState(() =>
    ls.get('cidr-lens:listHeight',   Math.round(usableH() * LAYOUT.LIST_INIT_VH)));
  const [chartAreaWidth, setChartAreaWidth] = useState(null);
  const chartAreaRef = useRef(null);

  useEffect(() => {
    ls.set('cidr-lens:cidrList',    cidrList);
    ls.set('cidr-lens:theme',       theme);
    ls.set('cidr-lens:sidebarWidth', sidebarWidth);
    ls.set('cidr-lens:ganttHeight',  ganttHeight);
    ls.set('cidr-lens:listHeight',   listHeight);
  }, [cidrList, theme, sidebarWidth, ganttHeight, listHeight]);

  useEffect(() => {
    if (!chartAreaRef.current) return;
    const ro = new ResizeObserver(entries => {
      setChartAreaWidth(Math.floor(entries[0].contentRect.width));
    });
    ro.observe(chartAreaRef.current);
    return () => ro.disconnect();
  }, []);

  const startVerticalDrag = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = sidebarWidth;
    const minW = Math.round(window.innerWidth * LAYOUT.SIDEBAR_MIN_VW);
    const maxW = Math.round(window.innerWidth * LAYOUT.SIDEBAR_MAX_VW);
    const onMove = (ev) => setSidebarWidth(Math.max(minW, Math.min(maxW, startW + ev.clientX - startX)));
    const onUp   = ()  => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const startListDrag = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = listHeight;
    const minH = Math.round(window.innerHeight * LAYOUT.LIST_MIN_VH);
    const onMove = (ev) => setListHeight(Math.max(minH, startH + ev.clientY - startY));
    const onUp   = ()  => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const startHorizontalDrag = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = ganttHeight;
    const minH = Math.round(window.innerHeight * LAYOUT.GANTT_MIN_VH);
    const maxH = Math.round(window.innerHeight * LAYOUT.GANTT_MAX_VH);
    const onMove = (ev) => setGanttHeight(Math.max(minH, Math.min(maxH, startH + ev.clientY - startY)));
    const onUp   = ()  => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleAddCidr = () => {
    const trimmed = cidrInput.trim();
    if (!validateCidr(trimmed)) { alert('Invalid CIDR format'); return; }
    if (cidrList.find(c => c.cidr === trimmed)) { alert('CIDR already added'); return; }
    const color = CIDR_COLORS[cidrList.length % CIDR_COLORS.length];
    setCidrList([...cidrList, { cidr: trimmed, color }]);
    setCidrInput('');
  };

  const handleDragHandleMouseDown = (e, index) => {
    e.preventDefault();
    e.stopPropagation();

    const rects = itemRefs.current.map(el => el ? el.getBoundingClientRect() : null);
    const itemHeight = rects[index]?.height || 34;
    const startY = e.clientY;
    let currentInsertIdx = index;

    const computeInsertIdx = (clientY) => {
      const dy = clientY - startY;
      const draggedCenter = rects[index].top + itemHeight / 2 + dy;
      let insert = index;
      for (let i = 0; i < rects.length; i++) {
        if (i === index || !rects[i]) continue;
        const center = rects[i].top + rects[i].height / 2;
        if (i < index && draggedCenter < center) insert = Math.min(insert, i);
        else if (i > index && draggedCenter > center) insert = i;
      }
      return insert;
    };

    setDragState({ idx: index, dy: 0, insertIdx: index, itemHeight });

    const onMouseMove = (ev) => {
      const dy = ev.clientY - startY;
      currentInsertIdx = computeInsertIdx(ev.clientY);
      setDragState({ idx: index, dy, insertIdx: currentInsertIdx, itemHeight });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (index !== currentInsertIdx) {
        setCidrList(list => {
          const newList = [...list];
          const [moved] = newList.splice(index, 1);
          newList.splice(currentInsertIdx, 0, moved);
          return newList;
        });
      }
      setDragState(null);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const getItemStyle = (index) => {
    if (!dragState) return {};
    const { idx, dy, insertIdx, itemHeight } = dragState;
    const gap = itemHeight + 4; // 4px = margin-bottom
    if (index === idx) {
      return {
        transform: `translateY(${dy}px)`,
        zIndex: 100,
        opacity: 0.85,
        transition: 'none',
        boxShadow: '0 6px 20px rgba(0,0,0,0.22)',
      };
    }
    let shift = 0;
    if (idx < insertIdx && index > idx && index <= insertIdx) shift = -gap;
    else if (idx > insertIdx && index < idx && index >= insertIdx) shift = gap;
    return { transform: `translateY(${shift}px)`, transition: 'transform 0.15s ease' };
  };

  const handleRemoveCidr = (cidr) => {
    setCidrList(cidrList.filter(c => c.cidr !== cidr));
    if (selectedCidr === cidr) setSelectedCidr(null);
  };

  const tasks = cidrList.map(({ cidr, color }) => {
    const info = getCidrInfo(cidr);
    return { task: cidr, start: info.networkNum, end: info.broadcastNum, color };
  });

  const selectedInfo = selectedCidr ? getCidrInfo(selectedCidr) : null;

  return (
    <div className={`App ${theme === 'light' ? 'light' : ''}`}>

      <div className="header">
        <div className="header-title">
          <img src="/cidr_icon.svg" alt="CIDR Lens icon" className="header-icon" />
          <h1>
            {'CIDR Lens'.split('').map((char, i) => (
              <span key={i} className="title-char" style={{ '--i': i }}>
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </h1>
          <span className="header-tagline">IPv4 CIDR Calculator &amp; Visualizer</span>
        </div>
        <button
          className="theme-toggle"
          onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? '[ Light Mode ]' : '[ Dark Mode ]'}
        </button>
      </div>

      <div className="layout">

        <div className="sidebar" style={{ width: sidebarWidth }}>
          <div className="cidr-input">
            <input
              type="text"
              value={cidrInput}
              onChange={(e) => setCidrInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCidr()}
              placeholder="e.g. 10.0.0.0/8"
              spellCheck={false}
            />
            <button onClick={handleAddCidr}>Add</button>
          </div>

          {cidrList.length > 0 && (
            <button className="fit-btn" onClick={() => setFitTrigger(f => f + 1)}>
              Fit All
            </button>
          )}

          <div
            className="cidr-list"
            style={{ height: listHeight, overflowY: dragState ? 'visible' : 'auto' }}
          >
            {cidrList.length === 0
              ? <p className="empty-hint">No CIDRs added yet.</p>
              : cidrList.map(({ cidr, color }, index) => (
                <div
                  key={cidr}
                  ref={el => { itemRefs.current[index] = el; }}
                  className={`cidr-item${selectedCidr === cidr ? ' selected' : ''}${dragState?.idx === index ? ' dragging' : ''}`}
                  style={{ position: 'relative', ...getItemStyle(index) }}
                  onClick={() => !dragState && setSelectedCidr(selectedCidr === cidr ? null : cidr)}
                >
                  <span
                    className="cidr-drag-handle"
                    onMouseDown={(e) => handleDragHandleMouseDown(e, index)}
                    onClick={(e) => e.stopPropagation()}
                  >⠿</span>
                  <span className="cidr-dot" style={{ background: color }} />
                  <span className="cidr-label">{cidr}</span>
                  <button
                    className="cidr-remove"
                    onClick={(e) => { e.stopPropagation(); handleRemoveCidr(cidr); }}
                  >✕</button>
                </div>
              ))
            }
          </div>

          <div className="divider divider-h" onMouseDown={startListDrag} />

          <div className="cidr-info">
            {selectedInfo ? (
              <>
                <div className="cidr-info-title">{selectedInfo.cidr}</div>
                <table>
                  <tbody>
                    <tr><td>CIDR Base IP</td><td>{selectedInfo.network}</td></tr>
                    <tr><td>Broadcast IP</td><td>{selectedInfo.broadcast}</td></tr>
                    <tr><td>Netmask</td><td>{selectedInfo.subnetMask}</td></tr>
                    <tr><td>Wildcard Mask</td><td>{selectedInfo.wildcard}</td></tr>
                    <tr><td>First Usable IP</td><td>{selectedInfo.firstHost}</td></tr>
                    <tr><td>Last Usable IP</td><td>{selectedInfo.lastHost}</td></tr>
                    <tr><td>Count</td><td>{selectedInfo.totalIPs.toLocaleString()}</td></tr>
                    <tr><td>Usable IPs</td><td>{selectedInfo.usableHosts.toLocaleString()}</td></tr>
                    <tr><td>Prefix</td><td>/{selectedInfo.prefix}</td></tr>
                  </tbody>
                </table>
              </>
            ) : (
              <p className="empty-hint">Select a CIDR to see calculations.</p>
            )}
          </div>
        </div>

        <div className="divider divider-v" onMouseDown={startVerticalDrag} />

        <div className="chart-area" ref={chartAreaRef}>
          {chartAreaWidth !== null && (
          <Gantt
            w={chartAreaWidth}
            h={ganttHeight}
            tasks={tasks}
            fitTrigger={fitTrigger}
            theme={theme}
            selectedCidr={selectedCidr}
            onSelectCidr={(cidr) => setSelectedCidr(prev => prev === cidr ? null : cidr)}
          />
          )}
          <div className="divider divider-h" onMouseDown={startHorizontalDrag} />
          <BinaryView
            cidrList={cidrList}
            selectedCidr={selectedCidr}
            theme={theme}
          />
        </div>

      </div>
    </div>
  );
}

export default App;
