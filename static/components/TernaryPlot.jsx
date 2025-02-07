// static/components/TernaryPlot.jsx

import React, { useState, useEffect } from 'react';
import CoordinateDebugger, { labelConfig } from './CoordinateDebugger'; // Debugging tool for ternary coordinates

// TernaryPlot Component
const TernaryPlot = ({ analysisData, onPlotCalculated }) => {
    const [layers, setLayers] = useState({
        // baseline: true,  # Hide baseline by default
        gridLines: true,
        categoryBoundaries: true,
        shading: true
    });

    const width = 800;
    const height = 700;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // Calculate triangle vertices
    const vertices = {
        top: { x: plotWidth / 2 + margin.left, y: margin.top }, // Modern
        left: { x: margin.left, y: height - margin.bottom }, // PostModern
        right: { x: width - margin.right, y: height - margin.bottom } // PreModern
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

    // Calculate plot point position and send to parent
    const plotPoint = ternaryToCartesian(...analysisData.scores);
    
    useEffect(() => {
        if (analysisData?.scores) {
            const plotPoint = ternaryToCartesian(...analysisData.scores);
            console.log("📍 Calculated plot coordinates in TernaryPlot:", plotPoint);
            
            if (onPlotCalculated) {
                console.log("📤 Sending plot coordinates to parent:", plotPoint);
                onPlotCalculated(plotPoint);
            } else {
                console.warn("⚠️ WARNING: `onPlotCalculated` is missing in TernaryPlot!");
            }
        } else {
            console.warn("⚠️ WARNING: `analysisData.scores` is undefined in TernaryPlot.");
        }
    }, [analysisData]);
 
    return (
        <div className="relative">
            <DebugControls position={debugPosition} onAdjust={adjustPosition} />
            <LayerControls layers={layers} setLayers={setLayers} />
            <svg width={width} height={height} className="bg-white mx-auto" viewBox={`0 0 ${width} ${height}`}>
                <text 
                    key="postmodern-label"
                    x={margin.left + labelConfig.postmodern.x} 
                    y={height - margin.bottom + labelConfig.postmodern.y}
                    textAnchor="end"
                    transform={labelConfig.postmodern.r ? 
                        `rotate(${labelConfig.postmodern.r} ${margin.left + labelConfig.postmodern.x} ${height - margin.bottom + labelConfig.postmodern.y})` : 
                        null}
                >
                    Postmodern
                </text>

                {/* Debug overlay */}
                {process.env.NODE_ENV === 'development' && (
                    <CoordinateDebugger 
                        width={width} 
                        height={height} 
                        margin={margin}
                    />
                )}
            </svg>
        </div>
    );
};

export default TernaryPlot;