// 分享 —— 把当前三张牌渲染成一张图，方便存下来或发出去
// 用 canvas 直接画，不依赖 html2canvas 之类的外部库

(function () {
  var W = 750;
  var H = 1180;   // 初始高度，最后会按内容裁掉多余空白

  function loadImg(src) {
    return new Promise(function (resolve) {
      var im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = function () { resolve(im); };
      im.onerror = function () { resolve(null); };
      im.src = src;
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapText(ctx, text, maxWidth) {
    var lines = [];
    var line = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ctx.measureText(line + ch).width > maxWidth) {
        lines.push(line);
        line = ch;
      } else {
        line += ch;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  // 主函数：drawn 是 [{card, reversed}], question 是问题
  async function makeShareImage(drawn, question, summaryText) {
    var cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    var ctx = cv.getContext('2d');

    // 背景：深紫渐变
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1a1430');
    bg.addColorStop(0.5, '#120d22');
    bg.addColorStop(1, '#0a0714');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 顶部星点
    for (var i = 0; i < 90; i++) {
      var sx = Math.random() * W;
      var sy = Math.random() * H * 0.55;
      var sr = Math.random() * 1.6 + 0.3;
      ctx.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.5 + 0.14) + ')';
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // 标题
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8d9a8';
    ctx.font = '300 46px "PingFang SC", "Microsoft YaHei", serif';
    ctx.fillText('今 日 运 势', W / 2, 108);

    // 分隔线
    var lg = ctx.createLinearGradient(W * 0.25, 0, W * 0.75, 0);
    lg.addColorStop(0, 'rgba(201,162,39,0)');
    lg.addColorStop(0.5, 'rgba(201,162,39,.65)');
    lg.addColorStop(1, 'rgba(201,162,39,0)');
    ctx.strokeStyle = lg;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(W * 0.25, 136);
    ctx.lineTo(W * 0.75, 136);
    ctx.stroke();

    // 问题
    if (question) {
      ctx.fillStyle = '#8a7db0';
      ctx.font = '24px "PingFang SC", "Microsoft YaHei", serif';
      ctx.fillText('「' + question + '」', W / 2, 182);
    }

    // 三张牌
    var cardW = 168;
    var cardH = 280;
    var gap = 26;
    var totalW = cardW * 3 + gap * 2;
    var startX = (W - totalW) / 2;
    var cardY = 228;

    for (var k = 0; k < 3 && k < drawn.length; k++) {
      var item = drawn[k];
      if (!item || !item.card) continue;
      var x = startX + k * (cardW + gap);

      // 金色外框
      var fg = ctx.createLinearGradient(x, cardY, x + cardW, cardY + cardH);
      if (item.reversed) {
        fg.addColorStop(0, '#5a2028');
        fg.addColorStop(0.5, '#c07a80');
        fg.addColorStop(1, '#4a1a22');
      } else {
        fg.addColorStop(0, '#6b5315');
        fg.addColorStop(0.5, '#e6cc72');
        fg.addColorStop(1, '#6b5315');
      }
      ctx.fillStyle = fg;
      roundRect(ctx, x, cardY, cardW, cardH, 10);
      ctx.fill();

      // 牌面
      var inner = 4;
      ctx.save();
      roundRect(ctx, x + inner, cardY + inner, cardW - inner * 2, cardH - inner * 2, 8);
      ctx.clip();

      var img = await loadImg('art/' + item.card.id + '.webp');
      if (img) {
        // 铺满裁切
        var ir = img.width / img.height;
        var cr = (cardW - inner * 2) / (cardH - inner * 2);
        var dw, dh, dx, dy;
        if (ir > cr) {
          dh = cardH - inner * 2;
          dw = dh * ir;
          dx = x + inner - (dw - (cardW - inner * 2)) / 2;
          dy = cardY + inner;
        } else {
          dw = cardW - inner * 2;
          dh = dw / ir;
          dx = x + inner;
          dy = cardY + inner - (dh - (cardH - inner * 2)) / 2;
        }
        ctx.drawImage(img, dx, dy, dw, dh);
      }

      // 底部渐变压暗
      var dg = ctx.createLinearGradient(0, cardY + cardH * 0.55, 0, cardY + cardH);
      dg.addColorStop(0, 'rgba(8,5,18,0)');
      dg.addColorStop(1, 'rgba(8,5,18,.94)');
      ctx.fillStyle = dg;
      ctx.fillRect(x + inner, cardY + inner, cardW - inner * 2, cardH - inner * 2);
      ctx.restore();

      // 牌名
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f7ecc0';
      ctx.font = '300 26px "PingFang SC", "Microsoft YaHei", serif';
      ctx.fillText(item.card.name, x + cardW / 2, cardY + cardH - 46);

      // 正逆位
      ctx.fillStyle = item.reversed ? '#d0808a' : '#c9a227';
      ctx.font = '18px "PingFang SC", "Microsoft YaHei", serif';
      ctx.fillText(item.reversed ? '逆 位' : '正 位', x + cardW / 2, cardY + cardH - 18);
    }

    // 综合解读文字
    var textY = cardY + cardH + 52;
    if (summaryText) {
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(30,24,52,.9)';
      roundRect(ctx, 48, textY - 34, W - 96, 210, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(201,162,39,.28)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#c9a227';
      ctx.font = '22px "PingFang SC", "Microsoft YaHei", serif';
      ctx.fillText('综合解读', 72, textY);

      ctx.fillStyle = '#a89cc4';
      ctx.font = '21px "PingFang SC", "Microsoft YaHei", serif';
      ctx.textAlign = 'left';
      var lines = wrapText(ctx, summaryText, W - 144);
      var ly = textY + 38;
      for (var n = 0; n < lines.length && n < 6; n++) {
        ctx.fillText(lines[n], 72, ly);
        ly += 34;
      }
    }

    // 底部签名
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3a3358';
    ctx.font = '17px "PingFang SC", "Microsoft YaHei", serif';
    var signY = (summaryText ? textY + 240 : cardY + cardH + 70);
    ctx.fillText('今日运势 · 塔罗三牌阵', W / 2, signY);

    // 按内容裁剪：留 40px 余量
    var finalH = Math.min(H, Math.ceil(signY + 40));
    var out = document.createElement('canvas');
    out.width = W;
    out.height = finalH;
    out.getContext('2d').drawImage(cv, 0, 0, W, finalH, 0, 0, W, finalH);
    return out.toDataURL('image/png');
  }

  window.makeShareImage = makeShareImage;
})();
