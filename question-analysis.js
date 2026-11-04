// 问题分析 —— 按关键词归类，再结合牌面给出针对性解读
// 不联网、不调接口，纯本地判断

var TOPICS = [
  {
    id: 'love',
    name: '感情',
    words: ['喜欢', '爱', '恋爱', '对象', '他', '她', '分手', '复合', '告白',
            '暗恋', '在一起', '暧昧', '男', '女', '伴侣', '结婚', '心动', '拒绝',
            '前男友', '前女友', '女友', '男友', '感情'],
    focus: '感情里最难的往往不是对方怎么想，是你自己想要什么又不敢认。',
    adviceTail: '感情这种事，先把自己那一半想清楚，再去猜对方那一半。'
  },
  {
    id: 'work',
    name: '工作',
    words: ['工作', '上班', '公司', '领导', '老板', '同事', '辞职', '跳槽',
            '涨薪', '加薪', '面试', '入职', '离职', '裁员', '项目', '业绩',
            '职场', 'offer', '实习', '转正', '加班', '客户', '创业', '赚钱'],
    focus: '这类事的焦虑通常来自「不确定自己值多少」，而不是具体那件事。',
    adviceTail: '先问自己：三个月后我想在这件事上看到什么变化。答案会帮你筛掉很多杂音。'
  },
  {
    id: 'direction',
    name: '人生方向',
    words: ['梦想', '理想', '人生的意义', '值得吗', '值不值得', '放弃这个',
            '坚持下去', '追求', '一事无成', '白活', '这辈子',
            '到底想要什么', '该不该继续', '是否值得', '初心', '热情'],
    focus: '你在问的不是一件事要不要做，是这条路值不值得你继续走。',
    adviceTail: '这类问题没有标准答案，但有一件事很清楚：问出这个问题，说明你还没真的放弃。'
  },
  {
    id: 'choice',
    name: '选择',
    words: ['选择', '选', '要不要', '该不该', '还是', '哪个', '二选一',
            '犹豫', '决定', '纠结', '去不去', '做不做', '哪个好', '选哪',
            '两个', '哪条路', '要不要去', '要不要做'],
    focus: '你在等一个「绝对正确」的答案，但那种答案通常不存在。',
    adviceTail: '与其找对的那条，不如选一条走下去、把它走对。'
  },
  {
    id: 'people',
    name: '人际',
    words: ['朋友', '关系', '吵架', '误会', '家人', '父母', '妈', '爸', '兄弟',
            '姐妹', '同学', '室友', '社交', '道歉', '和解', '矛盾', '闹翻', '相处'],
    focus: '这类事最消耗的不是解决它，是反复想它。',
    adviceTail: '有些关系不需要非得修好，保持距离也是一种处理方式。'
  },
  {
    id: 'self',
    name: '自我',
    words: ['自己', '人生', '意义', '方向', '迷茫', '焦虑', '累', '撑不住',
            '价值', '未来', '目标', '状态', '情绪', '抑郁', '难过', '改变', '习惯',
            '睡', '失眠', '睡不好', '睡不着', '身体', '健康', '疲惫', '烦躁',
            '压力', '崩溃', '慌', '不安', '孤独', '空虚', '迷茫'],
    focus: '能问出这个问题，说明你已经在往外看了。',
    adviceTail: '不用一次想通所有事，先把眼前这一周过明白。'
  },
  {
    id: 'money',
    name: '钱',
    words: ['钱', '财富', '存钱', '花', '投资', '理财', '负债', '欠',
            '借', '借钱', '还钱', '还债', '买', '房', '车', '工资', '收入', '支出',
            '债', '贷款', '分期', '利息', '亏', '赚', '股票', '基金'],
    focus: '钱的事背后通常是一个安全感的问题。',
    adviceTail: '先把数字算清楚。很多焦虑在算完之后会小一半。',
    // 细分：借钱给人 vs 自己投资
    sub: function (q) {
      var lend = ['借', '要借', '借给', '借出', '还钱', '还债', '欠'];
      var invest = ['投资', '理财', '股票', '基金', '买', '赚', '买入', '加仓'];
      var lc = 0, ic = 0;
      for (var i = 0; i < lend.length; i++) if (q.indexOf(lend[i]) >= 0) lc++;
      for (var j = 0; j < invest.length; j++) if (q.indexOf(invest[j]) >= 0) ic++;
      if (lc > ic) return 'lend';
      if (ic > lc) return 'invest';
      return '';
    }
  }
];

// 通用兜底：没命中任何关键词时用
var GENERIC = {
  id: 'general',
  name: '综合',
  focus: '眼下还没有特别明显的方向。这不是坏事，说明还没被哪一个念头绑死。',
  adviceTail: '把这个问题拆小一点：今天能做的第一步是什么。想不出就不动，等一等也不亏。'
};

// 判断问题属于哪一类
function detectTopic(question) {
  if (!question) return null;
  var q = String(question);
  var best = null;
  var bestScore = 0;
  for (var i = 0; i < TOPICS.length; i++) {
    var t = TOPICS[i];
    var score = 0;
    for (var j = 0; j < t.words.length; j++) {
      if (q.indexOf(t.words[j]) >= 0) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  // 一个都没命中 → 用通用兜底
  return best || GENERIC;
}

// 结合三张牌给一段总述
function buildQuestionReading(question, drawn) {
  var topic = detectTopic(question);
  if (!question || !topic) return null;

  // 三张牌里逆位/正位的比例
  var upCount = 0, revCount = 0;
  for (var i = 0; i < drawn.length; i++) {
    if (!drawn[i]) continue;
    if (drawn[i].reversed) revCount++; else upCount++;
  }

  var tone;
  if (revCount === 3) {
    tone = '三张全是逆位。这件事现在卡得比较死，不是不能动，是时机或者心态还没到。';
  } else if (upCount === 3) {
    tone = '三张全是正位。局面是通的，真正需要你做的可能只是下决心。';
  } else if (revCount > upCount) {
    tone = '逆位偏多。阻力主要不在外面，在你自己的判断和取舍上。';
  } else if (upCount > revCount) {
    tone = '正位偏多。条件基本齐了，剩下的靠你推一把。';
  } else {
    tone = '正逆各半。这件事一半能靠你，另一半得等时机。';
  }

  // 有子分类时记录一下
  var sub = '';
  if (typeof topic.sub === 'function') {
    try { sub = topic.sub(question) || ''; } catch (e) { sub = ''; }
  }

  return {
    topic: topic.name,
    sub: sub,
    question: question,
    intro: '你问的是「' + question + '」，属于' + topic.name + '这一类。',
    focus: topic.focus,
    tone: tone,
    adviceTail: topic.adviceTail
  };
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TOPICS: TOPICS, GENERIC: GENERIC, detectTopic: detectTopic, buildQuestionReading: buildQuestionReading };
}
if (typeof window !== 'undefined') {
  window.__QA__ = { TOPICS: TOPICS, GENERIC: GENERIC, detectTopic: detectTopic, buildQuestionReading: buildQuestionReading };
}
