import React, { useRef, useState } from 'react';

export default function CidrInput({ onAdd }) {
  const [vals, setVals] = useState(['', '', '', '', '']);
  const refs = useRef([]);

  // Keep a ref so Enter keydown always sees latest vals (avoids stale closure)
  const valsRef = useRef(vals);
  valsRef.current = vals;

  const setField = (i, v) =>
    setVals(prev => { const n = [...prev]; n[i] = v; return n; });

  const focusAt = (i, toEnd = false) => {
    const el = refs.current[i];
    if (!el) return;
    el.focus();
    if (toEnd) el.setSelectionRange(el.value.length, el.value.length);
    else el.select();
  };

  const isReady = (v) =>
    v.slice(0, 4).every(x => x !== '' && +x <= 255) && v[4] !== '' && +v[4] <= 32;

  const doAdd = () => {
    const v = valsRef.current;
    if (!isReady(v)) return;
    onAdd(`${v[0]}.${v[1]}.${v[2]}.${v[3]}/${v[4]}`);
    setVals(['', '', '', '', '']);
    setTimeout(() => focusAt(0), 0);
  };

  const handleChange = (i, raw) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) { setField(i, ''); return; }

    const max = i < 4 ? 255 : 32;
    const num = parseInt(digits, 10);
    const finalVal = num > max ? String(max) : digits;
    setField(i, finalVal);

    const shouldAdvance = i < 4
      ? finalVal.length === 3 || (finalVal.length === 2 && +finalVal > 25)
      : finalVal.length === 2 || (finalVal.length === 1 && +finalVal > 3);

    if (shouldAdvance && i < 4)
      setTimeout(() => focusAt(i + 1), 0);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === '.' && i < 3) {
      e.preventDefault();
      focusAt(i + 1);
    } else if ((e.key === '/' || e.key === ' ') && i < 4) {
      e.preventDefault();
      focusAt(4);
    } else if (e.key === 'Backspace' && vals[i] === '' && i > 0) {
      e.preventDefault();
      focusAt(i - 1, true);
    } else if (e.key === 'ArrowRight') {
      const el = refs.current[i];
      if (el && el.selectionStart === vals[i].length && i < 4) {
        e.preventDefault();
        focusAt(i + 1);
      }
    } else if (e.key === 'ArrowLeft') {
      const el = refs.current[i];
      if (el && el.selectionStart === 0 && i > 0) {
        e.preventDefault();
        focusAt(i - 1, true);
      }
    } else if (e.key === 'Enter') {
      doAdd();
    }
  };

  const handlePaste = (i, e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text').trim();

    // Full CIDR: a.b.c.d/p
    const cidrM = text.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/);
    if (cidrM) {
      const [, a, b, c, d, p] = cidrM;
      if ([a, b, c, d].every(v => +v <= 255) && +p <= 32) {
        setVals([a, b, c, d, p]);
        setTimeout(() => focusAt(4), 0);
        return;
      }
    }

    // IP only: a.b.c.d
    const ipM = text.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipM) {
      const [, a, b, c, d] = ipM;
      if ([a, b, c, d].every(v => +v <= 255)) {
        setVals(prev => [a, b, c, d, prev[4]]);
        setTimeout(() => focusAt(4), 0);
        return;
      }
    }

    // Plain number for this field
    const digits = text.replace(/\D/g, '');
    if (digits) handleChange(i, digits);
  };

  const octetInput = (i) => (
    <input
      ref={el => { refs.current[i] = el; }}
      className="cidr-octet"
      type="text"
      inputMode="numeric"
      maxLength={3}
      value={vals[i]}
      placeholder="0"
      onChange={e => handleChange(i, e.target.value)}
      onKeyDown={e => handleKeyDown(i, e)}
      onPaste={e => handlePaste(i, e)}
    />
  );

  return (
    <div className="cidr-input">
      <div className="cidr-fields">
        {octetInput(0)}<span className="cidr-sep">.</span>
        {octetInput(1)}<span className="cidr-sep">.</span>
        {octetInput(2)}<span className="cidr-sep">.</span>
        {octetInput(3)}<span className="cidr-sep">/</span>
        <input
          ref={el => { refs.current[4] = el; }}
          className="cidr-prefix"
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={vals[4]}
          placeholder="24"
          onChange={e => handleChange(4, e.target.value)}
          onKeyDown={e => handleKeyDown(4, e)}
          onPaste={e => handlePaste(4, e)}
        />
      </div>
      <button onClick={doAdd}>Add</button>
    </div>
  );
}
