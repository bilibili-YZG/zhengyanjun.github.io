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
    description: '深夜的末班车开往未知。物理老师坐在飞驰的地铁上，一节一节车厢往车头走，开始了一场冒险。（框架版：目前 1 关）',
    icon: '🚇',
    unlockCondition: { type: 'shards', required: 150, campaign: 'DEFAULT' },
    campaignId: 'CAMPAIGN_SUBWAY',
    chapters: 1,
    levels: 4,
    features: ['4 个长关，每关 6 节白色车厢，整关带车顶，窗外风景飞速掠过', '黄色水晶（DLC专属收集物）', '老师的深夜冒险'],
    difficulty: '中',
    estimatedTime: '15分钟',
    version: '0.1',
    releaseDate: '2026-10',
    author: '15号线团队'
  }
  // 未来可以添加更多DLC
  // {
  //   id: 'second_dlc',
  //   name: '第二个DLC',
  //   ...
  // }
];

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
      return pub;
    }
  } catch (e) {}
  var src = window[dlc.campaignId] || null;
  if (src && src.themes && window.L15) L15.registerThemes(src.themes);
  return src;
};
console.log('DLC注册表已加载，当前DLC数量：' + DLC_REGISTRY.length);

})();
