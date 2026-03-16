import React from 'react';
import './BinaryView.css';
import { getCidrInfo } from './helpers.js';
import { IPV4_BITS, BITS_PER_OCTET } from './constants.js';

const BinaryView = ({ cidrList, selectedCidr, theme }) => {
  const entry = selectedCidr ? cidrList.find(c => c.cidr === selectedCidr) : null;

  if (!entry) {
    return (
      <div className={`binary-view binary-view--${theme}`}>
        <span className="binary-empty">Select a CIDR from the list to see its binary representation</span>
      </div>
    );
  }

  const info = getCidrInfo(entry.cidr);
  const { prefix, network, subnetMask } = info;
  const color = entry.color;

  // Build two rows: network address and subnet mask
  const rows = [
    { label: 'Network Addr', ip: network },
    { label: 'Subnet Mask',  ip: subnetMask },
  ];

  const ipToBits = (ip) =>
    ip.split('.').map(octet =>
      Array.from({ length: BITS_PER_OCTET }, (_, i) => (Number(octet) >> (BITS_PER_OCTET - 1 - i)) & 1)
    );

  return (
    <div className={`binary-view binary-view--${theme}`}>

      <div className="binary-header">
        <span className="binary-label">Binary</span>
        <span className="binary-cidr-tag" style={{ borderColor: color, color }}>
          {entry.cidr}
        </span>
        <div className="binary-legend">
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: color }} />
            Network bits &nbsp;<strong>{prefix}</strong>
          </span>
          <span className="legend-item">
            <span className="legend-swatch legend-swatch--host" />
            Host bits &nbsp;<strong>{IPV4_BITS - prefix}</strong>
          </span>
        </div>
      </div>

      {rows.map(({ label, ip }) => {
        const octets = ip.split('.').map(Number);
        const bits = ipToBits(ip);
        return (
          <div className="binary-row" key={label}>
            <span className="binary-row-label">{label}</span>
            <div className="binary-bits">
              {bits.map((octetBits, i) => (
                <React.Fragment key={i}>
                  <div className="binary-octet">
                    <div className="bits-cells">
                      {octetBits.map((bit, j) => {
                        const pos = i * 8 + j;
                        const isNet = pos < prefix;
                        return (
                          <span
                            key={j}
                            className={`bit-cell ${isNet ? 'bit-cell--net' : 'bit-cell--host'}`}
                            style={isNet ? {
                              borderColor: color,
                              color: color,
                              background: `${color}22`,
                            } : {}}
                          >
                            {bit}
                          </span>
                        );
                      })}
                    </div>
                    <div className="octet-value">{octets[i]}</div>
                  </div>
                  {i < 3 && <span className="octet-dot">.</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      })}

      {/* Network / host span bar */}
      <div className="binary-span-bar">
        <div
          className="span-net"
          style={{ width: `${(prefix / IPV4_BITS) * 100}%`, background: `${color}55` }}
        >
          {prefix > 4 && <span>/{prefix} network</span>}
        </div>
        <div className="span-host">
          {(IPV4_BITS - prefix) > 4 && <span>{IPV4_BITS - prefix} host</span>}
        </div>
      </div>

    </div>
  );
};

export default BinaryView;
