/* toast.js — Palantis toast notification */

let toastT;
function toast(msg){const t=document.getElementById('toast');t.innerText=msg;t.style.opacity='1';clearTimeout(toastT);toastT=setTimeout(()=>t.style.opacity='0',3200);}
