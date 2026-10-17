(function(){
"use strict";
const D = window.DILUSSO;
const ASSETS = window.DILUSSO_ASSETS || {};          // filled only in the single-file preview build
const src = p => ASSETS[p] || p;
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const WA = "https://wa.me/" + D.contact.wa;
const waLink = text => WA + "?text=" + encodeURIComponent(text);
const byId = Object.fromEntries(D.products.map(p => [p.id, p]));
const catById = Object.fromEntries(D.categories.map(c => [c.id, c]));
const imgTag = (p, cls="") => `<img src="${src(p.img)}" alt="${esc(p.name)}" class="${p.photo ? "ph " : ""}${cls}" loading="lazy">`;

/* ---------- storage (best effort) ---------- */
const store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};

/* ---------- toast & copy ---------- */
let tt;
function toast(m){ const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 2300); }
async function copy(text, label){
  try{ await navigator.clipboard.writeText(text); toast(label || "Copied " + text); }
  catch(e){ toast("Copy is blocked here. Number: " + D.contact.phone); }
}
document.addEventListener("click", e => { const b = e.target.closest("[data-copy]"); if(b) copy(b.dataset.copy); });

/* ---------- images marked data-src ---------- */
$$("img[data-src]").forEach(i => i.src = src(i.dataset.src));
$$('img[src^="images/"]').forEach(i => i.src = src(i.getAttribute("src")));

/* ---------- router ---------- */
const PAGES = ["home","products","studio","global","about","contact"];
let currentCat = "all";
function route(){
  const h = (location.hash || "#home").slice(1);
  let [page, sub] = h.split(/-(.+)/);
  if(!PAGES.includes(page)) page = "home";
  if(page === "products"){ currentCat = catById[sub] ? sub : (sub === undefined ? currentCat : "all"); renderCatalog(); }
  $$(".page").forEach(el => el.classList.toggle("on", el.dataset.page === page));
  $$("nav.main a").forEach(a => a.dataset.nav === page ? a.setAttribute("aria-current","page") : a.removeAttribute("aria-current"));
  $("#band").hidden = page === "contact";
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);

/* ---------- home: categories, countries ---------- */
function renderHome(){
  $("#statLines").textContent = D.categories.length;
  $("#catGrid").innerHTML = D.categories.map(c => {
    const items = D.products.filter(p => p.cat === c.id);
    const pics = items.slice(0, 3);
    while(pics.length < 3) pics.push(items[0]);
    return `<a class="cat" href="#products-${c.id}">
      <div class="pics">${pics.map(p => imgTag(p)).join("")}</div>
      <div class="body"><div><h3>${c.name}</h3><span class="ar">${c.ar}</span><span class="n">${items.length} products</span></div>
      <span class="arrow"><svg width="16" height="16"><use href="#i-arrow"/></svg></span></div></a>`;
  }).join("");
  const countries = D.countries.map(c => `<div class="country ${c.id}"><span class="code">${c.id}</span><b>${c.name} <span class="ar" style="font-weight:400;color:var(--muted);font-size:.9rem">${c.ar}</span></b><span class="role">${c.role}</span><p>${c.text}</p></div>`).join("");
  $("#countryList").innerHTML = countries;
  $("#countryList2").innerHTML = countries;
  $("#showrooms").innerHTML = D.muscat.map((b, i) => `<div class="showroom"><span class="n">Branch ${String(i+1).padStart(2,"0")}</span><b>${b.area}</b><span>${b.note}</span>
    <a href="https://www.google.com/maps/search/${encodeURIComponent("Dilusso " + b.area + " Muscat Oman")}" target="_blank" rel="noopener">Directions ↗</a></div>`).join("");
  $("#footCats").outerHTML = D.categories.slice(0, 6).map(c => `<a href="#products-${c.id}">${c.name}</a>`).join("");
}

/* ---------- catalogue ---------- */
let query = "";
function renderCatalog(){
  const counts = {}; D.products.forEach(p => counts[p.cat] = (counts[p.cat] || 0) + 1);
  $("#side").innerHTML = [`<button type="button" data-cat="all" aria-pressed="${currentCat==="all"}"><span>All products</span><span>${D.products.length}</span></button>`]
    .concat(D.categories.map(c => `<button type="button" data-cat="${c.id}" aria-pressed="${currentCat===c.id}"><span>${c.name}</span><span>${counts[c.id]||0}</span></button>`)).join("");
  const c = catById[currentCat];
  $("#catIntro").innerHTML = query.trim() ? `<h2>Results for “${esc(query.trim())}”</h2><p>Searching all product lines.</p>` : c ? `<span class="eyebrow">${c.ar}</span><h2>${c.name}</h2><p>${c.blurb}</p>` : `<h2>All products</h2><p>${D.products.length} items across ${D.categories.length} product lines.</p>`;
  const q = query.trim().toLowerCase();
  const list = D.products.filter(p => (q || currentCat === "all" || p.cat === currentCat) &&
    (!q || (p.name + " " + p.id + " " + p.desc + " " + catById[p.cat].name + " " + p.specs.map(s => s.join(" ")).join(" ")).toLowerCase().includes(q)));
  const inList = new Set(Object.keys(enq));
  $("#grid").innerHTML = list.length ? list.map(p => `
    <article class="prod">
      <button class="img" type="button" data-detail="${p.id}" aria-label="Details for ${esc(p.name)}">${imgTag(p)}</button>
      <div class="info">
        <span class="code">${p.id} · ${catById[p.cat].name}</span>
        <h3>${p.name}</h3>
        <div class="chips">${p.specs.slice(0, 2).map(s => `<span class="chip">${esc(s[1])}</span>`).join("")}</div>
        <div class="acts"><button class="btn sm" type="button" data-detail="${p.id}">Details</button>
        <button class="btn sm ${inList.has(p.id) ? "added" : ""}" type="button" data-add="${p.id}">${inList.has(p.id) ? "In list ✓" : "+ Enquiry"}</button></div>
      </div>
    </article>`).join("") : `<div class="empty" style="grid-column:1/-1">No products match “${esc(query)}”. Try another word, or <a href="${waLink("Hello Dilusso, I'm looking for: " + query)}" target="_blank" rel="noopener">ask us on WhatsApp</a>.</div>`;
}
$("#side").addEventListener("click", e => { const b = e.target.closest("[data-cat]"); if(!b) return; currentCat = b.dataset.cat; history.replaceState(null, "", currentCat === "all" ? "#products" : "#products-" + currentCat); renderCatalog(); });
$("#q").addEventListener("input", e => { query = e.target.value; renderCatalog(); });

/* ---------- product modal ---------- */
let open = null;
function showProduct(id){
  const p = byId[id]; if(!p) return; open = id;
  $("#mImg").src = src(p.img); $("#mImg").alt = p.name; $("#mImg").className = p.photo ? "ph" : "";
  $("#mCat").textContent = catById[p.cat].name + " · " + catById[p.cat].ar;
  $("#mName").textContent = p.name; $("#mCode").textContent = "Code " + p.id;
  $("#mDesc").textContent = p.desc;
  $("#mSpecs").innerHTML = p.specs.map(s => `<tr><td>${esc(s[0])}</td><td>${esc(s[1])}</td></tr>`).join("");
  $("#mWa").href = waLink(`Hello Dilusso, I'd like the price and availability of:\n${p.name} (${p.id})`);
  syncAddBtn();
  $("#modal").classList.add("on"); $("#scrim").classList.add("on");
}
function syncAddBtn(){ const b = $("#mAdd"); const has = open && enq[open]; b.classList.toggle("added", !!has); b.lastChild.textContent = has ? "In your list ✓" : "Add to enquiry list"; }
function closeAll(){ $("#modal").classList.remove("on"); $("#drawer").classList.remove("on"); $("#scrim").classList.remove("on"); open = null; }
$("#scrim").addEventListener("click", closeAll);
document.addEventListener("keydown", e => { if(e.key === "Escape") closeAll(); });
document.addEventListener("click", e => {
  if(e.target.closest("[data-close]")) return closeAll();
  const d = e.target.closest("[data-detail]"); if(d){ showProduct(d.dataset.detail); return; }
  const a = e.target.closest("[data-add]"); if(a){ addToList(a.dataset.add, 1); renderCatalog(); return; }
  const o = e.target.closest("[data-open]"); if(o){ setTimeout(() => showProduct(o.dataset.open), 50); }
});
$("#mAdd").addEventListener("click", () => { if(!open) return; if(enq[open]) delete enq[open]; else enq[open] = 1; saveList(); syncAddBtn(); renderCatalog(); });

/* ---------- enquiry list ---------- */
let enq = store.get("dilusso-enquiry", {});
Object.keys(enq).forEach(k => { if(!byId[k]) delete enq[k]; });
function saveList(){ store.set("dilusso-enquiry", enq); renderList(); }
function addToList(id, n){ enq[id] = (enq[id] || 0) + n; saveList(); toast(byId[id].name + " added to your enquiry list"); }
function listText(){
  const lines = Object.entries(enq).map(([id, n]) => `• ${byId[id].name} (${id}) × ${n}`);
  const note = $("#listNote").value.trim();
  return `Hello Dilusso, please send prices and availability for:\n${lines.join("\n")}${note ? "\n\nNotes: " + note : ""}`;
}
function renderList(){
  const ids = Object.keys(enq), total = ids.reduce((s, k) => s + enq[k], 0);
  $("#listCount").hidden = !ids.length; $("#listCount").textContent = total;
  $("#dlist").innerHTML = ids.length ? ids.map(id => { const p = byId[id]; return `<div class="dl-item">${imgTag(p)}<div><b>${p.name}</b><small>${p.id}</small></div>
    <div class="qty"><button type="button" data-lq="${id}" data-d="-1" aria-label="Fewer">−</button><output>${enq[id]}</output><button type="button" data-lq="${id}" data-d="1" aria-label="More">+</button></div></div>`; }).join("")
    : `<div class="empty" style="margin-top:16px">Your list is empty. Add products from the catalogue or the Design Studio, then send the list to Dilusso in one WhatsApp message.</div>`;
  $("#listWa").href = waLink(listText());
  $("#listWa").style.pointerEvents = ids.length ? "" : "none"; $("#listWa").style.opacity = ids.length ? "" : ".5";
}
$("#dlist").addEventListener("click", e => { const b = e.target.closest("[data-lq]"); if(!b) return; const id = b.dataset.lq; enq[id] = (enq[id] || 0) + +b.dataset.d; if(enq[id] <= 0) delete enq[id]; saveList(); renderCatalog(); });
$("#listNote").addEventListener("input", () => { $("#listWa").href = waLink(listText()); });
$("#openList").addEventListener("click", () => { renderList(); $("#drawer").classList.add("on"); $("#scrim").classList.add("on"); });
$("#listCopy").addEventListener("click", () => copy(listText(), "Enquiry list copied"));
$("#listClear").addEventListener("click", () => { enq = {}; saveList(); renderCatalog(); toast("List cleared"); });

/* ---------- Design Studio ---------- */
const ROOMS = {
  kitchen:{n:"Kitchen",ar:"المطبخ",fit:[["DH-110",24],["DD-SB",6],["DB-3T",1],["DB-MC",1],["DB-TP",0],["DB-US",1],["DS-1B",1],["DF-PC",1],["DR-CH",1],["DL-LU",2]]},
  living:{n:"Living",ar:"الصالة",fit:[["DH-110",8],["DD-UM",2],["DL-LU",2],["DA-BH",6],["DP-GR",1]]},
  bedroom:{n:"Bedroom",ar:"غرفة النوم",fit:[["DH-110",12],["DL-WR",1],["DD-IN",2],["DW-HL",1],["DA-BH",4],["DP-FL",1]]},
  dining:{n:"Dining",ar:"غرفة الطعام",fit:[["DH-110",6],["DD-UM",2],["DA-BH",6],["DP-WN",1]]},
  majlis:{n:"Majlis",ar:"المجلس",fit:[["DP-WN",2],["DH-110",4],["DD-UM",2],["DA-BH",4]]}
};
const STYLES = {
  omani:{n:"Modern Omani",d:"Warm timber, earthy tones",wall:"sand",wood:"walnut",hw:"black",light:"evening"},
  classic:{n:"Classic Arabesque",d:"Brass, rich wood, detail",wall:"none",wood:"walnut",hw:"gold",light:"evening"},
  coastal:{n:"Coastal Sur",d:"Sea tones, pale oak",wall:"sea",wood:"oak",hw:"steel",light:"day"},
  minimal:{n:"Minimal Muscat",d:"Clean lines, bold accents",wall:"none",wood:"white",hw:"steel",light:"day"}
};
const WALLS = {none:["Original colours","transparent"],sand:["Wahiba Sand","#C9A777"],clay:["Nizwa Clay","#A85F3E"],sea:["Sur Sea","#2E7B78"],jebel:["Jebel Grey","#6F7A80"],frank:["Frankincense White","#EDE6D6"],red:["Dilusso Red","#E1141C"],date:["Date Palm","#5A3A22"]};
const WOODS = {
  white:["Matt White","linear-gradient(135deg,#FFFFFF,#E3E6E9)","brightness(1.05) saturate(.92)"],
  oak:["Natural Oak","linear-gradient(100deg,#C9A57A,#D8B78C 30%,#BF9C70 55%,#D3B185 80%,#C4A075)",""],
  walnut:["Walnut","linear-gradient(100deg,#4E3423,#6A4831 25%,#4A3020 50%,#674530 75%,#4F3424)","sepia(.18) saturate(1.1) brightness(.94)"],
  graphite:["Graphite","linear-gradient(135deg,#5A5F66,#2F3337)","saturate(.7) contrast(1.06)"],
  ebony:["Ebony","linear-gradient(100deg,#1F1A17,#2E2622 30%,#1B1613 60%,#2A231F)","contrast(1.1) brightness(.9) saturate(.95)"]
};
const HWS = {steel:["Brushed steel","linear-gradient(135deg,#F2F4F6,#AEB6BE 50%,#E2E6E9)"],black:["Matte black","linear-gradient(135deg,#3C3F44,#0E0F11)"],gold:["Champagne gold","linear-gradient(135deg,#F1DDB0,#C9A462 55%,#9C7A3E)"],gun:["Gunmetal","linear-gradient(135deg,#8A9097,#4C5258)"]};
const LIGHTS = {day:["Daylight","brightness(1.06) saturate(1.05)",0,0],evening:["Warm evening","sepia(.3) saturate(1.2) brightness(.97)",1,.3],night:["Night","brightness(.72) contrast(1.12) sepia(.35) saturate(1.25)",1,1]};
const roomPhoto = (room, style) => src(`images/rooms/${room}-${style}.jpg`);

const DEF = {room:"kitchen",style:"omani",custom:false,wall:"sand",wood:"walnut",hw:"black",light:"evening",str:35,size:18,cut:40,qty:{}};
let S;
function loadS(){ const s = store.get("dilusso-studio", null); return (s && ROOMS[s.room] && STYLES[s.style] && WOODS[s.wood] && HWS[s.hw]) ? Object.assign(structuredClone(DEF), s) : structuredClone(DEF); }
const saveS = () => store.set("dilusso-studio", S);
const q = (room, i) => S.qty[room + i] ?? ROOMS[room].fit[i][1];

function buildStudio(){
  $("#rooms").innerHTML = Object.entries(ROOMS).map(([k, r]) => `<button type="button" class="room-btn" data-room="${k}"><img alt=""><span>${r.n}</span></button>`).join("");
  $("#styles").innerHTML = Object.entries(STYLES).map(([k, s]) => `<button type="button" class="style-btn" data-style="${k}"><b>${s.n}</b><small>${s.d}</small></button>`).join("");
  $("#walls").innerHTML = Object.entries(WALLS).map(([k, w]) => `<button type="button" class="swatch${k==="none"?" none":""}" data-wall="${k}" title="${w[0]}" aria-label="${w[0]}" style="background:${w[1]}"></button>`).join("");
  $("#woods").innerHTML = Object.entries(WOODS).map(([k, w]) => `<button type="button" class="swatch sq" data-wood="${k}" title="${w[0]}" aria-label="${w[0]}" style="background:${w[1]}"></button>`).join("");
  $("#hws").innerHTML = Object.entries(HWS).map(([k, w]) => `<button type="button" class="swatch" data-hw="${k}" title="${w[0]}" aria-label="${w[0]}" style="background:${w[1]}"></button>`).join("");
  $("#lights").innerHTML = Object.entries(LIGHTS).map(([k, l]) => `<button type="button" data-light="${k}">${l[0]}</button>`).join("");
  $("#looks").innerHTML = Object.entries(STYLES).map(([k, s]) => `<button type="button" class="look" data-look="${k}"><img alt=""><span>${s.n}</span></button>`).join("");
}
const press = (sel, attr, val) => $$(sel).forEach(b => b.setAttribute("aria-pressed", String(b.dataset[attr] === val)));

let shown = "";
function setPhoto(url, alt){
  if(shown === url) return;
  const stage = $("#stage"), a = $("#imgBase"), b = $("#imgCustom");
  if(!shown){ a.src = b.src = url; shown = url; return; }
  shown = url; stage.classList.add("swap");
  setTimeout(() => {
    a.src = url; b.src = url; a.alt = alt + ", original photo"; b.alt = alt + ", with your selections";
    const done = () => stage.classList.remove("swap");
    if(b.complete) requestAnimationFrame(done); else b.onload = done;
  }, 180);
}

function renderStudio(){
  const R = ROOMS[S.room], ST = STYLES[S.style], W = WALLS[S.wall], WD = WOODS[S.wood], H = HWS[S.hw], L = LIGHTS[S.light];
  press("[data-room]","room",S.room); press("[data-style]","style",S.style); press("[data-look]","look",S.style); press("[data-wall]","wall",S.wall);
  press("[data-wood]","wood",S.wood); press("[data-hw]","hw",S.hw); press("[data-light]","light",S.light);
  $$("[data-room] img").forEach(i => { const u = roomPhoto(i.parentElement.dataset.room, S.style); if(i.getAttribute("src") !== u) i.src = u; });
  $$("[data-look] img").forEach(i => { const u = roomPhoto(S.room, i.parentElement.dataset.look); if(i.getAttribute("src") !== u) i.src = u; });
  setPhoto(roomPhoto(S.room, S.style), R.n + " in " + ST.n + " style");
  $("#imgCustom").style.filter = [L[1], WD[2]].filter(Boolean).join(" ");
  $("#tint").style.background = W[1]; $("#tint").style.opacity = S.wall === "none" ? 0 : S.str / 100;
  $("#glow").style.opacity = L[2]; $("#vig").style.opacity = L[3];
  $("#stage").style.setProperty("--cut", S.cut + "%"); $("#cut").value = S.cut;
  $("#str").value = S.str; $("#str").disabled = S.wall === "none"; $("#size").value = S.size;
  const styleName = ST.n + (S.custom ? " · customised" : "");
  $("#vStyle").textContent = styleName; $("#vLook").textContent = ST.n; $("#vWall").textContent = W[0]; $("#vWood").textContent = WD[0]; $("#vHw").textContent = H[0];
  $("#vStr").textContent = S.wall === "none" ? "off" : S.str + "%"; $("#vSize").textContent = S.size + " m²";
  $("#stamp").innerHTML = [R.n + " · " + R.ar, ST.n, W[0], WD[0], H[0], L[0]].map(t => `<span>${t}</span>`).join("");
  $("#mood").innerHTML = [["Walls",W[0],S.wall==="none"?"linear-gradient(135deg,#fff,#E8EAED)":W[1]],["Cabinets",WD[0],WD[1]],["Hardware",H[0],H[1]],["Light",L[0],S.light==="day"?"linear-gradient(180deg,#F6F3EA,#DCE6EE)":S.light==="evening"?"linear-gradient(180deg,#F3C982,#B9712F)":"linear-gradient(180deg,#2B2440,#C08A3E)"]]
    .map(m => `<div class="sw"><i style="background:${m[2]}"></i><div><small>${m[0]}</small><b>${m[1]}</b></div></div>`).join("");
  let count = 0; const lines = [];
  $("#items").innerHTML = R.fit.map(([id], i) => {
    const p = byId[id], n = q(S.room, i); count += n; if(n) lines.push(`• ${p.name} (${id}) × ${n}`);
    return `<div class="item ${n ? "" : "off"}">${imgTag(p)}<div class="nm">${p.name}<small>${id}</small></div>
      <div class="qty"><button type="button" data-q="${i}" data-d="-1" aria-label="Fewer ${esc(p.name)}">−</button><output>${n}</output><button type="button" data-q="${i}" data-d="1" aria-label="More ${esc(p.name)}">+</button></div></div>`;
  }).join("");
  $("#vCount").textContent = count + " items";
  const brief = `DILUSSO DESIGN BRIEF
Room: ${R.n} (${S.size} m²)
Style: ${styleName}
Walls: ${W[0]}
Cabinets: ${WD[0]} · Hardware: ${H[0]}
Lighting: ${L[0]}
Fittings:
${lines.join("\n") || "• (none selected)"}
Please send a quotation.`;
  $("#brief").textContent = brief;
  $("#waBrief").href = waLink(brief);
  S._brief = brief; saveS();
}
function applyStyle(k){ const st = STYLES[k]; S.style = k; S.custom = false; S.wall = st.wall; S.wood = st.wood; S.hw = st.hw; S.light = st.light; }
function wireStudio(){
  $("#studioApp").addEventListener("click", e => {
    const b = e.target.closest("button"); if(!b) return; const d = b.dataset;
    if(d.style) applyStyle(d.style);
    else if(d.look) S.style = d.look;
    else if(d.wall){ S.wall = d.wall; S.custom = true; }
    else if(d.wood){ S.wood = d.wood; S.custom = true; }
    else if(d.hw){ S.hw = d.hw; S.custom = true; }
    else if(d.light) S.light = d.light;
    else if(d.room) S.room = d.room;
    else if(d.q !== undefined){ const i = +d.q; S.qty[S.room + i] = Math.max(0, Math.min(99, q(S.room, i) + +d.d)); }
    else return;
    renderStudio();
  });
  $("#cut").addEventListener("input", e => { S.cut = +e.target.value; $("#stage").style.setProperty("--cut", S.cut + "%"); });
  $("#cut").addEventListener("change", saveS);
  $("#str").addEventListener("input", e => { S.str = +e.target.value; S.custom = true; renderStudio(); });
  $("#size").addEventListener("input", e => { S.size = +e.target.value; renderStudio(); });
  $("#copyBrief").addEventListener("click", () => copy(S._brief, "Design brief copied"));
  $("#toList").addEventListener("click", () => {
    let added = 0;
    ROOMS[S.room].fit.forEach(([id], i) => { const n = q(S.room, i); if(n){ enq[id] = (enq[id] || 0) + n; added++; } });
    saveList(); renderCatalog(); toast(added ? `${added} fittings added to your enquiry list` : "Choose at least one fitting first");
  });
  $("#reset").addEventListener("click", () => { S = structuredClone(DEF); renderStudio(); toast("Studio reset"); });
}

/* ---------- contact form ---------- */
$("#form").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("#fName").value.trim(), ph = $("#fPhone").value.replace(/[\s-]/g, "");
  $("#eName").textContent = name ? "" : "Enter your name so our team knows who to ask for.";
  const okPh = /^(\+?968)?[279]\d{7}$/.test(ph);
  $("#ePhone").textContent = okPh ? "" : "Enter an 8-digit Omani number, e.g. 9910 7600.";
  if(!name || !okPh) return;
  const msg = `Hello Dilusso,\nName: ${name}\nMobile: ${ph}\nI am a: ${$("#fType").value}\nInterested in: ${$("#fNeed").value}\n${$("#fMsg").value.trim()}`;
  $("#waForm").href = waLink(msg);
  $("#done").hidden = false;
});

/* ---------- boot ---------- */
renderHome();
buildStudio(); S = loadS(); wireStudio(); renderStudio();
renderList(); renderCatalog(); route();
})();
