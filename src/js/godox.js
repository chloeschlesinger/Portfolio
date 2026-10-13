
(function(){
  /* every page opens at the very top, even after fonts load */
  try{history.scrollRestoration="manual"}catch(e){}
  function toTop(){ if(location.hash&&location.hash!=="#") return; window.scrollTo(0,0); document.documentElement.scrollTop=0; document.body.scrollTop=0; }
  toTop();
  addEventListener("pageshow",toTop);
  addEventListener("load",function(){toTop();setTimeout(toTop,150);setTimeout(toTop,600)});
  document.addEventListener("DOMContentLoaded",toTop);
  document.querySelectorAll(".tabs a, .next a").forEach(function(a){
    a.addEventListener("click",function(){ if(a.getAttribute("href").indexOf("#")<0){ window.scrollTo(0,0);} });
  });
  document.documentElement.classList.add("js");

  /* torn paper edges */
  function rng(seed){let s=seed*9301+49297;return function(){s=(s*9301+49297)%233280;return s/233280}}
  document.querySelectorAll("[data-torn]").forEach(function(el){
    const r=rng(+el.dataset.torn||1),pts=[],j=function(){return r()*1.4};
    for(let x=0;x<=100;x+=2+r()*2) pts.push(x+"% "+j()+"%");
    for(let y=0;y<=100;y+=2+r()*2) pts.push((100-j())+"% "+y+"%");
    for(let x=100;x>=0;x-=2+r()*2) pts.push(x+"% "+(100-j())+"%");
    for(let y=100;y>=0;y-=2+r()*2) pts.push(j()+"% "+y+"%");
    const inner=document.createElement("div");
    inner.style.cssText="position:absolute;inset:0;background:"+getComputedStyle(el).backgroundColor+";clip-path:polygon("+pts.join(",")+")";
    while(el.firstChild) inner.appendChild(el.firstChild);
    el.style.backgroundColor="transparent";el.appendChild(inner);
  });

  /* letters react to hover */
  document.querySelectorAll("[data-split]").forEach(function(line){
    const t=line.textContent;line.textContent="";
    for(let i=0;i<t.length;i++){
      const s=document.createElement("span");s.className="ch";s.textContent=t[i];s.setAttribute("aria-hidden","true");
      s.style.setProperty("--w",(i%2?-7:6)+"deg");line.appendChild(s);
    }
  });

  /* hand-drawn underline under each section title, drawn when it arrives */
  const NS="http://www.w3.org/2000/svg";
  const heads=[].slice.call(document.querySelectorAll("[data-uline]"));
  heads.forEach(function(h,i){
    const svg=document.createElementNS(NS,"svg");
    svg.setAttribute("class","uline");svg.setAttribute("viewBox","0 0 300 16");svg.setAttribute("aria-hidden","true");
    const p=document.createElementNS(NS,"path");
    p.setAttribute("pathLength","1");
    p.setAttribute("d",i%2?"M3 9 C60 3 110 14 170 8 S260 4 297 9":"M3 8 C70 14 120 3 180 9 S250 12 297 6");
    svg.appendChild(p);h.appendChild(svg);
  });
  const calm=matchMedia("(prefers-reduced-motion: reduce)").matches;
  if("IntersectionObserver" in window && !calm){
    const io=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } });
    },{threshold:.6});
    heads.forEach(function(h){io.observe(h)});
    const sq=document.querySelector(".s-sq"); if(sq) sq.classList.add("in");
  } else {
    heads.forEach(function(h){h.classList.add("in")});
  }

  const cur=document.querySelector('.tabs a[aria-current="page"]');
  if(cur) cur.addEventListener("click",function(e){e.preventDefault();window.scrollTo({top:0,behavior:calm?"auto":"smooth"})});
})();
