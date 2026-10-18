/* 图鉴条目与成就定义（纯数据，可以随意改文案）。key 对应物件种类；Boss 用 boss_ice / boss_root / boss_spore / boss_lava 区分。
   图鉴页只显示「当前主线里出现过」的条目，没见过的显示为 ？？？，所以工坊里删掉某种物件，对应条目也会自动消失。 */
window.L15_META_DATA=(function(){
var CODEX=[
 /* 生物 */
 {k:'slime',cat:'creature',n:'巡逻史莱姆',d:'在地面来回巡逻的凝胶团。发现你会加速追来，像一路滚下斜面的小球，越追越快。教鞭一下就能把它击退。'},
 {k:'bee',cat:'creature',n:'飞行蜂',d:'悬在半空的小蜜蜂，会朝你飞来。够不着的时候，扔一截粉笔最省事。'},
 {k:'turret',cat:'creature',n:'炮台',d:'固定在地面的火力点，开火前炮口会发红。可以用教鞭近身打坏，教鞭还能把子弹弹回去。'},
 {k:'ghost',cat:'creature',n:'追踪幽灵',d:'你盯着它，它就变淡、停下；你一转身，它就悄悄追上来——像一个只有被观察时才“老实”的粒子。'},
 {k:'frog',cat:'creature',n:'跳跳蛙',d:'靠弹性势能一蹦一蹦地移动，落地的瞬间最容易挨打。它跳过来时可以直接从头顶越过。'},
 {k:'bat',cat:'creature',n:'蝙蝠',d:'倒挂着睡觉，被吵醒就沿直线俯冲，扑空后飞回原位。俯冲前会先抖一下翅膀，冲刺或跳起来都能躲开。'},
 {k:'guard',cat:'creature',n:'装甲兵',d:'平时慢悠悠地巡逻，看见你会先抬手蓄力，再猛地突进。蓄力时后撤，等它扑空再还击。'},
 {k:'boss_ice',cat:'creature',n:'风雪稽查员',d:'第一章 Boss。冲撞、雪球、冰锥。它出招前身体会泛红光，这时冲刺撞上去能打断它。'},
 {k:'boss_root',cat:'creature',n:'枯根傀儡',d:'第二章 Boss。树根、飞舞的作业纸、重踏冲击波。看清预警的红柱，再钻空档。'},
 {k:'boss_spore',cat:'creature',n:'孢子母巢',d:'第三章 Boss。追踪孢子、孢子雨，还会召唤小怪。它漂浮在空中，粉笔很好用。'},
 {k:'boss_lava',cat:'creature',n:'守线者',d:'最后一位守关者。冲撞、火球、熔柱、重踏，血量越低越凶。不必完美，只要灯还亮着。'},
 /* NPC */
 {k:'worker',cat:'npc',n:'巡线员',d:'守着雪原站口的人。他会告诉你怎么在这条线上活下去，也会讲牛顿第一定律。'},
 {k:'child',cat:'npc',n:'雪地孩子',d:'一个迷路的孩子，有一道受力分析的题一直没弄懂，也不敢举手问。'},
 {k:'ranger',cat:'npc',n:'守林人',d:'守着苔木森林的人。他觉得弹跳菌像弹簧，会把压下去的弹性势能还给你。'},
 {k:'squirrel',cat:'npc',n:'小松鼠',d:'很会爬树，也很会问问题。它相信：势能攒得再久，方向对了就会变成动能。'},
 {k:'robot',cat:'npc',n:'维修机器人',d:'在洞窟里巡检的机器人，爱用物理量说话：周期、频率、参照系。'},
 {k:'hologram',cat:'npc',n:'研究员投影',d:'留在遗迹里的投影，只会重复一小段话。它记得每一次实验里的超重与失重。'},
 {k:'traveler',cat:'npc',n:'旅客',d:'在这条线上等了很久的旅客。他怕高，也怕第一次起跳。'},
 {k:'stationmaster',cat:'npc',n:'站务员',d:'站台上的老站务员。关于守线者，他知道的比谁都多。'},
 {k:'student',cat:'npc',n:'学生',d:'一个背着书包的学生，兜里揣着没敢交的作业，很想知道今天的题怎么做。'},
 {k:'cat',cat:'npc',n:'流浪猫',d:'不知什么时候溜进线路里的小猫。它不怎么怕人，也不怎么理人。'},
 {k:'driver',cat:'npc',n:'列车员',d:'15号线的列车员，负责在终点喊一声“到站了”。'},
 {k:'colleague',cat:'npc',n:'同事老师',d:'同样熬到很晚的同事。你们互相点点头，什么也不用多说。'},
 /* 障碍 */
 {k:'spikes',cat:'hazard',n:'尖刺',d:'碰到会扣一点生命，并把你送回最近的立足点。从空中俯冲下来踩在上面，反而会被弹起。'},
 {k:'lava',cat:'hazard',n:'熔岩',d:'掉进去会受伤并从立足点重来。热量靠传导、对流、辐射传开，别在上空停留。'},
 {k:'laser',cat:'hazard',n:'激光栅',d:'按固定周期开关，快亮起来之前会闪烁预警。有的激光栅可以用开关关掉。'},
 {k:'saw',cat:'hazard',n:'旋转锯',d:'沿固定轨道往返的旋转锯，一碰就受伤。往返的周期是固定的，看准节奏再动身。'},
 {k:'icicle',cat:'hazard',n:'冰锥',d:'挂在顶上的冰锥。你走到下面，它会先抖一抖，随后自由落体——速度越来越快。抖动时赶紧离开正下方。'},
 {k:'flame',cat:'hazard',n:'火焰喷口',d:'周期性喷出火柱，喷发前喷口会变红预警。趁它熄灭的间隙快速通过。'},
 {k:'rubble',cat:'hazard',n:'碎石',d:'堵路的碎石，教鞭打两下、空中俯冲或者粉笔都能把它击碎。'},
 /* 机关 */
 {k:'switch',cat:'mech',n:'开关',d:'靠近按「互动」或用教鞭、粉笔打一下就会启动，拉开后保持接通。多个开关连同一个目标时要全部接通。'},
 {k:'plate',cat:'mech',n:'压力板',d:'站上去就接通，离开后还能保持几秒。像一个会慢慢放电的电容。'},
 {k:'gate',cat:'mech',n:'闸门',d:'被开关或压力板控制的门。连了多个开关时，要同时接通才会打开。'},
 {k:'spring',cat:'mech',n:'弹簧',d:'踩上去会被弹得很高。压缩时存起来的弹性势能，一下子变成了你的动能。'},
 {k:'vent',cat:'mech',n:'风口',d:'周期性喷出上升气流，喷发前会有一小段预警。借气流跳得更高。'},
 {k:'spore',cat:'mech',n:'孢子云',d:'发光的孢子云会托着你往上飘，进去之后还能重新冲刺一次。'},
 {k:'moving',cat:'mech',n:'移动平台',d:'来回移动的平台。选它做参照系，你就是静止的。'},
 {k:'lift',cat:'mech',n:'升降台',d:'上下移动。启动的一瞬间，台面对你的支持力会比重力大——这就是超重。'},
 {k:'crumble',cat:'mech',n:'碎裂平台',d:'被踩一下就会抖动，随后碎裂，过几秒又重新长出来。别在上面犹豫。'},
 {k:'conveyor',cat:'mech',n:'传送带',d:'台面在运动，会把站在上面的人带着走。逆着跑，对地速度就会变慢；顺着跑则一路滑出去。'},
 {k:'wind',cat:'mech',n:'风区',d:'区域内持续有横向的风，空中受力最明显。顺风速度越来越快，逆风就要多使点劲。'},
 {k:'vine',cat:'mech',n:'藤蔓',d:'靠近后按 ↑ 或「互动」就能抓住，上下攀爬，跳起来可以荡出去。'},
 {k:'checkpoint',cat:'mech',n:'信标灯',d:'点亮后会存档，你倒下时会回到这里。'},
 {k:'exit',cat:'mech',n:'出口',d:'站在里面停一会儿就能过关。Boss 房的出口会被封锁，要先击败守关者。'},
 {k:'sign',cat:'mech',n:'剧情路牌',d:'路边的牌子，靠近按「互动」查看。'},
 /* 道具 */
 {k:'shard',cat:'item',n:'信标碎片',d:'每一枚碎片里，都封着孩子们说过的一句话。收集情况会记录在「成就 · 晶体」里。'},
 {k:'dashgem',cat:'item',n:'冲刺水晶',d:'碰一下就补满冲刺和二段跳，几秒后会重新凝结。'},
 {k:'heart',cat:'item',n:'保温杯',d:'喝一口，恢复 1 点生命。生命满了的时候先留着。'},
 /* 地块 */
 {k:'ground',cat:'terrain',n:'地面',d:'最普通的地面，抓地力十足，说停就能停。'},
 {k:'thin',cat:'terrain',n:'薄地板',d:'可以从下面跳上去，也可以按住 ↓ 再跳下穿。'},
 {k:'bounce',cat:'terrain',n:'弹跳菌',d:'踩上去会被弹起，像一团蓬松的弹簧。'},
 {k:'brick',cat:'terrain',n:'石砖',d:'坚硬的石砖，挡路，也能当作你的立足之处。'},
 {k:'ice',cat:'terrain',n:'冰面',d:'摩擦很小：松开方向键，惯性也不会立刻消失。提前减速。'}
];
var CATS=[['creature','生物'],['npc','NPC'],['hazard','障碍物'],['mech','机关'],['item','道具'],['terrain','地块']];
function N(n){return function(m){return m.cnt[n]||0}}
var ACH=[
 {id:'shard_1',n:'初见微光',d:'捡到第一枚信标碎片',prog:function(m,i){return [Math.min(1,i.have),1]}},
 {id:'shard_25',n:'小有收获',d:'累计收集 25 枚信标碎片',prog:function(m,i){return [Math.min(25,i.have),25]}},
 {id:'shard_60',n:'碎片收藏家',d:'累计收集 60 枚信标碎片',prog:function(m,i){return [Math.min(60,i.have),60]}},
 {id:'shard_all',n:'全部归位',d:'收集全部信标碎片',prog:function(m,i){return [i.have,i.total]}},
 {id:'ch1_all',n:'雪原回响',d:'找齐第一章的全部碎片',prog:function(m,i){return i.ch[0]?[i.ch[0].have,i.ch[0].total]:null}},
 {id:'ch2_all',n:'苔木之声',d:'找齐第二章的全部碎片',prog:function(m,i){return i.ch[1]?[i.ch[1].have,i.ch[1].total]:null}},
 {id:'ch3_all',n:'洞窟微光',d:'找齐第三章的全部碎片',prog:function(m,i){return i.ch[2]?[i.ch[2].have,i.ch[2].total]:null}},
 {id:'ch4_all',n:'熔岩余烬',d:'找齐第四章的全部碎片',prog:function(m,i){return i.ch[3]?[i.ch[3].have,i.ch[3].total]:null}},
 {id:'boss_ice',n:'风雪散去',d:'击败风雪稽查员',prog:function(m){return [m.boss.ice?1:0,1]}},
 {id:'boss_root',n:'枯枝逢春',d:'击败枯根傀儡',prog:function(m){return [m.boss.root?1:0,1]}},
 {id:'boss_spore',n:'孢子归尘',d:'击败孢子母巢',prog:function(m){return [m.boss.spore?1:0,1]}},
 {id:'boss_lava',n:'灯还亮着',d:'击败守线者',prog:function(m){return [m.boss.lava?1:0,1]}},
 {id:'chalk_1',n:'抛体运动',d:'用粉笔击中一次敌人',prog:function(m){return [Math.min(1,N('chalkHits')(m)),1]}},
 {id:'chalk_50',n:'弹道专家',d:'粉笔累计命中 50 次',prog:function(m){return [Math.min(50,N('chalkHits')(m)),50]}},
 {id:'deflect_5',n:'动量守恒',d:'用教鞭弹回 5 颗子弹',prog:function(m){return [Math.min(5,N('deflects')(m)),5]}},
 {id:'rubble_5',n:'破碎机',d:'击碎 5 块碎石',prog:function(m){return [Math.min(5,N('rubble')(m)),5]}},
 {id:'kill_30',n:'驱散烦恼',d:'累计击退 30 个敌人',prog:function(m){return [Math.min(30,N('kills')(m)),30]}},
 {id:'kill_100',n:'身经百战',d:'累计击退 100 个敌人',prog:function(m){return [Math.min(100,N('kills')(m)),100]}},
 {id:'clear',n:'老师到家了',d:'通关全部章节',prog:function(m){return [Math.min(1,m.clears||0),1]}},
 {id:'clear_clean',n:'一路平安',d:'一次也没倒下就通关',prog:function(m){return [Math.min(1,m.clean||0),1]}},
 {id:'codex_half',n:'见多识广',d:'图鉴收集过半',prog:function(m,i){var t=Math.ceil(i.codexTotal/2);return [Math.min(t,i.codexSeen),t]}},
 {id:'codex_all',n:'博物学家',d:'图鉴全部收集',prog:function(m,i){return [i.codexSeen,i.codexTotal]}}
];
return {CODEX:CODEX,CATS:CATS,ACH:ACH};
})();
