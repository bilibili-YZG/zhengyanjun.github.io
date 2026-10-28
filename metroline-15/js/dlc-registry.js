/* DLC注册表 - 管理所有可用的DLC
   每个DLC都在这里注册，包含基本信息和解锁条件 */
(function(){
'use strict';

// 全局DLC注册表
window.DLC_REGISTRY = [
  {
    id: 'unfinished_dream',
    name: '未竟之梦',
    subtitle: '深渊回响',
    description: '15号线急刹坠入冰洞：穿过四层冰洞与实验室，在混沌里面对最终的悖论。把初高中物理装进闯关里——边玩边学。',
    icon: '🌀',
    unlockCondition: {
      type: 'shards',
      required: 100,
      campaign: 'DEFAULT'
    },
    campaignId: 'CAMPAIGN_DLC', // 对应的战役变量名
    chapters: 3,
    levels: 12,
    features: ['地下冰洞：一关四层，自上而下', '实验室：高科技障碍物与小怪', '混沌领域：地形乱序 + 三阶段 Boss「悖论」', '蓝色碎片（DLC专属收集物）', '物理答题终端：答对才能开门', '力学 / 热学 / 电磁 / 光声 / 能量全面覆盖', '10+ 个新成就'],
    difficulty: '较高',
    estimatedTime: '2-3小时',
    version: '1.0',
    releaseDate: '2026-10',
    author: '15号线团队'
  }
  ,{
    id: 'subway_adventure',
    name: '地铁历险',
    subtitle: '末班车',
    description: '深夜的末班车弄丢了自己的站名。物理老师一节一节车厢往车头走，把散落的黄色水晶（站名）找回来，让列车重新报站，平安到家。4 章 12 关，全程都在行驶的列车上。',
    icon: '🚇',
    unlockCondition: { type: 'shards', required: 150, campaign: 'DEFAULT' },
    campaignId: 'CAMPAIGN_SUBWAY',
    chapters: 4,
    levels: 12,
    features: ['4 章 12 个长关：载客车厢 → 设备车厢 → 隧道区间 → 驶向车头', '每关 6 节车厢，整关带车顶，窗外风景飞速掠过（黄昏 / 夜色 / 隧道 / 黎明）', '12 种车厢：座椅可踩、货箱、配电间、结冰车厢、幽灵乘客、重力井……', '复用并混搭更多怪物：飞蜂、跳跳蛙、探测球、怨灵、幽灵、异常体……', '黄色水晶（DLC专属收集物）：集齐站名，列车才能报站'],
    difficulty: '中等偏上',
    estimatedTime: '40-60分钟',
    version: '0.2',
    releaseDate: '2026-10',
    author: '15号线团队'
  }
  ,{
    id: 'newyear_party',
    name: '雪镇跨年',
    subtitle: '四班 Forever',
    description: '元旦联欢会特别篇。雪镇的跨年夜，礼物被弄散了，大钟停在 11 点 59 分。老师穿过彩灯、气球和烟花，登上钟楼，面对不肯让今年结束的零点钟魔。两章各一关，章节之间是带动画的报幕环节，用来串起联欢会的每一个节目。',
    icon: '🎆',
    unlockCondition: { type: 'password', hash: 'ntpqy4', hint: '加入四班，向四班要口令' },
    campaignId: 'CAMPAIGN_NEWYEAR',
    chapters: 2,
    levels: 2,
    features: ['雪镇夜景：彩灯、气球、彩带、礼炮和烟花', '5 种喜庆小怪：雪团怪 · 气球怪 · 玩具鼓兵 · 烟花射手 · 杂耍小丑', '4 种新障碍：彩灯串 · 礼炮阵 · 气球串 · 彩带门；礼花筒可以把你弹上天', '礼物、蛋糕、仙女棒、彩糖等道具', 'Boss「零点钟魔」：三阶段，第三阶段有 5 秒倒数，数到 0 全场炸开', '章节之间是带动画的报幕环节：幕布拉开 · 雪镇 · 报幕 · 钟楼 · 钟魔登场 · 跨年烟花'],
    difficulty: '轻松',
    estimatedTime: '15-20分钟',
    version: '1.0',
    releaseDate: '2027-01',
    author: '四班'
  }
  // 未来可以添加更多DLC
  // {
  //   id: 'second_dlc',
  //   name: '第二个DLC',
  //   ...
  // }
];

// 口令解锁：输入对的口令后，在本机永久记住（不区分大小写、忽略空格）
function pwHash(str) {
  var x = 5381;
  for (var i = 0; i < str.length; i++) x = ((x * 33) ^ str.charCodeAt(i)) >>> 0;
  return x.toString(36);
}
function pwNorm(str) { return String(str || '').replace(/\s+/g, '').toLowerCase(); }
function isPasswordUnlocked(dlc) {
  try { return localStorage.getItem('line15-dlc-unlock-' + dlc.id) === '1'; } catch (e) { return false; }
}
window.tryDLCPassword = function(dlc, input) {
  if (!dlc || !dlc.unlockCondition || dlc.unlockCondition.type !== 'password') return false;
  if (pwHash(pwNorm(input)) !== dlc.unlockCondition.hash) return false;
  try { localStorage.setItem('line15-dlc-unlock-' + dlc.id, '1'); } catch (e) {}
  return true;
};

// 检查DLC是否解锁
window.checkDLCUnlock = function(dlc) {
  if (!dlc.unlockCondition) return true;

  var cond = dlc.unlockCondition;

  if (cond.type === 'shards') {
    // 检查主线碎片数量
    var campaign = window.CAMPAIGN_DEFAULT;
    if (campaign && window.Meta && Meta.summary) {
      var summary = Meta.summary(campaign);
      return summary.have >= cond.required;
    }
  }

  if (cond.type === 'password') {
    return isPasswordUnlocked(dlc);
  }

  if (cond.type === 'complete') {
    // 检查是否通关某个战役
    return Meta && Meta.data && Meta.data.completed && Meta.data.completed[cond.campaign];
  }

  return false;
};

// 获取DLC解锁状态文本
window.getDLCUnlockStatus = function(dlc) {
  if (!dlc.unlockCondition) return { unlocked: true, text: '已解锁' };

  var cond = dlc.unlockCondition;

  if (cond.type === 'shards') {
    var campaign = window.CAMPAIGN_DEFAULT;
    var have = 0;
    if (campaign && window.Meta && Meta.summary) {
      var summary = Meta.summary(campaign);
      have = summary.have;
    }
    var unlocked = have >= cond.required;
    return {
      unlocked: unlocked,
      text: unlocked ? '已解锁' : '需要主线收集 ' + have + ' / ' + cond.required + ' 个晶体'
    };
  }

  if (cond.type === 'password') {
    var okp = isPasswordUnlocked(dlc);
    return { unlocked: okp, text: okp ? '已解锁' : '需要口令（' + (cond.hint || '向老师要') + '）', needPassword: !okp };
  }

  if (cond.type === 'complete') {
    var completed = Meta && Meta.data && Meta.data.completed && Meta.data.completed[cond.campaign];
    return {
      unlocked: !!completed,
      text: completed ? '已解锁' : '需要完成主线'
    };
  }

  return { unlocked: false, text: '未解锁' };
};

// 合并关卡工坊保存的自定义 DLC（localStorage），可新增、覆盖或删除内置 DLC
(function(){
  try {
    var saved = JSON.parse(localStorage.getItem('dlc_registry') || 'null');
    var deleted = JSON.parse(localStorage.getItem('dlc_registry_deleted') || '[]');
    var reg = window.DLC_REGISTRY;
    if (Array.isArray(saved)) {
      saved.forEach(function(s) {
        if (!s || !s.id) return;
        var i = reg.findIndex(function(d) { return d.id === s.id; });
        if (i >= 0) reg[i] = s; else reg.push(s);
      });
    }
    window.DLC_REGISTRY = reg.filter(function(d) { return deleted.indexOf(d.id) < 0; });
  } catch (e) {}
})();

// 取得DLC实际使用的战役：工坊发布的版本优先，否则用源码里的战役
window.getDLCCampaign = function(dlc) {
  try {
    var pub = JSON.parse(localStorage.getItem('line15-dlc-campaign-' + dlc.id) || 'null');
    if (pub && Array.isArray(pub.chapters) && pub.chapters.length) {
      if (window.L15 && pub.themes) L15.registerThemes(pub.themes);
      if (dlc.id === 'subway_adventure' && window.stripMetroFlags) window.stripMetroFlags(pub);
      return pub;
    }
  } catch (e) {}
  var src = window[dlc.campaignId] || null;
  if (src && src.themes && window.L15) L15.registerThemes(src.themes);
  return src;
};
console.log('DLC注册表已加载，当前DLC数量：' + DLC_REGISTRY.length);

})();
