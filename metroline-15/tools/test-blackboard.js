/* 无头测试：黑板文字排版
   - 每行文字不能超出板面宽度
   - 3 行自定义公式（d2 的 label）行距够、互不重叠
   - 字号落在 9~15px
   - 不再画压在文字上的三角形（stroke 调用数应为 0） */
global.window=global;
global.document={getElementById:function(){return null}};
global.CanvasRenderingContext2D=function(){};
global.CanvasRenderingContext2D.prototype={roundRect:function(){}};
global.Image=function(){this._ok=true;this.src='';this.complete=true;this.naturalWidth=64;};

function mockCtx(){
 var texts=[],strokes=0,cur={px:10};
 function setFont(f){var m=/(\d+(?:\.\d+)?)px/.exec(f);cur.px=m?+m[1]:10}
 return {texts:texts,strokes:function(){return strokes},
  fillStyle:'',strokeStyle:'',lineWidth:1,globalAlpha:1,lineCap:'',textAlign:'',textBaseline:'',
  get font(){return this._f||''},set font(v){this._f=v;setFont(v)},
  save:function(){},restore:function(){},translate:function(){},scale:function(){},rotate:function(){},clip:function(){},
  beginPath:function(){},closePath:function(){},ellipse:function(){},arcTo:function(){},
  fill:function(){},stroke:function(){strokes++},
  moveTo:function(){},lineTo:function(){},quadraticCurveTo:function(){},arc:function(){},rect:function(){},roundRect:function(){},
  fillRect:function(){},fillText:function(t,x,y){texts.push({t:String(t),x:x,y:y,px:cur.px})},
  drawImage:function(){},
  measureText:function(s){return{width:String(s).length*cur.px*0.6}},
  createRadialGradient:function(){return{addColorStop:function(){}}},
  createLinearGradient:function(){return{addColorStop:function(){}}}
 };
}
global.L15={BIOMES:{snow:{accent:'#74dbe8'}}};
require('../js/gfx.js');
require('../js/gfx3.js');
var GFX=global.GFX;

/* 黑板 3x2 格 = 96x64 像素 */
var W=96,H=64;
function test(label,opts){
 var c=mockCtx();
 var o={kind:'blackboard',x:0,y:0,w:W,h:H,label:opts.label};
 GFX.thing(c,o,0,'snow',0);
 var over=[],minGap=1e9,badPx=0;
 c.texts.forEach(function(t){
  var tw=t.t.length*t.px*0.6;
  if(t.x+tw>W-4)over.push(t.t+' (宽'+Math.round(tw)+' 超出'+(W-4)+')');
  if(t.px<9||t.px>15.5)badPx++;
 });
 for(var i=1;i<c.texts.length;i++){var g=c.texts[i].y-c.texts[i-1].y;if(g<minGap)minGap=g}
 var fs=c.texts.length?c.texts[0].px:0;
 console.log('\n=== '+label);
 console.log('   行数: '+c.texts.length+'   字号: '+fs+'px   行距: '+(c.texts.length>1?minGap.toFixed(1):'-'));
 c.texts.forEach(function(t){console.log('     · "'+t.t+'"  y='+t.y.toFixed(1))});
 console.log('   超出板宽: '+(over.length?over.join(' | '):'无 ✓'));
 console.log('   行重叠: '+(c.texts.length>1&&minGap<fs*1.05?'⚠ 有重叠':'无 ✓'));
 console.log('   字号越界: '+(badPx?'⚠ '+badPx+' 处':'无 ✓'));
 console.log('   描边(三角形): '+(c.strokes()>0?'⚠ 还有 '+c.strokes()+' 次':'0 次 ✓'));
 return {over:over.length,badPx:badPx,minGap:minGap,fs:fs,strokes:c.strokes()};
}

var r1=test('默认公式（2 条）',{});
var r2=test('d2 的 3 段自定义公式',{label:'I=U/R；串联：I处处相等；并联：U相等'});
var r3=test('超长自定义公式',{label:'F浮 = ρ液gV排；η = W有 / W总；n = sinθ₁ / sinθ₂'});
var r4=test('单条公式',{label:'E = ½mv²'});

var bad=(r1.over+r2.over+r3.over+r4.over)>0||(r1.badPx+r2.badPx+r3.badPx+r4.badPx)>0||r2.minGap<r2.fs*1.05;
console.log('\n结论: '+(bad?'✗ 有问题':'✓ 全部通过'));
