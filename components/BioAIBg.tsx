'use client';

import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export default function BioAIBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const isReducedMotion = useRef(false);

  useEffect(() => {
    isReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 初始化节点
    const initNodes = () => {
      const count = Math.min(Math.floor((canvas.width * canvas.height) / 25000), 60);
      const nodes: Node[] = [];

      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 2 + 1,
        });
      }

      nodesRef.current = nodes;
    };

    initNodes();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const nodes = nodesRef.current;

      // 更新和绘制节点
      nodes.forEach((node) => {
        if (!isReducedMotion.current) {
          node.x += node.vx;
          node.y += node.vy;

          // 边界反弹
          if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
          if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
        }

        // 绘制节点 - 生物感荧光效果
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        
        // 创建渐变填充
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.radius * 3
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.62)');
        gradient.addColorStop(0.58, 'rgba(142, 160, 255, 0.28)');
        gradient.addColorStop(1, 'rgba(124, 240, 210, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 添加光晕效果
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.055)';
        ctx.fill();
      });

      // 绘制连线
      const maxDistance = 150;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.4;
            const gradient = ctx.createLinearGradient(
              nodes[i].x, nodes[i].y,
              nodes[j].x, nodes[j].y
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.8})`);
            gradient.addColorStop(0.5, `rgba(142, 160, 255, ${opacity * 0.55})`);
            gradient.addColorStop(1, `rgba(124, 240, 210, ${opacity * 0.65})`);
            
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            // 添加连线的光晕效果
            if (opacity > 0.2) {
              ctx.beginPath();
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
              ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.22})`;
              ctx.lineWidth = 3;
              ctx.stroke();
            }
          }
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ 
        background: `
          radial-gradient(ellipse at center top, rgba(255, 255, 255, 0.045) 0%, transparent 54%),
          radial-gradient(ellipse at center bottom, rgba(124, 240, 210, 0.028) 0%, transparent 60%),
          linear-gradient(135deg,
            #050507 0%,
            #0b0c11 25%,
            #11131a 50%,
            #08090d 75%,
            #050507 100%)
        `,
        backgroundSize: '100% 100%, 100% 100%, 200% 200%',
        backgroundAttachment: 'fixed, fixed, fixed'
      }}
      aria-hidden="true"
    />
  );
}
