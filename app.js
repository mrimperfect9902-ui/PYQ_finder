/* UPSC PYQ Concept Finder - local-first prototype */
const DB_NAME="upsc-pyq-finder", DB_VERSION=1;
let db, allQuestions=[], allPapers=[];
const $=id=>document.getElementById(id);
if(window.pdfjsLib){pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";}
const synonyms={
 "fundamental rights":["article 12","article 13","article 14","article 15","article 16","article 17","article 18","article 19","article 20","article 21","article 21a","article 22","article 23","article 24","article 25","article 26","article 27","article 28","article 29","article 30","article 32","writ","constitutional remedy","equality before law","freedom of speech"],
 "directive principles":["dpsp","directive principles of state policy","article 36","article 37","article 39","article 40","article 44","article 48","article 48a","article 50"],
 "monsoon":["south west monsoon","northeast monsoon","retreating monsoon","rainfall","el nino","la nina","itcz","jet stream"],
 "inflation":["consumer price index","cpi","wholesale price index","wpi","monetary policy","repo rate","price rise","deflation"],
 "buddhism":["buddha","four noble truths","eightfold path","tripitaka","sangha","bodhisattva","mahayana","hinayana","vajrayana"],
 "parliament":["lok sabha","rajya sabha","speaker","money bill","ordinary bill","joint sitting","parliamentary committee","article 79","article 110"],
 "biodiversity":["ecosystem","species","endemic","invasive species","biodiversity hotspot","conservation","iucn","wildlife"],
 "federalism":["centre state relations","seventh schedule","union list","state list","concurrent list","inter state council","article 246","article 263"]
};
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const d=req.result;d.createObjectStore("questions",{keyPath:"id"});d.createObjectStore("papers",{keyPath:"id"});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function tx(store,mode="readonly"){return db.transaction(store,mode).objectStore(store);}
function getAll(store){return new Promise((res,rej)=>{let r=tx(store).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
function put(store,obj){return new Promise((res,rej)=>{let r=tx(store,"readwrite").put(obj);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});}
function clearStore(store){return new Promise((res,rej)=>{let r=tx(store,"readwrite").clear();r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
function yearFrom(name){const m=name.match(/20\d{2}|19\d{2}/);return m?Number(m[0]):"";}
function cleanText(s){return s.replace(/\u00a0/g," ").replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").trim();}
function splitQuestions(text){
  const normalized=cleanText(text);
  // Detect common numbered question starts; preserve text between them.
  const re=/(?:^|\n)\s*(?:Q(?:uestion)?\.?\s*)?(\d{1,3})[\.)]\s+/g;
  let matches=[...normalized.matchAll(re)], out=[];
  if(matches.length<3)return [{number:"",text:normalized}];
  for(let i=0;i<matches.length;i++){let start=matches[i].index+(matches[i][0].startsWith("\n")?1:0);let end=i+1<matches.length?matches[i+1].index:normalized.length;let body=normalized.slice(start,end).trim();if(body.length>35)out.push({number:matches[i][1],text:body});}
  return out;
}
function extractOptions(body){
  const idx=body.search(/(?:^|\n)\s*(?:\(?[a-dA-D]\)|[a-dA-D][\.)])\s/);
  return idx>0?{question:body.slice(0,idx).trim(),options:body.slice(idx).trim()}:{question:body,options:""};
}
function guessSubject(text){
  const t=text.toLowerCase();
  const rules=[["Polity",/article \d+|constitution|parliament|president|fundamental right|directive principle|federal|judiciary|governor/],["History",/buddh|mughal|maurya|gupta|indus|harappa|freedom struggle|congress|dynasty/],["Geography",/monsoon|river|mountain|soil|climate|latitude|ocean|plateau|rainfall/],["Economy",/inflation|gdp|fiscal|monetary|repo|bank|tax|budget|current account|balance of payment/],["Environment",/biodiversity|ecosystem|wildlife|national park|forest|species|climate change|wetland/],["Science & Technology",/isotope|vaccine|virus|quantum|satellite|semiconductor|dna|artificial intelligence/],["Art & Culture",/temple|dance|painting|music|architecture|classical language/]];
  for(const [s,r] of rules)if(r.test(t))return s;return "Other";
}
async function processPDF(file){
  if(!window.pdfjsLib)throw Error("PDF reader could not load. Check your internet connection and refresh.");
  const data=await file.arrayBuffer(), pdf=await pdfjsLib.getDocument({data}).promise;
  let pages=[];
  for(let p=1;p<=pdf.numPages;p++){const page=await pdf.getPage(p);const content=await page.getTextContent();pages.push(content.items.map(x=>x.str).join(" "));}
  const text=cleanText(pages.join("\n"));
  const paper={id:uid(),name:file.name,year:yearFrom(file.name),pages:pdf.numPages,chars:text.length,added:new Date().toISOString(),status:text.length<150?"Needs OCR":"Indexed"};
  await put("papers",paper);
  const chunks=splitQuestions(text);
  for(const chunk of chunks){
    const parts=extractOptions(chunk.text);
    const question={id:uid(),paperId:paper.id,year:paper.year||"",number:chunk.number,question:parts.question,options:parts.options,fullText:chunk.text,subject:guessSubject(chunk.text),source:file.name,pageHint:"",bookmarked:false};
    await put("questions",question);
  }
  return {paper,count:chunks.length,chars:text.length};
}
function renderStats(){ $("statQuestions").textContent=allQuestions.length; $("statPapers").textContent=allPapers.length; $("statYears").textContent=new Set(allPapers.map(p=>p.year).filter(Boolean)).size;}
function renderPapers(){
  $("paperList").innerHTML=allPapers.map(p=>`<div class="paper"><div><b>${esc(p.name)}</b><small>${p.pages} pages · ${p.status} · ${p.chars.toLocaleString()} extracted characters</small></div><label>Year <input data-year="${p.id}" type="number" value="${p.year||""}" placeholder="Year"></label><button class="tiny" data-delete-paper="${p.id}">Remove</button></div>`).join("");
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function expandTerms(query){const q=query.toLowerCase().trim(), terms=[q];for(const [key,vals] of Object.entries(synonyms)){if(q===key||key.includes(q)||q.includes(key)||vals.some(v=>v.includes(q)||q.includes(v))){terms.push(key,...vals);}}return [...new Set(terms.filter(Boolean))];}
function search(){
 const q=$("searchInput").value.trim();if(!q){$("resultsMeta").textContent="Enter a concept to search.";return;}
 const terms=expandTerms(q), subject=$("subjectFilter").value, from=Number($("yearFrom").value)||0,to=Number($("yearTo").value)||9999, mode=$("matchFilter").value;
 let scored=allQuestions.map(item=>{const hay=(item.fullText+" "+item.subject).toLowerCase();let score=0, exact=false,related=false;for(const term of terms){if(hay.includes(term)){score+=term===q.toLowerCase()?10:2;if(term===q.toLowerCase())exact=true;else related=true;}}return {...item,score,exact,related};})
 .filter(x=>x.score>0&&(!subject||x.subject===subject)&&Number(x.year||0)>=from&&Number(x.year||0)<=to)
 .filter(x=>mode==="all"||(mode==="exact"?x.exact:!x.exact&&x.related))
 .sort((a,b)=>b.score-a.score||Number(b.year)-Number(a.year));
 $("resultsMeta").textContent=`${scored.length} matching question(s) · Search terms: ${terms.slice(0,8).join(", ")}${terms.length>8?"…":""}`;
 $("results").innerHTML=scored.slice(0,150).map(x=>`<article class="result"><div class="result-top"><span class="year">${x.year||"Year not set"} · Q${x.number||"—"}</span><span class="match">${x.exact?"Exact / keyword match":"Related concept match"} · ${esc(x.subject)}</span></div><div class="question">${esc(x.question||x.fullText)}</div>${x.options?`<div class="options">${esc(x.options)}</div>`:""}<div class="source">Source: ${esc(x.source)} ${x.pageHint?"· "+esc(x.pageHint):""}</div><div class="result-actions"><button class="tiny" data-bookmark="${x.id}">${x.bookmarked?"★ Saved":"☆ Save for revision"}</button><button class="tiny" data-copy="${x.id}">Copy question</button></div></article>`).join("")||'<div class="empty">No matching questions found. Try a broader concept or upload more papers.</div>';
}
async function refresh(){allQuestions=await getAll("questions");allPapers=await getAll("papers");renderStats();renderPapers();}
$("chooseBtn").onclick=()=>$("pdfInput").click();
$("pdfInput").onchange=async e=>{const files=[...e.target.files];for(const f of files){$("uploadStatus").textContent=`Processing ${f.name}…`;try{const r=await processPDF(f);$("uploadStatus").textContent+=` Done: ${r.count} question block(s) detected.`;}catch(err){$("uploadStatus").textContent=`${f.name}: ${err.message}`;}}e.target.value="";await refresh();};
const dz=$("dropzone");dz.ondragover=e=>{e.preventDefault();dz.style.background="#eef3ff";};dz.ondragleave=()=>dz.style.background="";dz.ondrop=e=>{e.preventDefault();dz.style.background="";$("pdfInput").files=e.dataTransfer.files;$("pdfInput").dispatchEvent(new Event("change"));};
$("searchBtn").onclick=search;$("searchInput").addEventListener("keydown",e=>{if(e.key==="Enter")search();});
$("results").addEventListener("click",async e=>{const b=e.target.closest("[data-bookmark]");if(b){const q=allQuestions.find(x=>x.id===b.dataset.bookmark);q.bookmarked=!q.bookmarked;await put("questions",q);await refresh();search();}const c=e.target.closest("[data-copy]");if(c){const q=allQuestions.find(x=>x.id===c.dataset.copy);await navigator.clipboard.writeText(`${q.year} Q${q.number}\n${q.fullText}\nSource: ${q.source}`);c.textContent="Copied";}});
$("paperList").addEventListener("change",async e=>{if(e.target.dataset.year){const p=allPapers.find(x=>x.id===e.target.dataset.year);p.year=Number(e.target.value)||"";await put("papers",p);for(const q of allQuestions.filter(x=>x.paperId===p.id)){q.year=p.year;await put("questions",q);}await refresh();search();}});
$("paperList").addEventListener("click",async e=>{const b=e.target.closest("[data-delete-paper]");if(b&&confirm("Remove this PDF and all questions extracted from it?")){const id=b.dataset.deletePaper;await clearMatching(id);await refresh();search();}});
async function clearMatching(id){for(const q of allQuestions.filter(x=>x.paperId===id)){await new Promise(r=>{const req=tx("questions","readwrite").delete(q.id);req.onsuccess=r;});}await new Promise(r=>{const req=tx("papers","readwrite").delete(id);req.onsuccess=r;});}
$("exportBtn").onclick=async()=>{const data={app:"UPSC PYQ Concept Finder",version:1,exportedAt:new Date().toISOString(),papers:allPapers,questions:allQuestions};const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});download(blob,"upsc-pyq-backup.json");};
$("importInput").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!Array.isArray(data.questions)||!Array.isArray(data.papers))throw Error("Invalid backup file");for(const p of data.papers)await put("papers",p);for(const q of data.questions)await put("questions",q);await refresh();alert("Backup imported.");}catch(err){alert("Could not import backup: "+err.message);}e.target.value="";};
function download(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href);}
$("clearBtn").onclick=async()=>{if(confirm("Permanently delete all locally stored papers and questions? Export a backup first if needed.")){await clearStore("questions");await clearStore("papers");await refresh();$("results").innerHTML="";$("resultsMeta").textContent="Local database cleared.";}}
$("installBtn").onclick=async()=>{if(window.installPrompt){window.installPrompt.prompt();window.installPrompt=null;}};
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();window.installPrompt=e;$("installBtn").classList.remove("hidden");});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
(async()=>{db=await openDB();await refresh();})();
