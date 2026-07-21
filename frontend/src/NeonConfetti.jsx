import { useEffect, useRef } from 'react';

const NEON_COLORS = [
  '#00ffcc', // Cyan
  '#a855f7', // Purple/Violet
  '#22c55e', // Emerald Green
  '#ff007f', // Neon Pink
  '#facc15', // Neon Yellow
  '#3b82f6', // Bright Blue
];

export default function NeonConfetti({ trigger }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!trigger) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];
    const particleCount = 130;

    // Spawn particles from center area with burst physics
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.PI * (Math.random() * 0.9 + 0.05); // Upward trajectory spread
      const speed = Math.random() * 15 + 5;
      particles.push({
        x: canvas.width / 2 + (Math.random() * 300 - 150),
        y: canvas.height * 0.45 + (Math.random() * 100 - 50),
        vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
        vy: -Math.sin(angle) * speed,
        size: Math.floor(Math.random() * 6) + 4, // Pixelated square size
        color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.25,
        opacity: 1,
      });
    }

    let animationFrameId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      particles.forEach((p) => {
        if (p.opacity <= 0) return;
        alive = true;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // Gravity
        p.vx *= 0.98; // Drag
        p.rotation += p.vRot;
        p.opacity -= 0.012;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, p.opacity);

        // Neon glow effect for pixel squares
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = p.color;

        // Render pixelated square
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      if (alive) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    render();

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}
