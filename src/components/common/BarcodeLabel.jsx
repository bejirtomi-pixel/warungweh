import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export default function BarcodeLabel({ value, width = 1.5, height = 40, fontSize = 10, displayValue = true }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, String(value), {
          format: 'CODE128',
          width,
          height,
          displayValue,
          fontSize,
          font: 'monospace',
          textMargin: 2,
          margin: 0,
          background: 'transparent',
          lineColor: '#1e293b',
        });
      } catch {
        if (svgRef.current) {
          svgRef.current.innerHTML = '';
        }
      }
    }
  }, [value, width, height, fontSize, displayValue]);

  if (!value) return null;

  return <svg ref={svgRef} />;
}
