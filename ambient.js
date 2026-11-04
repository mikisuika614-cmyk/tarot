// 背景氛围音 —— 纯 Web Audio 合成，不加载任何文件
// 思路：几个低频正弦波叠在一起，加缓慢的音量呼吸，像坐在一个安静的房间里

(function () {
  var ctx = null;
  var nodes = [];
  var masterGain = null;
  var playing = false;
  var enabled = false;   // 默认关

  // 调性：A 小调的分解和弦，铺底
  // A2(110) E3(164.81) A3(220) C4(261.63) E4(329.63)
  var FREQS = [110, 164.81, 220, 261.63, 329.63];
  // 每层的音量，越高的越轻
  var VOLS = [0.16, 0.10, 0.07, 0.045, 0.03];

  function ac() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return null;
      }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function start() {
    if (playing) return;
    var c = ac();
    if (!c) return;

    masterGain = c.createGain();
    masterGain.gain.setValueAtTime(0, c.currentTime);
    // 淡入 3 秒，不吓人
    masterGain.gain.linearRampToValueAtTime(0.16, c.currentTime + 3);
    masterGain.connect(c.destination);

    nodes = [];
    for (var i = 0; i < FREQS.length; i++) {
      var f = FREQS[i];

      // 主音：正弦
      var osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      // 缓慢失谐，让声音有"活"的感觉
      osc.detune.value = (Math.random() - 0.5) * 8;

      var g = c.createGain();
      g.gain.value = VOLS[i];

      // 每层的音量呼吸，周期不同，合起来就不会整齐起伏
      var lfo = c.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.03 + Math.random() * 0.06;   // 16~33 秒一次
      var lfoGain = c.createGain();
      lfoGain.gain.value = VOLS[i] * 0.55;
      lfo.connect(lfoGain);
      lfoGain.connect(g.gain);

      osc.connect(g);
      g.connect(masterGain);
      osc.start();
      lfo.start();
      nodes.push(osc, lfo);
    }

    // 一层很轻的泛音，带一点"水晶"感
    var shimmer = c.createOscillator();
    shimmer.type = 'triangle';
    shimmer.frequency.value = 880;   // A5
    var sg = c.createGain();
    sg.gain.value = 0.006;
    var slfo = c.createOscillator();
    slfo.type = 'sine';
    slfo.frequency.value = 0.017;
    var slfoGain = c.createGain();
    slfoGain.gain.value = 0.005;
    slfo.connect(slfoGain);
    slfoGain.connect(sg.gain);
    shimmer.connect(sg);
    sg.connect(masterGain);
    shimmer.start();
    slfo.start();
    nodes.push(shimmer, slfo);

    playing = true;
  }

  function stop() {
    if (!playing) return;
    var c = ac();
    if (!c) return;
    var t = c.currentTime;
    // 淡出 1.2 秒
    if (masterGain) {
      try {
        masterGain.gain.cancelScheduledValues(t);
        masterGain.gain.setValueAtTime(masterGain.gain.value, t);
        masterGain.gain.linearRampToValueAtTime(0, t + 1.2);
      } catch (e) {}
    }
    var old = nodes.slice();
    var oldGain = masterGain;
    nodes = [];
    masterGain = null;
    playing = false;
    setTimeout(function () {
      for (var i = 0; i < old.length; i++) {
        try { old[i].stop(); } catch (e) {}
      }
      try { if (oldGain) oldGain.disconnect(); } catch (e) {}
    }, 1400);
  }

  window.AMBIENT = {
    isOn: function () { return enabled; },
    enable: function (v) {
      enabled = !!v;
      try { localStorage.setItem('tarot_ambient', enabled ? '1' : '0'); } catch (e) {}
      if (enabled) start(); else stop();
    },
    // 页面隐藏时暂停，回来再续，省电
    suspend: function () { if (playing) stop(); },
    resume: function () { if (enabled && !playing) start(); }
  };

  // 恢复上次开关
  try {
    if (localStorage.getItem('tarot_ambient') === '1') enabled = true;
  } catch (e) {}

  // 切到后台就停，回来再起
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (playing) stop();
    } else {
      if (enabled && !playing) start();
    }
  });
})();
