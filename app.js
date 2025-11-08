// Imperator Bows — Wood Swatch Configurator
const DATA_URL = "woods.json";
let WOODS = {};
let current = {
  model: "Aquila",
  riserGrip: null,
  riserBack: null,
  limbs: null,
  overlayRiser: null,
  overlayTip: null
};
let deferredPrompt = null;

const el = sel => document.querySelector(sel);
const els = sel => Array.from(document.querySelectorAll(sel));

async function loadData(){
  const res = await fetch(DATA_URL);
  const data = await res.json();
  WOODS = data;
  for(const [key, list] of Object.entries(WOODS)){
    const holder = document.querySelector(`.picker[data-target="${key}"]`);
    if(!holder) continue;
    holder.innerHTML = "";
    list.forEach(item => holder.appendChild(makeSwatchButton(key, item)));
  }
  const defaults = {
    riserGrip: WOODS.riserGrip[0],
    riserBack: WOODS.riserBack[0],
    limbs: WOODS.limbs[0],
    overlayRiser: WOODS.overlayRiser[0],
    overlayTip: WOODS.overlayTip[0],
  };
  Object.assign(current, defaults);
  updateLegend();
  drawPreview();
}

function makeSwatchButton(target, item){
  const wrap = document.createElement("div");
  wrap.className = "swatch";
  const btn = document.createElement("button");
  btn.title = item.name + " " + item.hex;
  btn.style.background = item.hex;
  btn.style.boxShadow = "inset 0 0 0 2px #0003";
  btn.addEventListener("click", () => {
    current[target] = item;
    updateLegend();
    drawPreview();
  });
  const label = document.createElement("label");
  label.textContent = item.name;
  wrap.appendChild(btn);
  wrap.appendChild(label);
  return wrap;
}

function drawBowShape(ctx, palette){
  const { width:W, height:H } = ctx.canvas;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = "#f9fafc";
  ctx.fillRect(0,0,W,H);
  const cx = W*0.5, cy = H*0.55;

  // Limbs
  ctx.save();
  ctx.strokeStyle = palette.limbs.hex;
  ctx.lineWidth = 34; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(W*0.18, cy-90); ctx.quadraticCurveTo(cx, cy-180, W*0.82, cy-90); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W*0.18, cy+90); ctx.quadraticCurveTo(cx, cy+180, W*0.82, cy+90); ctx.stroke();
  ctx.restore();

  // Riser back
  ctx.save();
  ctx.fillStyle = palette.riserBack.hex;
  ctx.beginPath();
  ctx.moveTo(cx-80, cy-110);
  ctx.quadraticCurveTo(cx-30, cy-90, cx-20, cy-30);
  ctx.quadraticCurveTo(cx-15, cy+10, cx-30, cy+40);
  ctx.quadraticCurveTo(cx-50, cy+90, cx-80, cy+110);
  ctx.lineTo(cx+80, cy+110);
  ctx.quadraticCurveTo(cx+30, cy+90, cx+20, cy+40);
  ctx.quadraticCurveTo(cx+5,  cy+10, cx+20, cy-30);
  ctx.quadraticCurveTo(cx+30, cy-90, cx+80, cy-110);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Riser grip
  ctx.save();
  ctx.fillStyle = palette.riserGrip.hex;
  ctx.beginPath();
  ctx.moveTo(cx-70, cy-20);
  ctx.quadraticCurveTo(cx-20, cy-35, cx, cy-30);
  ctx.quadraticCurveTo(cx+20, cy-25, cx+70, cy-20);
  ctx.lineTo(cx+70, cy+60);
  ctx.quadraticCurveTo(cx+20, cy+45, cx, cy+40);
  ctx.quadraticCurveTo(cx-20, cy+35, cx-70, cy+60);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Riser overlay lines
  ctx.save();
  ctx.strokeStyle = palette.overlayRiser.hex;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(cx-78, cy-85); ctx.lineTo(cx+78, cy-85);
  ctx.moveTo(cx-78, cy+85); ctx.lineTo(cx+78, cy+85);
  ctx.stroke();
  ctx.restore();

  // Tip overlays
  ctx.save();
  ctx.fillStyle = palette.overlayTip.hex;
  ctx.beginPath();
  ctx.arc(W*0.18, cy-90, 10, 0, Math.PI*2);
  ctx.arc(W*0.82, cy-90, 10, 0, Math.PI*2);
  ctx.arc(W*0.18, cy+90, 10, 0, Math.PI*2);
  ctx.arc(W*0.82, cy+90, 10, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "#333";
  ctx.font = "600 18px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
  ctx.fillText("Model: " + current.model, 16, 28);
  ctx.restore();
}

function updateLegend(){
  const legend = el("#legendList");
  legend.innerHTML = "";
  const rows = [
    ["Riser — Grip", current.riserGrip],
    ["Riser — Back", current.riserBack],
    ["Limbs", current.limbs],
    ["Riser Overlays", current.overlayRiser],
    ["Tip Overlays", current.overlayTip],
  ];
  rows.forEach(([label, item]) => {
    const li = document.createElement("li");
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = item?.hex || "#ccc";
    const name = document.createElement("span");
    name.textContent = `${label}: ${item?.name || "-"}`;
    li.appendChild(dot);
    li.appendChild(name);
    legend.appendChild(li);
  });
}

function saveBuild(){
  const name = el("#buildName").value.trim() || `${current.model} build`;
  const builds = JSON.parse(localStorage.getItem("builds")||"{}");
  builds[name] = current;
  localStorage.setItem("builds", JSON.stringify(builds));
  flashStatus(`Saved “${name}” on this device.`);
}

function loadBuild(){
  const builds = JSON.parse(localStorage.getItem("builds")||"{}");
  const keys = Object.keys(builds);
  if(keys.length===0){ alert("No saved builds yet."); return; }
  const name = prompt("Load which build?\n\n" + keys.join("\n"));
  if(!name || !builds[name]) return;
  current = JSON.parse(JSON.stringify(builds[name]));
  el("#modelSelect").value = current.model;
  updateLegend();
  drawPreview();
  flashStatus(`Loaded “${name}”.`);
}

function exportJSON(){
  const data = { type:"imperator-build", version:1, timestamp:new Date().toISOString(), current, palette: WOODS };
  const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "imperator_swatch_build.json"; a.click();
  URL.revokeObjectURL(url);
}

function importJSON(file){
  const reader = new FileReader();
  reader.onload = e => {
    try{
      const data = JSON.parse(e.target.result);
      if(data.current){
        current = data.current;
        el("#modelSelect").value = current.model;
        updateLegend();
        drawPreview();
        flashStatus("Imported build.");
      }else{ alert("Invalid file."); }
    }catch{ alert("Could not read file."); }
  };
  reader.readAsText(file);
}

function addSwatch(){
  const name = el("#newName").value.trim();
  const hex = el("#newHex").value.trim();
  const cat = el("#newCategory").value;
  if(!name || !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)){
    alert("Enter a name and valid hex like #5A3B2E.");
    return;
  }
  const item = { name, hex };
  WOODS[cat].unshift(item);
  const holder = document.querySelector(`.picker[data-target="${cat}"]`);
  holder.prepend(makeSwatchButton(cat,item));
  flashStatus(`Added swatch “${name}”.`);
  el("#newName").value = ""; el("#newHex").value = "";
}

function downloadPNG(){
  const c = el("#previewCanvas");
  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = "imperator_swatch_preview.png";
  a.click();
}

function flashStatus(msg){
  const s = el("#statusMsg");
  s.textContent = msg;
  setTimeout(()=>{ s.textContent = ""; }, 3200);
}

function setupInstall(){
  window.addEventListener("beforeinstallprompt", (e)=>{
    e.preventDefault();
    deferredPrompt = e;
    const btn = el("#installBtn");
    btn.hidden = false;
    btn.onclick = async ()=>{
      btn.hidden = true;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    };
  });
}

document.addEventListener("DOMContentLoaded", async ()=>{
  el("#modelSelect").addEventListener("change", (e)=>{ current.model = e.target.value; drawPreview(); });
  el("#saveBuild").addEventListener("click", saveBuild);
  el("#loadBuild").addEventListener("click", loadBuild);
  el("#exportJSON").addEventListener("click", exportJSON);
  el("#importJSON").addEventListener("change", (e)=>{ if(e.target.files?.[0]) importJSON(e.target.files[0]); });
  el("#downloadPNG").addEventListener("click", downloadPNG);

  // PWA install + SW
  setupInstall();
  if("serviceWorker" in navigator){
    try{ await navigator.serviceWorker.register("./service-worker.js"); }catch{}
  }

  // Swatch data
  await loadData();

  // Image mode controls
  const radios = els('input[name="viewMode"]');
  radios.forEach(r=>r.addEventListener("change", (e)=>{
    const mode = e.target.value;
    el("#imageControls").style.display = (mode==="image") ? "flex" : "none";
    viewMode = mode;
    drawPreview();
  }));
  el("#loadSample").addEventListener("click", ()=> loadSample());
  el("#uploadPhoto").addEventListener("change", (e)=>{
    const f = e.target.files?.[0]; if(!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = ()=>{ baseImage = img; resizeCanvasToImage(); computeAutoMasks(); drawPreview(); URL.revokeObjectURL(url); };
    img.src = url;
  });
});

// ---------- Image Preview (auto-mask) ----------
let viewMode = "vector";
let baseImage = null;
const PARTS = ["riserGrip","riserBack","limbs","overlayRiser","overlayTip"];
const masks = {}; // part -> canvas
const maskCtxs = {};

function initMasks(w,h){
  PARTS.forEach(p=>{
    const c = document.createElement("canvas");
    c.width=w; c.height=h;
    masks[p] = c; maskCtxs[p] = c.getContext("2d");
  });
}

function resizeCanvasToImage(){
  const c = el("#previewCanvas");
  const maxW = 1200, maxH = 800;
  let w = baseImage.width, h = baseImage.height;
  const s = Math.min(maxW/w, maxH/h, 1.0);
  w = Math.round(w*s); h = Math.round(h*s);
  c.width = w; c.height = h;
}

function loadSample(){
  const img = new Image();
  img.onload = ()=>{ baseImage = img; resizeCanvasToImage(); computeAutoMasks(); drawPreview(); };
  img.src = "./sample_aquila.jpg";
}

function computeAutoMasks(){
  if(!baseImage) return;
  const W = el("#previewCanvas").width, H = el("#previewCanvas").height;
  initMasks(W,H);

  const off = document.createElement("canvas");
  off.width=W; off.height=H;
  const octx = off.getContext("2d");
  octx.drawImage(baseImage,0,0,W,H);
  const img = octx.getImageData(0,0,W,H);
  const data = img.data;

  // Coarse bow mask: keep darker-than-backdrop pixels
  const bow = document.createElement("canvas");
  bow.width=W; bow.height=H;
  const bctx = bow.getContext("2d");
  const out = bctx.createImageData(W,H);
  const od = out.data;
  for(let i=0;i<data.length;i+=4){
    const r=data[i], g=data[i+1], b=data[i+2], a=data[i+3];
    const y=0.2126*r+0.7152*g+0.0722*b;
    const keep = (y<200 && a>0)?255:0;
    od[i]=255; od[i+1]=255; od[i+2]=255; od[i+3]=keep;
  }
  bctx.putImageData(out,0,0);

  function rectMask(x0,y0,x1,y1){
    const c = document.createElement("canvas");
    c.width=W; c.height=H;
    const ctx = c.getContext("2d");
    ctx.drawImage(bow,0,0);
    ctx.globalCompositeOperation="destination-in";
    ctx.fillStyle="#fff"; ctx.fillRect(x0,y0,x1-x0,y1-y0);
    return c;
  }

  // Tuned boxes for the provided sample photo
  const riserBox = {x0: W*0.38, x1: W*0.62, y0: H*0.35, y1: H*0.72};
  const gripBox  = {x0: W*0.43, x1: W*0.57, y0: H*0.50, y1: H*0.62};
  const overlayTop = {x0: W*0.36, x1: W*0.64, y0: H*0.36, y1: H*0.41};
  const overlayBot = {x0: W*0.36, x1: W*0.64, y0: H*0.66, y1: H*0.71};

  // Limbs = bow minus riser rectangle
  const limb = document.createElement("canvas");
  limb.width=W; limb.height=H;
  const lctx = limb.getContext("2d");
  lctx.drawImage(bow,0,0);
  lctx.globalCompositeOperation="destination-out";
  lctx.fillStyle="#fff";
  lctx.fillRect(riserBox.x0, riserBox.y0, riserBox.x1-riserBox.x0, riserBox.y1-riserBox.y0);

  // Tips = small squares near visible limb ends, intersect with bow
  const tip = document.createElement("canvas");
  tip.width=W; tip.height=H;
  const tctx = tip.getContext("2d");
  tctx.fillStyle="#fff";
  tctx.fillRect(W*0.77, H*0.10, W*0.06, H*0.10);
  tctx.fillRect(W*0.10, H*0.78, W*0.08, H*0.10);
  tctx.globalCompositeOperation="destination-in";
  tctx.drawImage(bow,0,0);

  maskCtxs["riserBack"].drawImage(rectMask(riserBox.x0, riserBox.y0, riserBox.x1, riserBox.y1),0,0);
  maskCtxs["riserGrip"].drawImage(rectMask(gripBox.x0, gripBox.y0, gripBox.x1, gripBox.y1),0,0);
  maskCtxs["overlayRiser"].drawImage(rectMask(overlayTop.x0, overlayTop.y0, overlayTop.x1, overlayTop.y1),0,0);
  maskCtxs["overlayRiser"].drawImage(rectMask(overlayBot.x0, overlayBot.y0, overlayBot.x1, overlayBot.y1),0,0);
  maskCtxs["limbs"].drawImage(limb,0,0);
  maskCtxs["overlayTip"].drawImage(tip,0,0);
}

function drawImagePreview(ctx){
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = "#fff"; ctx.fillRect(0,0,W,H);
  if(baseImage){ ctx.drawImage(baseImage,0,0,W,H); }
  else { ctx.fillStyle="#666"; ctx.font="16px system-ui"; ctx.fillText("Load a bow photo to preview.", 16, 28); }

  const parts = [
    ["riserBack", current.riserBack],
    ["riserGrip", current.riserGrip],
    ["limbs", current.limbs],
    ["overlayRiser", current.overlayRiser],
    ["overlayTip", current.overlayTip],
  ];

  parts.forEach(([part, item])=>{
    const mask = masks[part]; if(!mask || !item) return;
    const tint = document.createElement("canvas");
    tint.width = W; tint.height = H;
    const tctx = tint.getContext("2d");
    tctx.fillStyle = item.hex;
    tctx.fillRect(0,0,W,H);
    tctx.globalCompositeOperation = "destination-in"; // mask as alpha
    tctx.drawImage(mask,0,0);
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.globalCompositeOperation = "multiply"; // keep grain/lighting
    ctx.drawImage(tint,0,0);
    ctx.restore();
  });
}

function drawPreview(){
  const c = el("#previewCanvas");
  const ctx = c.getContext("2d");
  if(viewMode==="image"){ drawImagePreview(ctx); }
  else {
    drawBowShape(ctx, {
      riserGrip: current.riserGrip || { hex:"#bbb" },
      riserBack: current.riserBack || { hex:"#ccc" },
      limbs: current.limbs || { hex:"#ddd" },
      overlayRiser: current.overlayRiser || { hex:"#999" },
      overlayTip: current.overlayTip || { hex:"#777" }
    });
  }
}
