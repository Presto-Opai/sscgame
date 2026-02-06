/* ======================================
   CODEX DESCENDING - Protagonist (Elua)
   Shared state and rendering for the
   luminous protagonist across all levels
   ====================================== */

class Protagonist {
    constructor() {
        const saved = SaveManager.load().elua;
        this.humanity = saved.humanity;
        this.maxHumanity = 100;
        this.scars = saved.scars || [];
        this.transformation = saved.transformation || 'bright';

        // Visual properties
        this.x = 0;
        this.y = 0;
        this.radius = 10;
        this.glowRadius = 30;
        this.glowPulse = 0;
        this.trail = [];
        this.maxTrail = 12;
    }

    setPosition(x, y) {
        // Add to trail
        this.trail.unshift({ x: this.x, y: this.y, age: 0 });
        if (this.trail.length > this.maxTrail) this.trail.pop();

        this.x = x;
        this.y = y;
    }

    adjustHumanity(amount) {
        this.humanity = Math.max(0, Math.min(this.maxHumanity, this.humanity + amount));
        return this.humanity;
    }

    addScar(scarId) {
        if (!this.scars.includes(scarId)) {
            this.scars.push(scarId);
        }
    }

    getGlowColor() {
        if (this.humanity > 70) return { r: 240, g: 208, b: 96 };   // warm gold
        if (this.humanity > 40) return { r: 200, g: 180, b: 120 };  // dimmer
        if (this.humanity > 20) return { r: 160, g: 150, b: 140 };  // fading
        return { r: 130, g: 130, b: 140 };                           // almost grey
    }

    update(dt) {
        this.glowPulse += dt * 2;
        // Age trail
        for (const t of this.trail) {
            t.age += dt;
        }
        this.trail = this.trail.filter(t => t.age < 0.5);
    }

    draw(ctx) {
        const glow = this.getGlowColor();
        const pulseAmount = Math.sin(this.glowPulse) * 0.3 + 0.7;

        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const alpha = (1 - t.age / 0.5) * 0.3;
            const r = this.radius * (1 - t.age / 0.5) * 0.7;
            ctx.beginPath();
            ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${glow.r}, ${glow.g}, ${glow.b}, ${alpha})`;
            ctx.fill();
        }

        // Outer glow
        const gradient = ctx.createRadialGradient(
            this.x, this.y, this.radius * 0.5,
            this.x, this.y, this.glowRadius * pulseAmount
        );
        gradient.addColorStop(0, `rgba(${glow.r}, ${glow.g}, ${glow.b}, 0.4)`);
        gradient.addColorStop(1, `rgba(${glow.r}, ${glow.g}, ${glow.b}, 0)`);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.glowRadius * pulseAmount, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${glow.r}, ${glow.g}, ${glow.b})`;
        ctx.fill();

        // Inner bright spot
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff8e0';
        ctx.fill();

        // Scars as small dark marks
        for (let i = 0; i < this.scars.length; i++) {
            const angle = (i / this.scars.length) * Math.PI * 2;
            const sx = this.x + Math.cos(angle) * this.radius * 0.6;
            const sy = this.y + Math.sin(angle) * this.radius * 0.6;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(80, 50, 80, 0.7)';
            ctx.fill();
        }
    }

    persist() {
        SaveManager.updateElua({
            humanity: this.humanity,
            scars: this.scars,
            transformation: this.transformation
        });
    }
}
