// Imperator Bows — Wood Swatch Configurator
// Offline-ready PWA with localStorage persistence

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
  // Initialize pickers
  for(const [key, list] of Object.entries(WOODS)){
    const holder = document.querySelector(`.picker[data-target="${key}"]`);
    if(!holder) continue;
    holder.innerHTML = "";
    list.forEach(item => holder.appendChild(makeSwatchButton(key, item)));
  }
  // default selections
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
  btn.style.boxShadow = "inset 0 0 0 2px #0003"
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

function h2r(hex){
  const h = hex.replace("#","");
  const bigint = parseInt(h,16);
  if(h.length === 3){
    const r = ((bigint >> 8) & 0xF) * 17;
    const g = ((bigint >> 4) & 0xF) * 17;
    const b = (bigint & 0xF) * 17;
    return [r,g,b];
  }else{
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r,g,b];
  }
}

function drawBowShape(ctx, palette){
  // A stylized side profile: riser center, limb arcs, overlays accents.
  const { width:W, height:H } = ctx.canvas;
  ctx.clearRect(0,0,W,H);

  ctx.fillStyle = "#f9fafc";
  ctx.fillRect(0,0,W,H);

  const cx = W*0.5;
  const cy = H*0.55;

  // Limbs (background arcs)
  ctx.save();
  ctx.translate(0,0);
  ctx.strokeStyle = palette.limbs.hex;
  ctx.lineWidth = 34;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(W*0.18, cy-90);
  ctx.quadraticCurveTo(cx, cy-180, W*0.82, cy-90);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W*0.18, cy+90);
  ctx.quadraticCurveTo(cx, cy+180, W*0.82, cy+90);
  ctx.stroke();
  ctx.restore();

  // Riser back (body)
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

  // Riser grip overlay (grip section band)
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

  // Riser overlay accents (thin lines)
  ctx.save();
  ctx.strokeStyle = palette.overlayRiser.hex;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(cx-78, cy-85);
  ctx.lineTo(cx+78, cy-85);
  ctx.moveTo(cx-78, cy+85);
  ctx.lineTo(cx+78, cy+85);
  ctx.stroke();
  ctx.restore();

  // Tip overlays (dots at limb tips)
  ctx.save();
  ctx.fillStyle = palette.overlayTip.hex;
  ctx.beginPath();
  ctx.arc(W*0.18, cy-90, 10, 0, Math.PI*2);
  ctx.arc(W*0.82, cy-90, 10, 0, Math.PI*2);
  ctx.arc(W*0.18, cy+90, 10, 0, Math.PI*2);
  ctx.arc(W*0.82, cy+90, 10, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  // Model label
  ctx.save();
  ctx.fillStyle = "#333";
  ctx.font = "600 18px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
  ctx.fillText("Model: " + current.model, 16, 28);
  ctx.restore();
}

function drawPreview(){
  const canvas = el("#previewCanvas");
  const ctx = canvas.getContext("2d");
  const palette = {
    riserGrip: current.riserGrip || { hex:"#bbb", name:"" },
    riserBack: current.riserBack || { hex:"#ccc", name:"" },
    limbs: current.limbs || { hex:"#ddd", name:"" },
    overlayRiser: current.overlayRiser || { hex:"#999", name:"" },
    overlayTip: current.overlayTip || { hex:"#777", name:"" }
  };
  drawBowShape(ctx, palette);
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
  const data = {
    type: "imperator-build",
    version: 1,
    timestamp: new Date().toISOString(),
    current,
    palette: WOODS
  };
  const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "imperator_swatch_build.json";
  a.click();
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
      }else{
        alert("Invalid file.");
      }
    }catch(err){
      alert("Could not read file.");
    }
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
  el("#newName").value = "";
  el("#newHex").value = "";
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
      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;
    };
  });
}

// Event wiring
document.addEventListener("DOMContentLoaded", async ()=>{
  el("#modelSelect").addEventListener("change", (e)=>{
    current.model = e.target.value;
    drawPreview();
  });
  el("#saveBuild").addEventListener("click", saveBuild);
  el("#loadBuild").addEventListener("click", loadBuild);
  el("#exportJSON").addEventListener("click", exportJSON);
  el("#importJSON").addEventListener("change", (e)=>{
    if(e.target.files?.[0]) importJSON(e.target.files[0]);
  });
  el("#downloadPNG").addEventListener("click", downloadPNG);
  el("#addSwatch").addEventListener("click", addSwatch);

  setupInstall();

  if("serviceWorker" in navigator){
    try{ await navigator.serviceWorker.register("./service-worker.js"); }catch{}
  }
  await loadData();
});
