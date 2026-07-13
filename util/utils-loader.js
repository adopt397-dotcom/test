// utils-loader.js v3.0
// Header attached utility placeholder
// Timer and calculator attach to .quiz-header
(function(){
'use strict';
function init(){
 const header=document.querySelector('.quiz-header');
 if(!header || document.getElementById('quizUtilityTools')) return;
 header.style.position='relative';
 const box=document.createElement('div');
 box.id='quizUtilityTools';
 box.style.cssText='position:absolute;right:18px;top:14px;z-index:50;display:flex;gap:8px;';
 box.innerHTML='<button style="width:42px;height:42px;border-radius:50%;cursor:pointer">⏱</button><button style="width:42px;height:42px;border-radius:50%;cursor:pointer">🧮</button>';
 header.appendChild(box);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
else init();
})();
