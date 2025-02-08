// static/components/TernaryPlot.jsx

import React, { useState, useEffect } from 'react';

// TernaryPlot Component
const TernaryPlot = ({ analysisData, onPlotCalculated }) => {
    const [layers, setLayers] = useState({
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
        if (analysisData?.scores && onPlotCalculated) {
            const plotPoint = ternaryToCartesian(...analysisData.scores);
            onPlotCalculated(plotPoint);
        }
    }, [analysisData]);
 
    return (
        <div className="relative">
            <LayerControls layers={layers} setLayers={setLayers} />
            <svg width={width} height={height} className="bg-white mx-auto" viewBox={`0 0 ${width} ${height}`}>
                {layers.shading && generateShading()}
                {layers.gridLines && generateGridAndTicks()}
                {generateBaselineWithScales()}
                {layers.categoryBoundaries && generateMixTriangle()}
                <circle cx={plotPoint.x} cy={plotPoint.y} r="6" fill="red" stroke="white" strokeWidth="2"/>
            </svg>
        </div>
    );
};

export default TernaryPlot;