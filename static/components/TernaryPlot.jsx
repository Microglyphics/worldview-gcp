import React, { useState } from 'react';

const TernaryPlot = ({ analysisData }) => {
  // Destructure the analysis data
  const { scores, perspective } = analysisData;
  
  const [layers, setLayers] = useState({
    baseline: true,
    gridLines: true,
    mixTriangle: true,
    shading: true
  });

  const width = 800;
  const height = 700;
  const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Calculate triangle vertices
  const vertices = {
    top: { x: plotWidth / 2, y: margin.top }, // Modern
    left: { x: margin.left, y: plotHeight - margin.bottom }, // PostModern
    right: { x: plotWidth - margin.right, y: plotHeight - margin.bottom } // PreModern
  };

  // Convert ternary coordinates to Cartesian
  const ternaryToCartesian = (pre, mod, post) => {
    const total = pre + mod + post;
    const normalizedPre = pre / total;
    const normalizedMod = mod / total;
    const normalizedPost = post / total;

    const x = vertices.left.x * normalizedPost + 
              vertices.top.x * normalizedMod + 
              vertices.right.x * normalizedPre;

    const y = vertices.left.y * normalizedPost + 
              vertices.top.y * normalizedMod + 
              vertices.right.y * normalizedPre;

    return { x, y };
  };

  // Calculate plot point position from scores
  const plotPoint = scores ? ternaryToCartesian(...scores) : null;

  // Generate tick marks
  const generateTicks = () => {
    const ticks = [];
    for (let i = 0; i <= 100; i += 10) {
      // Bottom edge ticks
      const x = vertices.left.x + (vertices.right.x - vertices.left.x) * (i / 100);
      ticks.push(
        <g key={`bottom-${i}`}>
          <line 
            x1={x} 
            y1={vertices.left.y} 
            x2={x} 
            y2={vertices.left.y + 5} 
            stroke="black" 
            strokeWidth="1" 
          />
          <text 
            x={x} 
            y={vertices.left.y + 20} 
            textAnchor="middle" 
            className="text-xs"
          >
            {i}
          </text>
        </g>
      );
    }
    return ticks;
  };

  // Generate grid lines
  const generateGrid = () => {
    if (!layers.gridLines) return null;
    
    const gridLines = [];
    for (let i = 10; i <= 90; i += 10) {
      const startX = vertices.left.x + (vertices.right.x - vertices.left.x) * (i / 100);
      const startY = vertices.left.y;
      const endX = vertices.top.x;
      const endY = vertices.top.y + (vertices.left.y - vertices.top.y) * (1 - i / 100);
      
      gridLines.push(
        <line
          key={`grid-${i}`}
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="#E0E0E0"
          strokeWidth="0.5"
          strokeDasharray="2,2"
        />
      );
    }
    return gridLines;
  };

  return (
    <div className="relative">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">{perspective}</h2>
        <p className="text-sm text-gray-600">
          PreModern: {scores[0]}%, Modern: {scores[1]}%, PostModern: {scores[2]}%
        </p>
      </div>
      
      <svg 
        width={width} 
        height={height} 
        className="bg-white mx-auto"
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* Base triangle */}
        <g className={layers.baseline ? 'visible' : 'invisible'}>
          <path
            d={`M ${vertices.left.x},${vertices.left.y} 
                L ${vertices.top.x},${vertices.top.y} 
                L ${vertices.right.x},${vertices.right.y} 
                L ${vertices.left.x},${vertices.left.y}`}
            stroke="black"
            strokeWidth="2"
            fill="none"
          />
          
          {generateTicks()}
          {generateGrid()}
          
          {/* Labels */}
          <text x={vertices.top.x} y={vertices.top.y - 20} textAnchor="middle" className="text-lg font-bold">
            Modern
          </text>
          <text x={vertices.left.x - 20} y={vertices.left.y} textAnchor="end" className="text-lg font-bold">
            PostModern
          </text>
          <text x={vertices.right.x + 20} y={vertices.right.y} textAnchor="start" className="text-lg font-bold">
            PreModern
          </text>
        </g>

        {/* Plot point */}
        {plotPoint && (
          <circle
            cx={plotPoint.x}
            cy={plotPoint.y}
            r="6"
            fill="red"
            stroke="white"
            strokeWidth="2"
          />
        )}
      </svg>
      
      {/* Layer Controls */}
      <div className="absolute top-4 right-4 bg-white p-4 rounded shadow-lg">
        <h3 className="font-bold mb-2">Layer Controls</h3>
        {Object.entries(layers).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2 mb-1">
            <input
              type="checkbox"
              checked={value}
              onChange={() => setLayers(prev => ({ ...prev, [key]: !prev[key] }))}
              id={key}
              className="form-checkbox"
            />
            <label htmlFor={key} className="capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TernaryPlot;