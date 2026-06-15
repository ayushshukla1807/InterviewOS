'use client';

import React, { useEffect, useRef } from 'react';

export function ThemeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Track mouse coordinates and interactive radius
    const mouse = {
      x: null as number | null,
      y: null as number | null,
      radius: 180,
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    // Particle Node representation
    class Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      baseRadius: number;
      color: string;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        // Slow float velocities
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        this.baseRadius = Math.random() * 1.5 + 0.8;
        this.radius = this.baseRadius;
        
        // Randomize between emerald-green and cyan/indigo nodes to blend styles
        const rand = Math.random();
        if (rand < 0.6) {
          this.color = 'rgba(0, 255, 65, '; // Neon green (portfolio)
        } else if (rand < 0.85) {
          this.color = 'rgba(16, 185, 129, '; // Emerald
        } else {
          this.color = 'rgba(99, 102, 241, '; // Indigo
        }
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Boundary bounce
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Interaction with mouse pointer
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            // Gently push particles away from mouse
            this.x -= (dx / dist) * force * 1.5;
            this.y -= (dy / dist) * force * 1.5;
            this.radius = this.baseRadius * (1 + force * 1.5);
          } else {
            if (this.radius > this.baseRadius) {
              this.radius -= 0.05;
            }
          }
        }
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color + '0.45)';
        ctx.fill();
      }
    }

    // Dynamic node count based on viewport size
    const nodeCount = Math.min(120, Math.floor((width * height) / 14000));
    const nodes: Node[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push(new Node());
    }

    const gridSpacing = 80;
    let time = 0;

    const render = () => {
      // Clear viewport
      ctx.clearRect(0, 0, width, height);

      time += 0.003;

      // Draw horizontal & vertical grid lines (cyber matrix perspective)
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0, 255, 65, 0.025)'; // very subtle neon-green lines

      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        for (let y = 0; y < height; y += 30) {
          // Dynamic wave offset using sine
          const waveX = Math.sin(y * 0.004 + time) * 6;
          if (y === 0) {
            ctx.moveTo(x + waveX, y);
          } else {
            ctx.lineTo(x + waveX, y);
          }
        }
        ctx.stroke();
      }

      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath();
        for (let x = 0; x < width; x += 30) {
          const waveY = Math.cos(x * 0.004 + time) * 6;
          if (x === 0) {
            ctx.moveTo(x, y + waveY);
          } else {
            ctx.lineTo(x, y + waveY);
          }
        }
        ctx.stroke();
      }

      // Draw Grid Intersection Vertices (Quantum Dot grid)
      for (let x = 0; x < width; x += gridSpacing) {
        for (let y = 0; y < height; y += gridSpacing) {
          const waveX = Math.sin(y * 0.004 + time) * 6;
          const waveY = Math.cos(x * 0.004 + time) * 6;
          
          ctx.beginPath();
          ctx.arc(x + waveX, y + waveY, 1.2, 0, Math.PI * 2);
          
          // Subtle color variance for intersection points
          if ((x + y) % 3 === 0) {
            ctx.fillStyle = 'rgba(99, 102, 241, 0.09)'; // soft indigo
          } else {
            ctx.fillStyle = 'rgba(0, 255, 65, 0.09)'; // soft green
          }
          ctx.fill();
        }
      }

      // Update and draw network nodes
      nodes.forEach((n) => {
        n.update();
        n.draw();
      });

      // Connect nodes that are close to each other (Neural Mesh structure)
      ctx.lineWidth = 0.85;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const alpha = (140 - dist) / 140 * 0.15;
            
            // Connect lines blend gradiently based on node primary color type
            if (nodes[i].color.includes('99, 102')) {
              ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            } else {
              ctx.strokeStyle = `rgba(0, 255, 65, ${alpha})`;
            }
            
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-2] transition-opacity duration-1000"
      style={{ background: '#050508' }} // Deep space background color matching the portfolio
    />
  );
}
