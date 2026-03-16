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

function App() {
  const [cidrList, setCidrList] = useState([]);
  const [cidrInput, setCidrInput] = useState('');
  const [selectedCidr, setSelectedCidr] = useState(null);
  const [fitTrigger, setFitTrigger] = useState(0);
  const [theme, setTheme] = useState('dark');

  // Pane sizes — initialised from viewport so proportions hold at any resolution
  const usableH = () => window.innerHeight - LAYOUT.HEADER_HEIGHT_PX;
  const [sidebarWidth, setSidebarWidth] = useState(() => Math.round(window.innerWidth * LAYOUT.SIDEBAR_INIT_VW));
  const [ganttHeight,  setGanttHeight]  = useState(() => Math.round(usableH() * LAYOUT.GANTT_INIT_VH));
  const [listHeight,   setListHeight]   = useState(() => Math.round(usableH() * LAYOUT.LIST_INIT_VH));
  const [chartAreaWidth, setChartAreaWidth] = useState(800);
  const chartAreaRef = useRef(null);

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
          <h1>CIDR Lens</h1>
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

          <div className="cidr-list" style={{ height: listHeight, overflowY: 'auto' }}>
            {cidrList.length === 0
              ? <p className="empty-hint">No CIDRs added yet.</p>
              : cidrList.map(({ cidr, color }) => (
                <div
                  key={cidr}
                  className={`cidr-item${selectedCidr === cidr ? ' selected' : ''}`}
                  onClick={() => setSelectedCidr(selectedCidr === cidr ? null : cidr)}
                >
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
          <Gantt
            w={chartAreaWidth}
            h={ganttHeight}
            tasks={tasks}
            fitTrigger={fitTrigger}
            theme={theme}
          />
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
