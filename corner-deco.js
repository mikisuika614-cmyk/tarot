// 角花 —— 四个角各一层金色装饰
// 每个角用同一份 SVG，靠 CSS transform 镜像旋转出四个方向

(function () {
  // 基准图：左上角的卷叶纹。其余三个角靠镜像得到
  var SVG = [
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">',
    '<defs>',
    '<linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">',
    '<stop offset="0%" stop-color="#f7e6a8"/>',
    '<stop offset="50%" stop-color="#d4af37"/>',
    '<stop offset="100%" stop-color="#8a6d1f"/>',
    '</linearGradient>',
    '</defs>',
    '<g fill="none" stroke="url(#cg)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
    // 外框弧线（贴着卡的角）
    '<path d="M1 1 L1 40 Q1 1 40 1" stroke-width="2.6"/>',
    // 内弧
    '<path d="M8 8 L8 30 Q8 8 30 8" stroke-width="1.2" opacity="0.8"/>',
    // 主卷叶
    '<path d="M12 12 Q26 10 30 24 Q18 28 12 12 Z" fill="url(#cg)" opacity="0.55" stroke-width="1.4"/>',
    // 副卷叶（反方向）
    '<path d="M12 12 Q10 26 24 30 Q28 18 12 12 Z" fill="url(#cg)" opacity="0.4" stroke-width="1.4"/>',
    // 中心小花
    '<circle cx="19" cy="19" r="3.2" fill="url(#cg)" stroke="none"/>',
    '<circle cx="19" cy="19" r="5.6" stroke-width="1" opacity="0.7"/>',
    // 向外延伸的细枝
    '<path d="M1 46 Q6 46 6 52" stroke-width="1" opacity="0.7"/>',
    '<path d="M46 1 Q46 6 52 6" stroke-width="1" opacity="0.7"/>',
    // 小圆点装饰
    '<circle cx="3.5" cy="56" r="1.4" fill="url(#cg)" stroke="none"/>',
    '<circle cx="56" cy="3.5" r="1.4" fill="url(#cg)" stroke="none"/>',
    '</g>',
    '</svg>'
  ].join('');

  function applyCorners(root) {
    root = root || document;
    var arts = root.querySelectorAll('.card-art');
    for (var i = 0; i < arts.length; i++) {
      var art = arts[i];
      if (art.querySelector('.corner-deco')) continue;
      for (var k = 0; k < 4; k++) {
        var d = document.createElement('div');
        d.className = 'corner-deco c' + k;
        d.innerHTML = SVG;
        art.appendChild(d);
      }
    }
  }

  window.applyCornerDeco = applyCorners;
})();
