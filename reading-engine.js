// 组合解读引擎
// 核心思路：每张牌不是"一句话"，而是带能量值、性质、领域的数据。
// 三张牌 + 问题主题 → 算出一个真正的"局面"，再组织成读得懂的话。
//
// 输出的四段：
//   1. opening  局面基调（由能量总和决定）
//   2. flow     因果链（用位置语义把三张牌串成一句话）
//   3. tension  牌与牌之间的呼应或矛盾
//   4. landing  落到具体问题上的结论

(function () {

  // ===== 每张牌的内在属性 =====
  // energy: -2 崩塌 / -1 消解 / 0 平衡 / +1 推进 / +2 强推
  // nature: 这张牌在做什么事
  // realm:  主要作用在哪个层面
  var TRAITS = {
    0:  { energy: 1,  nature: '开启', realm: '外在', label: '纵身的一跃' },
    1:  { energy: 1,  nature: '动手', realm: '外在', label: '把想法变成实物' },
    2:  { energy: 0,  nature: '内省', realm: '内在', label: '心里那个声音' },
    3:  { energy: 1,  nature: '滋养', realm: '关系', label: '把力气用在照顾上' },
    4:  { energy: 1,  nature: '掌控', realm: '外在', label: '扛起该扛的' },
    5:  { energy: 0,  nature: '循规', realm: '关系', label: '按别人走过的路走' },
    6:  { energy: 0,  nature: '取舍', realm: '关系', label: '两条路只能走一条' },
    7:  { energy: 2,  nature: '冲刺', realm: '外在', label: '油门踩到底' },
    8:  { energy: 0,  nature: '忍耐', realm: '内在', label: '跟什么较着劲' },
    9:  { energy: -1, nature: '退守', realm: '内在', label: '从人群里退出来' },
    10: { energy: 0,  nature: '流转', realm: '外在', label: '局面自己在动' },
    11: { energy: 0,  nature: '清算', realm: '关系', label: '该算的账' },
    12: { energy: -1, nature: '悬停', realm: '内在', label: '卡在半空' },
    13: { energy: -1, nature: '终结', realm: '外在', label: '有东西正在结束' },
    14: { energy: 0,  nature: '调和', realm: '内在', label: '找中间那条线' },
    15: { energy: -1, nature: '纠缠', realm: '内在', label: '被什么拖住' },
    16: { energy: -2, nature: '崩塌', realm: '外在', label: '本来就不稳的在塌' },
    17: { energy: 1,  nature: '疗愈', realm: '内在', label: '最坏的过去了' },
    18: { energy: -1, nature: '迷雾', realm: '内在', label: '看不清，也在吓自己' },
    19: { energy: 2,  nature: '明朗', realm: '外在', label: '这段时间是被祝福的' },
    20: { energy: 0,  nature: '唤醒', realm: '内在', label: '旧事在叫你回去' },
    21: { energy: 1,  nature: '完成', realm: '外在', label: '一件完整的事做完了' }
  };

  // ===== 特殊牌对：当两张同时出现时，有额外的读法 =====
  var PAIRS = [
    { a: 16, b: 17, text: '崩塌的那部分和星星同时在场，这是最经典的一组——塌完之后才看得见光。现在难受是真的，但方向没错。' },
    { a: 13, b: 21, text: '死神和世界一起出现，说明这次结束不是烂尾，是真正的收尾。结束了，才算完整。' },
    { a: 19, b: 18, text: '太阳和月亮同时在场，明暗交替。你现在可能正好在明暗交界那一刻，别急着判断整体是好是坏。' },
    { a: 15, b: 17, text: '恶魔和星星凑在一起，意味着一件拖了你很久的事，现在有松动的可能。锁链可能是松的。' },
    { a: 12, b: 10, text: '倒吊人和命运之轮，一边卡住一边在转。你动不了，但外面的局面已经在变了。' },
    { a: 0, b: 7, text: '愚者加战车，冲劲翻倍。好的一面是推得动，坏的一面是方向可能还没对就已经上路了。' },
    { a: 9, b: 3, text: '隐者与女皇，一个往里收一个往外给。你大概正在"想照顾别人"和"想一个人待着"之间拉扯。' },
    { a: 2, b: 18, text: '女祭司和月亮，直觉很敏锐，但也容易被自己的猜疑带偏。这时候的判断要打个折扣。' },
    { a: 4, b: 8, text: '皇帝和力量，都是"扛"的牌。你承担的比你以为的多，但一直硬扛会累垮。' },
    { a: 20, b: 13, text: '审判和死神，旧事收尾、清算完成。这次是真的要翻篇了，不是又一次回到原点。' },
    { a: 1, b: 17, text: '魔术师和星星，一个动手一个疗伤。你现在有能力做事，但别把"做事"当成逃避难受的方式。' },
    { a: 6, b: 11, text: '恋人和正义，选择和公平。你在这件事里既想要个说法，又得做个决定，这两件事得分开做。' },
    { a: 5, b: 0, text: '教皇和愚者是个矛盾组合：一边要你按规矩来，一边要你跳出去。你可能正被这两股力扯着。' },
    { a: 14, b: 7, text: '节制和战车，一个要稳一个要冲。节奏怎么拿捏，是这次的关键。' },
    { a: 21, b: 0, text: '世界和愚者首尾相接，一个循环刚结束，下一个马上开始。你会想立刻找下一个目标，但先停一下。' },
    { a: 3, b: 15, text: '女皇和恶魔，照顾和控制挨得很近。留意一下自己给出的关心，是不是也想换点什么回来。' },
    { a: 11, b: 20, text: '正义和审判，两把秤一起出现。这件事会被摊开来看，包括你自己不想看的那部分。' },
    { a: 8, b: 16, text: '力量和塔，一个在忍一个在塌。忍着的东西，可能就是在等这一下。' },
    { a: 10, b: 14, text: '命运之轮和节制，局面在变，而你需要保持节奏。别被变化带着跑。' },
    { a: 2, b: 9, text: '女祭司和隐者，双重内省。你现在需要的不是建议，是安静和时间。' }
  ];

  // ===== 位置语义 =====
  var POS_MEANING = [
    { key: 'past',    lead: '这件事的根，' },
    { key: 'present', lead: '你现在的位置，' },
    { key: 'future',  lead: '往下走的趋势，' }
  ];

  // ===== 落点语：每个主题多句，按未来牌的 id 轮着取，保证每次都不同 =====
  var TOPIC_LANDING = {
    '感情': [
      '感情里最难的往往不是判断对方，是承认自己那一半。',
      '这段关系值不值得，答案在你身上的反应里，不在对方的态度里。',
      '喜欢这件事不需要理由，但走下去需要方法。',
      '先问自己舒不舒服，再问对方爱不爱你。',
      '你在意的到底是这个人，还是"有个人"这件事。'
    ],
    '工作': [
      '把「我值多少」和「这件事值多少」分开算。',
      '这份工作给你的东西，值得你继续投入多少，是能算清楚的。',
      '职场上的忍耐都是有价的，先想清楚你的价格。',
      '你在这份工作上花的力气，是不是用在了会被看见的地方。',
      '值不值得留，看它有没有让你长本事，不只是看待遇。'
    ],
    '选择': [
      '两个选项都说得通时，比的不是哪个更好，是你更愿意为哪个负责。',
      '选择难，通常是因为两个都舍不得。那就比"丢了哪个更后悔"。',
      '没有完美的选项，只有你愿意承担的那个。',
      '先想清楚最坏的结果，再看自己受不受得了。',
      '选错了可以改，一直不选才真的没有回头路。'
    ],
    '人际': [
      '不是所有裂缝都需要补，有些只需要保持距离。',
      '关系里最贵的不是分开，是明明想分开却一直凑合。',
      '该说的说清楚，比一直让着更长久。'
    ],
    '自我': [
      '关于自己的问题，通常不是想不明白，是不敢承认。',
      '你不是不够好，是给自己的标准太高了。',
      '先照顾好自己，再谈成为更好的自己。'
    ],
    '钱': [
      '钱的事，先算清楚数字，再谈感受。',
      '所有"感觉还行"的判断，都不如一张写清楚的账单。',
      '钱上的决定要看最坏的情况，不是最好的情况。'
    ],
    '综合': [
      '这件事眼下没有明显方向，也不算坏。没被哪个念头绑死，反而还有空间。',
      '信息还不够的时候，先不急着下结论。',
      '现在说不清，那就先过着，答案会自己浮出来。'
    ]
  };

  // ---- 工具 ----
  function energyOf(item) {
    if (!item || !item.card) return 0;
    var t = TRAITS[item.card.id];
    if (!t) return 0;
    var e = t.energy;
    // 逆位：推进变阻力，消解变加速
    if (item.reversed) {
      if (e > 0) e = -Math.ceil(e * 0.7);
      else if (e < 0) e = -e * 0.6;
    }
    return e;
  }

  function findPair(drawn) {
    var ids = [];
    for (var i = 0; i < drawn.length; i++) {
      if (drawn[i] && drawn[i].card) ids.push({ id: drawn[i].card.id, rev: drawn[i].reversed });
    }
    for (var p = 0; p < PAIRS.length; p++) {
      var pair = PAIRS[p];
      var hasA = null, hasB = null;
      for (var k = 0; k < ids.length; k++) {
        if (ids[k].id === pair.a) hasA = ids[k];
        if (ids[k].id === pair.b) hasB = ids[k];
      }
      if (hasA && hasB) return { pair: pair, a: hasA, b: hasB };
    }
    return null;
  }

  // ===== 建议生成 =====
  // 三层：类别专属 > 通用 > 按"性质"兜底，每层都优先取没重复的
  function buildAdvice(drawn, totalEnergy, revCount, pairHit, topicName, topicSub) {
    var VOICE = window.TAROT_VOICE || {};
    var ALLTV = window.TOPIC_VOICE || {};
    var TV = (topicSub && ALLTV[topicName + '·' + topicSub]) ? ALLTV[topicName + '·' + topicSub]
             : (ALLTV[topicName] || {});
    var items = [];
    var used = {};
    function push(s) {
      if (!s || used[s]) return false;
      used[s] = 1; items.push(s); return true;
    }

    // 按"性质"给的兜底建议（覆盖同一主题反复抽到不同牌的情况）
    var NATURE_ADVICE = {
      '开启': '别等完全准备好。这种事永远没有完全准备好的时候。',
      '动手': '先做出一个能用的版本，别在细节上耗。',
      '内省': '先别问别人，问自己那第一反应就够。',
      '滋养': '先照顾自己一次，你太久没这么做了。',
      '掌控': '该你拍板的时候到了，别再把决定推给别人。',
      '循规': '照规矩来一次不丢人，但别把它当唯一解。',
      '取舍': '列两个选项，各写三条"我要为此承担什么"。',
      '冲刺': '先确认方向，再加速。方向错了跑得越快越远。',
      '忍耐': '忍可以，但要给自己一个期限。',
      '退守': '退一步不是输，是留着力气做别的。',
      '流转': '顺势而为，但先定一条不动的底线。',
      '清算': '该算的账算清楚，别让它在心里烂着。',
      '悬停': '这段时间不必有进展。等也是种行动。',
      '终结': '结束就要结束得干净，拖着的尾巴最耗人。',
      '调和': '别走极端，找个能持续的节奏。',
      '纠缠': '先认出是什么在绑着你，再谈要不要挣脱。',
      '崩塌': '如果它在塌，别救。塌完再建比一直补快。',
      '疗愈': '这段把睡好、吃好排在所有事前面。',
      '迷雾': '重要的事等想清楚了再说，别在情绪里定。',
      '明朗': '趁顺的时候把该做的事做了。',
      '唤醒': '有句话一直没说，这次说完它。',
      '完成': '先承认这件事做完了，再看下一步。'
    };

    // 1) 当下牌：类别专属 > 通用 > 性质兜底
    var nowId = drawn[1].card.id;
    var nowNature = (TRAITS[nowId] || {}).nature || '';
    push((TV[nowId] && TV[nowId].advice) ||
         (VOICE[nowId] && VOICE[nowId].advice) ||
         NATURE_ADVICE[nowNature]);

    // 2) 趋势牌：同上
    var futId = drawn[2].card.id;
    var futNature = (TRAITS[futId] || {}).nature || '';
    push((TV[futId] && TV[futId].advice) ||
         (VOICE[futId] && VOICE[futId].advice) ||
         NATURE_ADVICE[futNature]);

    // 3) 根源牌
    if (items.length < 3) {
      var pastId = drawn[0].card.id;
      var pastNature = (TRAITS[pastId] || {}).nature || '';
      push((TV[pastId] && TV[pastId].advice) ||
           (VOICE[pastId] && VOICE[pastId].advice) ||
           NATURE_ADVICE[pastNature]);
    }

    // 4) 还缺就按能量补
    if (items.length < 3) {
      var tonePool;
      if (totalEnergy >= 3) tonePool = ['趁这股劲在，挑最重要的一件先做。', '现在推得动，别浪费这段。'];
      else if (totalEnergy >= 1) tonePool = ['走两步看反应，别一口气全押。', '先做出来，再调整。', '不用想周全，先有个开头。'];
      else if (totalEnergy === 0) tonePool = ['现在适合整理，不适合推进。', '把手上的事收一收，比再开新的强。'];
      else if (totalEnergy >= -2) tonePool = ['这几天先别做重大决定。', '等局面回稳一点，判断会准很多。', '现在最该做的是不动，不是硬撑。'];
      else tonePool = ['先止损。', '现在不是翻盘的时候，是别再往下掉的时候。'];
      push(tonePool[drawn[0].card.id % tonePool.length]);
    }

    // 5) 逆位多时补一句
    if (items.length < 3 && revCount >= 2) {
      push('逆位多的时候，外部条件往往是够的。你缺的是承认自己已经做了选择。');
    }

    return items.slice(0, 3);
  }

  // ---- 主函数 ----
  function buildCombinedReading(drawn, question, topicName, topicSub) {
    if (!drawn || drawn.length < 3) return null;
    var valid = drawn.filter(function (d) { return d && d.card; });
    if (valid.length < 3) return null;

    // 1) 能量总和 → 局面基调
    var totalEnergy = 0;
    var revCount = 0;
    for (var i = 0; i < 3; i++) {
      totalEnergy += energyOf(drawn[i]);
      if (drawn[i].reversed) revCount++;
    }

    // 开头：以"当下"这张牌为核心，每张牌有自己的说法
    var VOICE = window.TAROT_VOICE || {};
    var nowItem = drawn[1];
    var nowVoice = VOICE[nowItem.card.id];
    var opening;

    if (nowVoice && nowVoice.inNow) {
      // 有专属说法就用专属的，再补一句能量基调
      var toneTail;
      if (totalEnergy >= 3) toneTail = '整体上局面是活的。';
      else if (totalEnergy >= 1) toneTail = '整体在往前，但不算轻松。';
      else if (totalEnergy === 0) toneTail = '一进一退，现在还没定。';
      else if (totalEnergy >= -2) toneTail = '这时候不适合硬推。';
      else toneTail = '先稳住，别急着扭转。';
      // 再叠一句"现在这事卡在哪一层"，让同一张牌在不同组合里不同
      var nowRealm = (TRAITS[nowItem.card.id] || {}).realm || '';
      var otherRealms = (TRAITS[drawn[0].card.id] || {}).realm + '/' + (TRAITS[drawn[2].card.id] || {}).realm;
      var realmNote = '';
      if (nowRealm && otherRealms.indexOf(nowRealm) < 0) {
        realmNote = ' 根和趋势都在另一头，现在这个坎是中间多出来的。';
      } else if (nowRealm === '内在') {
        realmNote = ' 这一层是心里的事，外面看不出来。';
      } else if (nowRealm === '关系') {
        realmNote = ' 这一层牵扯到别人，不是一个人能定的。';
      } else if (nowRealm === '外在') {
        realmNote = ' 这一层是实打实的条件问题。';
      }
      opening = nowVoice.inNow + ' ' + toneTail + realmNote;
    } else {
      if (totalEnergy >= 3) opening = '三张牌的能量都往外推。这个局面是活的，条件基本齐了，卡你的多半不是外面。';
      else if (totalEnergy >= 1) opening = '整体是往前走的，但走得不算轻松。有推得动的部分，也有拖着你的部分。';
      else if (totalEnergy === 0) opening = '一进一退，刚好抵平。现在的状态是悬着的——不是坏，是还没定。';
      else if (totalEnergy >= -2) opening = '局面的重心在往回拉。这不是说你做错了什么，是这段时间本来就不适合硬推。';
      else opening = '三张牌的能量都在往下走。这种时候最重要的不是扭转，是先稳住。';
    }

    // 2) 因果链：把三张牌按位置串起来
    // 因果链：每张牌按它在的位置说话
    var FLD = ['inPast', 'inNow', 'inFuture'];
    var flowParts = [];
    for (var j = 0; j < 3; j++) {
      var item = drawn[j];
      var v = VOICE[item.card.id];
      var side = item.reversed ? '逆位' : '正位';
      var body;
      // 第二张（当下）：opening 已经说过它的 inNow，这里用"它在起什么作用"的角度
      if (j === 1) {
        var tr = TRAITS[item.card.id] || {};
        var nat = tr.nature || '';
        var realm = tr.realm || '';
        var midMap = {
          '外在': '外面的', '内在': '你自己心里的', '关系': '你和别人之间的'
        };
        if (nat && realm) {
          body = '眼下卡住的，是' + (midMap[realm] || realm) + '那一块。';
        } else if (v && v.inNow) {
          body = v.inNow;
        } else {
          body = '它就是当下这个局面本身。';
        }
      } else if (v && v[FLD[j]]) {
        body = v[FLD[j]];
      } else {
        var trait = TRAITS[item.card.id] || { label: item.card.name };
        body = '它在做的是：' + trait.label + '。';
      }
      flowParts.push(item.card.name + side + '：' + body);
    }
    var flow = flowParts.join(' ');
    // 逆位注释只加一次，放在整段末尾
    if (revCount > 0) {
      flow += ' （逆位的部分，读法是"卡在这儿"，不是"正在发生"。）';
    }

    // 3) 牌间关系
    var tension = '';
    var pairHit = findPair(drawn);
    if (pairHit) {
      tension = '这两张摆在一起有话说——' + pairHit.pair.text;
    } else {
      // 用三张牌的"性质"组合出具体说法，比只看层面细得多
      var n0 = (TRAITS[drawn[0].card.id] || {}).nature || '';
      var n1 = (TRAITS[drawn[1].card.id] || {}).nature || '';
      var n2 = (TRAITS[drawn[2].card.id] || {}).nature || '';
      var g = function (n) {
        if (['终结', '崩塌', '纠缠', '迷雾'].indexOf(n) >= 0) return 'down';
        if (['开启', '动手', '冲刺', '明朗', '完成', '疗愈'].indexOf(n) >= 0) return 'up';
        return 'still';
      };
      var gp = g(n0), gf = g(n2);
      var key = gp + '-' + gf;
      var POOL = {
        'down-up': ['先破后立。倒下的那部分清完，新的才站得住。',
                    '这组是"熬过去"的形状，现在难，但难在往好的方向走。'],
        'up-up': ['一路往上，没有明显的坎。这时候最容易的问题是走太快没看路。',
                  '三张同向推进，说明这件事本身顺，卡你的是要不要下决心。'],
        'up-down': ['开头顺，后面会撞墙。别把前期的顺利当成全程都这样。',
                    '这组形状是"起高走低"。趁现在还在高处，把该锁的先锁住。'],
        'down-down': ['一路往下，没有反转。这时候争的不是赢，是少输。',
                      '这个形状说明事情还在往下走，先别急着止跌。'],
        'still-up': ['一直悬着，往下才动起来。等的那段时间不是白等。',
                     '前面拖了很久，现在终于有推力了。'],
        'up-still': ['先推了一阵，然后卡住。你要找的是那个卡点在哪。',
                     '这个形状是"开了头没接上"。问题不在开头，在中间。'],
        'down-still': ['先落了，然后停住。停住说明还没有到最底。',
                       '已经消解过一轮，现在是缓冲期。'],
        'still-down': ['一直没定，往下才开始动。等着看的东西，已经给出答案了。',
                       '悬着的东西要落下来了，只是不是你选的方式。'],
        'still-still': ['三张都不动。这种局面里，做什么都会觉得没变化。',
                        '整体是静止的。这时候不需要行动，需要等。']
      };
      var pool = POOL[key] || ['三张牌连起来是一条线，不太有反转，说明局面还算稳定。'];
      tension = pool[drawn[0].card.id % pool.length];

      // 中间那张的处境单独补一句
      if (n1 === '内省' || n1 === '退守') {
        tension += ' 中间那张落在心里，说明外面的事不是关键，你怎么想才是。';
      } else if (n1 === '取舍' || n1 === '调和') {
        tension += ' 中间那张是"选"的位置，这个坎绕不开一个决定。';
      } else if (n1 === '忍耐' || n1 === '悬停') {
        tension += ' 中间那张是停着的，你现在动不了，也不该硬动。';
      }

      if (revCount >= 2) {
        tension += ' 逆位偏多，阻力来自内部的判断。';
      } else if (revCount === 0) {
        tension += ' 三张全正位，条件齐了，差的是你迈不迈。';
      }
    }

    // 4) 落到问题：主句按"未来"牌的性质挑，避免同一主题总是同一句
    var landPool2 = TOPIC_LANDING[topicName] || TOPIC_LANDING['综合'];
    var landBase = landPool2[drawn[2].card.id % landPool2.length];
    var futTrait = TRAITS[drawn[2].card.id] || {};
    var landLead = '';
    switch (futTrait.nature) {
      case '终结': landLead = '结论很清楚：有些东西必须先结束，才能有下一步。'; break;
      case '崩塌': landLead = '这件事可能要推翻重来，别急着修补。'; break;
      case '疗愈': landLead = '方向是好的，只是需要时间养。'; break;
      case '完成': landLead = '这一轮快走到头了，重点是收尾而不是开新局。'; break;
      case '内省': case '退守': landLead = '答案不在外面，在你自己身上。'; break;
      case '冲刺': case '动手': landLead = '别再想了，动手比想清楚重要。'; break;
      case '取舍': case '调和': landLead = '中间那条路是存在的，别非黑即白。'; break;
      case '明朗': landLead = '现在条件不错，趁热做决定。'; break;
      case '迷雾': landLead = '现在看不清是正常的，别急着定论。'; break;
      case '悬停': landLead = '暂时动不了，那就先不动。'; break;
      default: landLead = landBase;
    }
    // 开头和主题句只取一个（避免同源重复），结尾换成"动作方向"
    var landing;
    if (landLead && landLead !== landBase) {
      landing = landLead + ' ' + landBase;
    } else {
      landing = landBase;
    }
    if (question) {
      landing = '回到你问的「' + question + '」：' + landing;
    }
    // 附一句方向建议，按总能量给
    var landPool;
    if (totalEnergy >= 2) {
      landPool = ['这回可以主动一点。', '时机在你这边。'];
    } else if (totalEnergy >= 0) {
      landPool = ['先从小处试。', '定个小期限，到点就做。'];
    } else {
      landPool = ['先别急着动。', '等这一段过去。'];
    }
    // 只有落点还不够长时才补
    if (landing.length < 70) {
      landing += ' ' + landPool[Math.floor(Math.random() * landPool.length)];
    }

    var advice = buildAdvice(drawn, totalEnergy, revCount, pairHit, topicName, topicSub);

    return {
      opening: opening,
      flow: flow,
      tension: tension,
      landing: landing,
      advice: advice,
      meta: { totalEnergy: totalEnergy, revCount: revCount, hasPair: !!pairHit }
    };
  }

  window.buildCombinedReading = buildCombinedReading;
  window.TAROT_TRAITS = TRAITS;
})();
