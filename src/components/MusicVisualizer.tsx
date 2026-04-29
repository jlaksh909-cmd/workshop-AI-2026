/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useEffect } from 'react';

interface MusicVisualizerProps {
  audioData: Uint8Array | null;
  color?: string;
  className?: string;
}

export default function MusicVisualizer({ audioData, color = '#22d3ee', className = "" }: MusicVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioData) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / audioData.length;

    ctx.clearRect(0, 0, width, height);
    
    // Draw horizontal bars
    audioData.forEach((value, index) => {
      const barHeight = (value / 255) * height;
      const x = index * barWidth;
      
      // Gradient for each bar
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
      gradient.addColorStop(0, `${color}22`); // 13% opacity
      gradient.addColorStop(1, color);

      ctx.fillStyle = gradient;
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      
      ctx.beginPath();
      // Draw rounded top bars
      ctx.roundRect(x + 1, height - barHeight, barWidth - 2, barHeight, 4);
      ctx.fill();
    });

    ctx.shadowBlur = 0;
  }, [audioData, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={100} 
      className={`opacity-60 mix-blend-screen pointer-events-none ${className}`}
    />
  );
}
