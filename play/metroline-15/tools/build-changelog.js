/* 把 changelog.txt 生成 js/changelog-data.js，供直接双击打开 index.html（file://）时使用。
   改完 changelog.txt 后，在游戏目录运行：node tools/build-changelog.js
   通过网址访问时游戏直接读取 changelog.txt，不依赖这个文件。 */
var fs=require('fs'),path=require('path');
var txt=fs.readFileSync(path.join(__dirname,'../changelog.txt'),'utf8');
fs.writeFileSync(path.join(__dirname,'../js/changelog-data.js'),'/* 由 tools/build-changelog.js 自动生成，请勿手改 */\nwindow.CHANGELOG_TEXT='+JSON.stringify(txt)+';\n');
console.log('已生成 js/changelog-data.js');
