/* DLC编辑器 - 完全复用主线编辑器逻辑，只是数据来源不同 */
(function(){

var currentDLCId = null; // 当前编辑的DLC ID
var currentDLC = null;   // 当前DLC战役对象

// 初始化DLC编辑器
function initDLCEditor() {
  loadDLCList();

  // 绑定事件
  var createBtn = document.getElementById('dlcCreateBtn');
  if (createBtn) {
    createBtn.onclick = createNewDLC;
  }
}

// 加载DLC列表
function loadDLCList() {
  if (!window.DLC_REGISTRY || window.DLC_REGISTRY.length === 0) {
    document.getElementById('dlcList').innerHTML = '<p style="color:#888;">暂无DLC，点击下方按钮创建</p>';
    return;
  }

  var html = '';
  window.DLC_REGISTRY.forEach(function(dlc) {
    html += '<div class="dlc-card" data-id="' + dlc.id + '">';
    html += '<h4>' + escapeHtml(dlc.name) + '</h4>';
    html += '<p>' + escapeHtml(dlc.subtitle) + '</p>';
