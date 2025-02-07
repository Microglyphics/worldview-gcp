// src/components/CoordinateDebugger.jsx

import React, { useState } from 'react';

export const labelConfig = {
    postmodern: {
        x: 10,
        y: 40,
        r: 0
    },
    modern: {
        x: 0,
        y: 0,
        r: 0
    },
    premodern: {
        x: 0,
        y: 0,
        r: 0
    }
};

export const generateTestPlot = (pre, mod, post) => {
    return {
        plot_x: Math.round(750 * (mod / 100) + 0 * (pre / 100) + 1500 * (post / 100)),
        plot_y: Math.round(1300 * (mod / 100) + 650 * (pre / 100) + 650 * (post / 100)),
        n1: pre,
        n2: mod,
        n3: post
    };
};

const CoordinateDebugger = ({ width, height, margin }) => {
    const [debugState, setDebugState] = useState({
        showDots: true,
        showCoordinates: true,
        currentLabel: 'postmodern'
    });

    const handleAdjustPosition = (axis, value) => {
        labelConfig[debugState.currentLabel][axis] += value;
        setDebugState({...debugState}); // Force re-render
    };

    const renderDebugElements = () => {
        const currentConfig = labelConfig[debugState.currentLabel];
        const baseX = margin.left + currentConfig.x;
        const baseY = height - margin.bottom + currentConfig.y;

        return (
            <g>
                {/* Debug point */}
                {debugState.showDots && (
                    <circle 
                        cx={baseX}
                        cy={baseY}
                        r="2"
                        fill="red"
                    />
                )}

                {/* Coordinate readout */}
                {debugState.showCoordinates && (
                    <text 
                        x={width - margin.right - 150}
                        y={margin.top + 20}
                        textAnchor="end"
                        className="text-sm font-mono"
                    >
                        {`${debugState.currentLabel}: (${currentConfig.x}, ${currentConfig.y}) R${currentConfig.r}`}
                    </text>
                )}
            </g>
        );
    };

    const renderControls = () => (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded shadow-lg">
            <div className="space-y-2">
                <div className="font-bold">Coordinate Debugger</div>
                
                {/* Position Controls */}
                <div className="space-x-2">
                    <button onClick={() => handleAdjustPosition('x', -5)} className="px-2 py-1 bg-blue-500 text-white rounded">X-5</button>
                    <button onClick={() => handleAdjustPosition('x', 5)} className="px-2 py-1 bg-blue-500 text-white rounded">X+5</button>
                    <button onClick={() => handleAdjustPosition('y', -5)} className="px-2 py-1 bg-blue-500 text-white rounded">Y-5</button>
                    <button onClick={() => handleAdjustPosition('y', 5)} className="px-2 py-1 bg-blue-500 text-white rounded">Y+5</button>
                </div>

                {/* Rotation Control */}
                <div className="space-x-2">
                    <button onClick={() => handleAdjustPosition('r', -5)} className="px-2 py-1 bg-green-500 text-white rounded">R-5°</button>
                    <button onClick={() => handleAdjustPosition('r', 5)} className="px-2 py-1 bg-green-500 text-white rounded">R+5°</button>
                </div>

                {/* Toggle Controls */}
                <div className="space-x-2">
                    <label className="inline-flex items-center">
                        <input 
                            type="checkbox" 
                            checked={debugState.showDots} 
                            onChange={() => setDebugState({...debugState, showDots: !debugState.showDots})}
                            className="mr-2"
                        />
                        Show Dots
                    </label>
                    <label className="inline-flex items-center ml-4">
                        <input 
                            type="checkbox" 
                            checked={debugState.showCoordinates} 
                            onChange={() => setDebugState({...debugState, showCoordinates: !debugState.showCoordinates})}
                            className="mr-2"
                        />
                        Show Coordinates
                    </label>
                </div>

                {/* Current Values */}
                <div className="text-sm font-mono">
                    Current Position: ({labelConfig[debugState.currentLabel].x}, {labelConfig[debugState.currentLabel].y})
                    <br />
                    Rotation: {labelConfig[debugState.currentLabel].r}°
                </div>
            </div>
        </div>
    );

    return (
        <>
            {renderDebugElements()}
            {renderControls()}
        </>
    );
};

export default CoordinateDebugger;