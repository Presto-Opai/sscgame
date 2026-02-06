/**
 * CODEX DESCENDING — Protagonist (Elua)
 *
 * Elua: a small luminous teardrop of human values.
 * Renders consistently across all levels as the one constant.
 */

const Protagonist = (() => {
  // Elua's visual state
  let x = 0;
  let y = 0;
  let targetX = 0;
  let targetY = 0;
  let glowIntensity = 1.0;
  let breathPhase = 0;
  let scars = [];
  let trail = [];
  let sparkles = [];
  let state = 'idle'; // idle, moving, damaged, joyful

  // Animation constants
  const BREATH_SPEED = 1.5;
  const TRAIL_FADE = 0.3;
  const TRAIL_MAX = 12;
  const MOVE_SPEED = 3;
  const SPARKLE_COUNT = 5;

  function init(startX, startY, savedScars) {
    x = startX;
    y = startY;
    targetX = startX;
    targetY = startY;
    scars = savedScars || [];
    trail = [];
    sparkles = [];
    state = 'idle';
    glowIntensity = 1.0;
    breathPhase = 0;
  }

  function update(dt) {
    // Breathing animation
    breathPhase += BREATH_SPEED * dt;

    // Movement toward target
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 2) {
      state = 'moving';
      const speed = MOVE_SPEED * dt * 60;
      x += (dx / dist) * Math.min(speed, dist);
      y += (dy / dist) * Math.min(speed, dist);

      // Add trail point
      trail.unshift({ x, y, alpha: 1.0 });
      if (trail.length > TRAIL_MAX) trail.pop();
    } else {
      if (state === 'moving') state = 'idle';
    }

    // Fade trail
    for (let i = trail.length - 1; i >= 0; i--) {
      trail[i].alpha -= TRAIL_FADE * dt;
      if (trail[i].alpha <= 0) {
        trail.splice(i, 1);
      }
    }

    // Update sparkles (joyful state)
    if (state === 'joyful') {
      if (sparkles.length < SPARKLE_COUNT) {
        sparkles.push({
          angle: Math.random() * Math.PI * 2,
          radius: 15 + Math.random() * 10,
          speed: 1 + Math.random() * 2,
          alpha: 1.0,
        });
      }
    }
    for (let i = sparkles.length - 1; i >= 0; i--) {
      sparkles[i].angle += sparkles[i].speed * dt;
      sparkles[i].alpha -= 0.5 * dt;
      if (sparkles[i].alpha <= 0) sparkles.splice(i, 1);
    }
  }

  function render(ctx) {
    const breathScale = 1 + Math.sin(breathPhase) * 0.05;
    const baseAlpha = state === 'damaged' ? 0.5 : 1.0;
    const glowSize = state === 'joyful' ? 35 : 25;

    // Draw trail
    for (const t of trail) {
      ctx.save();
      ctx.globalAlpha = t.alpha * 0.3 * baseAlpha;
      ctx.fillStyle = '#f0c040';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw glow
    ctx.save();
    ctx.globalAlpha = 0.3 * glowIntensity * baseAlpha;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize * breathScale);
    gradient.addColorStop(0, '#f0c040');
    gradient.addColorStop(0.5, '#f0c04040');
    gradient.addColorStop(1, '#f0c04000');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, glowSize * breathScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw Elua body (teardrop shape)
    ctx.save();
    ctx.globalAlpha = baseAlpha;
    ctx.translate(x, y);
    ctx.scale(breathScale, breathScale);

    // Teardrop
    ctx.fillStyle = '#f0c040';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.bezierCurveTo(-8, -4, -7, 8, 0, 12);
    ctx.bezierCurveTo(7, 8, 8, -4, 0, -12);
    ctx.fill();

    // Inner light
    ctx.fillStyle = '#fff8e0';
    ctx.globalAlpha = 0.6 * baseAlpha;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.bezierCurveTo(-3, -2, -3, 4, 0, 6);
    ctx.bezierCurveTo(3, 4, 3, -2, 0, -6);
    ctx.fill();

    // Draw scars
    ctx.globalAlpha = 0.7 * baseAlpha;
    ctx.strokeStyle = '#403020';
    ctx.lineWidth = 1;
    for (const scar of scars) {
      ctx.beginPath();
      ctx.moveTo(scar.x1, scar.y1);
      ctx.lineTo(scar.x2, scar.y2);
      ctx.stroke();
    }

    ctx.restore();

    // Draw sparkles (joyful)
    for (const s of sparkles) {
      const sx = x + Math.cos(s.angle) * s.radius;
      const sy = y + Math.sin(s.angle) * s.radius;
      ctx.save();
      ctx.globalAlpha = s.alpha * 0.8;
      ctx.fillStyle = '#ffe080';
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function moveTo(tx, ty) {
    targetX = tx;
    targetY = ty;
  }

  function setPosition(px, py) {
    x = px;
    y = py;
    targetX = px;
    targetY = py;
  }

  function setState(newState) {
    state = newState;
  }

  function addScar(scar) {
    scars.push(scar);
  }

  function setGlow(intensity) {
    glowIntensity = Math.max(0, Math.min(1, intensity));
  }

  function getPosition() {
    return { x, y };
  }

  function getState() {
    return state;
  }

  // Render a small Elua icon (for HUD, level select, etc.)
  function renderIcon(ctx, cx, cy, size) {
    const s = size / 24;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);

    // Glow
    ctx.globalAlpha = 0.3;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
    g.addColorStop(0, '#f0c040');
    g.addColorStop(1, '#f0c04000');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f0c040';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.bezierCurveTo(-8, -4, -7, 8, 0, 12);
    ctx.bezierCurveTo(7, 8, 8, -4, 0, -12);
    ctx.fill();

    ctx.restore();
  }

  return {
    init,
    update,
    render,
    renderIcon,
    moveTo,
    setPosition,
    setState,
    addScar,
    setGlow,
    getPosition,
    getState,
  };
})();
