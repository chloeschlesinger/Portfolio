
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
  /* torn paper edges: jagged clip-path per element, seeded so it stays stable */
  function rng(seed){let s=seed*9301+49297;return function(){s=(s*9301+49297)%233280;return s/233280}}
  function tear(el){
    const r=rng(+el.dataset.torn||1),pts=[];
    const j=()=>r()*1.6;
    for(let x=0;x<=100;x+=2.5+r()*2) pts.push(x+"% "+j()+"%");
    for(let y=0;y<=100;y+=2.5+r()*2) pts.push((100-j())+"% "+y+"%");
    for(let x=100;x>=0;x-=2.5+r()*2) pts.push(x+"% "+(100-j())+"%");
    for(let y=100;y>=0;y-=2.5+r()*2) pts.push(j()+"% "+y+"%");
    el.style.clipPath="polygon("+pts.join(",")+")";
  }
  document.querySelectorAll("[data-torn]").forEach(function(el){
    /* clip-path would clip the drop shadow, so wrap the visible paper in an inner layer */
    const bg=getComputedStyle(el).backgroundColor;
    const inner=document.createElement("div");
    inner.style.cssText="position:absolute;inset:0;background:"+bg+";";
    inner.dataset.torn=el.dataset.torn;
    while(el.firstChild) inner.appendChild(el.firstChild);
    el.style.backgroundColor="transparent";
    el.appendChild(inner);
    tear(inner);
  });

  /* hand-drawn spiral */
  (function(){
    const r=rng(7);let d="",cx=50,cy=50;
    for(let a=0;a<=Math.PI*7;a+=.35){
      const rad=2+a*2.3+(r()-.5)*1.6;
      const x=cx+Math.cos(a)*rad,y=cy+Math.sin(a)*rad;
      d+=(a===0?"M":"L")+x.toFixed(1)+" "+y.toFixed(1)+" ";
    }
    document.getElementById("spiral").setAttribute("d",d);
  })();

  /* split name into letters so each can react to hover */
  document.querySelectorAll("[data-split]").forEach(function(line){
    const t=line.textContent;line.textContent="";
    for(let i=0;i<t.length;i++){
      const s=document.createElement("span");
      s.className="ch";s.textContent=t[i];s.setAttribute("aria-hidden","true");
      s.style.setProperty("--w",(i%2?-7:6)+"deg");
      line.appendChild(s);
    }
  });

  /* live date in the ticker */
  const when=document.getElementById("when");
  function tick(){
    const n=new Date();
    when.textContent=n.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})+", "+
      n.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
  }
  tick();setInterval(tick,30000);

  /* gentle parallax: the paper layers drift a few pixels with the cursor */
  const calm=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine=matchMedia("(pointer: fine)").matches;
  if(!calm&&fine){
    const layers=[].slice.call(document.querySelectorAll(".layer[data-depth]"));
    addEventListener("pointermove",function(e){
      const x=(e.clientX/innerWidth-.5),y=(e.clientY/innerHeight-.5);
      layers.forEach(function(l){
        const d=+l.dataset.depth;
        l.style.translate=(x*d).toFixed(1)+"px "+(y*d).toFixed(1)+"px";
      });
    },{passive:true});
  }

})();
