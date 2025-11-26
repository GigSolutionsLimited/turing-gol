// Performance monitoring component for development
import React, { useState, useEffect, useRef } from 'react';
import { GameService } from '../../services/gameService';

/**
 * Performance monitoring overlay for development
 * Shows FPS, render time, memory usage, and other metrics
 */
const PerformanceMonitor = ({ visible = true, position = 'top-right' }) => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    renderTime: 0
  });

  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const lastFrameTime = useRef(performance.now());

  // Track FPS and frame time
  useEffect(() => {
    let animationId;

    const updateMetrics = () => {
      const now = performance.now();
      frameCount.current++;

      // Calculate FPS every second
      if (now - lastTime.current >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
        setMetrics(prev => ({ ...prev, fps }));
        frameCount.current = 0;
        lastTime.current = now;
      }

      // Calculate frame time
      const frameTime = now - lastFrameTime.current;
      lastFrameTime.current = now;
      setMetrics(prev => ({ ...prev, frameTime: frameTime.toFixed(1) }));

      animationId = requestAnimationFrame(updateMetrics);
    };

    animationId = requestAnimationFrame(updateMetrics);

    // Cleanup function to cancel the animation loop
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  // Update performance stats periodically
  useEffect(() => {
    const interval = setInterval(() => {

      // Memory usage (if available)
      if (performance.memory) {
        const memoryUsage = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
        setMetrics(prev => ({ ...prev, memoryUsage }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!visible || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const positionStyles = {
    'top-left': { top: '10px', left: '10px' },
    'top-right': { top: '10px', right: '10px' },
    'bottom-left': { bottom: '10px', left: '10px' },
    'bottom-right': { bottom: '10px', right: '10px' }
  };

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#00ff00',
        padding: '8px',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 10000,
        minWidth: '120px',
        border: '1px solid #333'
      }}
    >
      <div>FPS: {metrics.fps}</div>
      <div>Frame: {metrics.frameTime}ms</div>
      {metrics.memoryUsage > 0 && (
        <div>Memory: {metrics.memoryUsage}MB</div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
