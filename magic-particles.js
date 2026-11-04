// 魔幻粒子 —— 按钮周围飘散的金色光点
// 用 canvas 画，比 DOM 粒子快，也不会拖慢主线程

(function () {
  function createParticles(canvas) {
    var ctx = canvas.getContext('2d');
    var W, H, DPR;
    var parts = [];
    var running = true;
    var rafId = null;

    function resize() {
      DPR = window.devicePixelRatio || 1;
      var r = canvas.getBoundingClientRect();
      W = r.width;
      H = r.height;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function spawn() {
      // 从按钮内部随机位置冒出来
      var edge = Math.random();
      var x, y;
      if (edge < 0.62) {
        // 沿上边缘冒
        x = W * (0.08 + Math.random() * 0.84);
        y = H * (0.15 + Math.random() * 0.5);
      } else if (edge < 0.82) {
        x = W * (0.03 + Math.random() * 0.12);
        y = H * (0.3 + Math.random() * 0.5);
      } else {
        x = W * (0.85 + Math.random() * 0.12);
        y = H * (0.3 + Math.random() * 0.5);
      }
      return {
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 0.42,
        vy: -(0.28 + Math.random() * 0.62),
        r: 0.7 + Math.random() * 1.9,
        life: 0,
        maxLife: 70 + Math.random() * 90,
        hue: 40 + Math.random() * 14,   // 只走金色系：40~54
        bright: 74 + Math.random() * 22,
        star: Math.random() < 0.30
      };
    }

    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);

      // 维持粒子数
      if (parts.length < 26) {
        parts.push(spawn());
        if (Math.random() < 0.5) parts.push(spawn());
      }

      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.004;         // 缓慢加速上升
        p.vx += (Math.random() - 0.5) * 0.05;  // 轻微飘

        var t = p.life / p.maxLife;
        if (t >= 1) {
          parts.splice(i, 1);
          continue;
        }

        // 淡入淡出
        var alpha;
        if (t < 0.18) alpha = t / 0.18;
        else if (t > 0.7) alpha = (1 - t) / 0.3;
        else alpha = 1;
        alpha *= 0.9;

        var rad = p.r * (1 + t * 0.5);

        // 光晕
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad * 3.6);
        g.addColorStop(0, 'hsla(' + p.hue + ', 100%, ' + p.bright + '%, ' + (alpha * 0.95) + ')');
        g.addColorStop(0.42, 'hsla(' + p.hue + ', 95%, 62%, ' + (alpha * 0.42) + ')');
        g.addColorStop(1, 'hsla(' + p.hue + ', 90%, 55%, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad * 3.6, 0, Math.PI * 2);
        ctx.fill();

        // 核心亮点
        ctx.fillStyle = 'hsla(' + p.hue + ', 100%, 95%, ' + alpha + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad * 0.62, 0, Math.PI * 2);
        ctx.fill();

        // 约三成粒子带四芒星闪光
        if (p.star) {
          var sr = rad * (2.2 + t * 1.4);
          ctx.strokeStyle = 'hsla(' + p.hue + ', 100%, 88%, ' + (alpha * 0.75) + ')';
          ctx.lineWidth = Math.max(0.55, rad * 0.30);
          ctx.beginPath();
          ctx.moveTo(p.x - sr, p.y); ctx.lineTo(p.x + sr, p.y);
          ctx.moveTo(p.x, p.y - sr); ctx.lineTo(p.x, p.y + sr);
          ctx.stroke();
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener('resize', resize);
    tick();

    return {
      stop: function () {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
      },
      burst: function (n) {
        // 按下时爆发一波
        for (var i = 0; i < (n || 26); i++) {
          var p = spawn();
          p.vx = (Math.random() - 0.5) * 2.4;
          p.vy = -(1.1 + Math.random() * 2.0);
          p.r = 1.1 + Math.random() * 2.4;
          p.maxLife = 50 + Math.random() * 60;
          parts.push(p);
        }
      }
    };
  }

  window.createMagicParticles = createParticles;
})();
