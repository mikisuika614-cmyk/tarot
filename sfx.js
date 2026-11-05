// 音效 —— 全部用 Web Audio 合成，不加载任何外部文件
// 沉稳的钟声质感，跟塔罗的气质搭

(function () {
  var ctx = null;
  var enabled = true;

  function ac() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return null;
      }
    }
    // 某些浏览器需要用户交互才能启动
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // 单个音符：带衰减包络的正弦波 + 一点泛音
  function tone(freq, start, dur, vol, type) {
    var c = ac();
    if (!c) return;
    var t0 = c.currentTime + start;

    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);

    // 指数衰减，像钟声
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);

    // 泛音让声音更"实"
    if (type !== 'triangle') {
      var osc2 = c.createOscillator();
      var g2 = c.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.01, t0);
      g2.gain.setValueAtTime(0, t0);
      g2.gain.linearRampToValueAtTime(vol * 0.22, t0 + 0.01);
      g2.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.6);
      osc2.connect(g2);
      g2.connect(c.destination);
      osc2.start(t0);
      osc2.stop(t0 + dur * 0.6 + 0.05);
    }
  }

  // 洗牌：一串细碎的沙沙声（噪声短促叠加）
  function shuffling() {
    var c = ac();
    if (!c) return;
    var dur = 1.25;
    var bufSize = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, bufSize, c.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) {
      // 衰减的白噪声
      var t = i / bufSize;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 1.5) * 0.42;
    }
    var src = c.createBufferSource();
    src.buffer = buf;

    // 带通滤波，只留高频的"沙沙"
    var bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3200;
    bp.Q.value = 0.7;

    var g = c.createGain();
    g.gain.value = 0.95;

    src.connect(bp);
    bp.connect(g);
    g.connect(c.destination);
    src.start();
  }

  // 翻牌：像翻开一张厚纸，带一点回响
  function flip() {
    // 摩擦感：一小段带通噪声，只在最前面
    var c = ac();
    if (c) {
      var dur = 0.16;
      var bufSize = Math.floor(c.sampleRate * dur);
      var buf = c.createBuffer(1, bufSize, c.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        var p = i / bufSize;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - p, 2.2) * 0.10;
      }
      var src = c.createBufferSource();
      src.buffer = buf;
      var bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2200;
      bp.Q.value = 1.1;
      var g = c.createGain();
      g.gain.value = 0.55;
      src.connect(bp);
      bp.connect(g);
      g.connect(c.destination);
      src.start();
    }

    // 主音响：比原来低一点，长很多
    tone(660, 0.015, 1.05, 0.115, 'triangle');
    tone(990, 0.03, 0.72, 0.055, 'sine');
    tone(1320, 0.045, 0.42, 0.035, 'sine');
    tone(330, 0, 1.15, 0.05, 'sine');
  }

  // 翻开三张完成：一段上行和弦
  function reveal() {
    var notes = [523.25, 659.25, 783.99, 1046.5];  // C E G C
    for (var i = 0; i < notes.length; i++) {
      tone(notes[i], i * 0.11, 0.95 - i * 0.1, 0.13, 'triangle');
    }
  }

  // 按钮点击：短促的一声
  function tap() {
    tone(660, 0, 0.11, 0.10, 'triangle');
    tone(990, 0.01, 0.09, 0.055, 'sine');
  }

  window.SFX = {
    enable: function (v) {
      enabled = !!v;
      try { localStorage.setItem('tarot_sound', enabled ? '1' : '0'); } catch (e) {}
    },
    isOn: function () { return enabled; },
    shuffling: function () { if (enabled) { try { shuffling(); } catch (e) {} } },
    flip: function () { if (enabled) { try { flip(); } catch (e) {} } },
    reveal: function () { if (enabled) { try { reveal(); } catch (e) {} } },
    tap: function () { if (enabled) { try { tap(); } catch (e) {} } }
  };

  // 恢复上次的开关状态
  try {
    var s = localStorage.getItem('tarot_sound');
    if (s === '0') enabled = false;
  } catch (e) {}
})();
