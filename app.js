const $ = id => document.getElementById(id);
const defaults = {url:"", model:"", key:"", system:"You are AMAKA AI, a helpful, warm, confident African-inspired personal assistant. Be clear, practical and conversational. Do not pretend to have access to information or device functions you do not have."};
let config = {...defaults};
let history = [];
let recognition = null;

function setState(state, label) {
  document.body.classList.remove("listening","thinking","speaking");
  if (state) document.body.classList.add(state);
  $("stateLabel").textContent = label;
}
function addMessage(role, content) {
  const article = document.createElement("article");
  article.className = "message " + (role === "user" ? "user" : "assistant");
  const name = document.createElement("span"); name.className = "speaker";
  name.textContent = role === "user" ? "YOU" : "AMAKA";
  const p = document.createElement("p"); p.textContent = content;
  article.append(name,p); $("messages").append(article);
  $("messages").scrollTop = $("messages").scrollHeight;
}
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.96; utterance.pitch = 0.92;
  utterance.onstart = () => setState("speaking","SPEAKING");
  utterance.onend = () => setState("","STANDBY");
  window.speechSynthesis.speak(utterance);
}
function demoReply(prompt) {
  return "I received your message: “" + prompt + "”. My visual interface and voice are working, but I am still in demo mode. Open Settings to connect a local language model.";
}
async function ask(prompt) {
  const text = prompt.trim(); if (!text) return;
  addMessage("user", text); $("promptInput").value = "";
  history.push({role:"user",content:text});
  setState("thinking","THINKING");
  try {
    if (!config.url) throw new Error("DEMO");
    const headers = {"Content-Type":"application/json"};
    if (config.key) headers.Authorization = "Bearer " + config.key;
    const response = await fetch(config.url, {
      method:"POST", headers,
      body:JSON.stringify({
        model: config.model || "local-model",
        messages:[{role:"system",content:config.system},...history.slice(-16)],
        temperature:0.7, max_tokens:400, stream:false
      })
    });
    if (!response.ok) throw new Error("Local server returned HTTP " + response.status);
    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || data.response || data.content;
    if (!answer) throw new Error("The server responded, but no assistant text was found.");
    history.push({role:"assistant",content:answer});
    addMessage("assistant",answer); setState("","STANDBY"); speak(answer);
  } catch (err) {
    const answer = err.message === "DEMO" ? demoReply(text) :
      "I couldn't reach the local model. " + err.message + ". Check the API URL, server status and Android network permissions.";
    addMessage("assistant",answer); setState("","CONNECTION NEEDED");
    if (err.message !== "DEMO") $("connectionLabel").textContent = "MODEL CONNECTION ERROR";
  }
}
$("sendBtn").addEventListener("click",()=>ask($("promptInput").value));
$("promptInput").addEventListener("keydown",e=>{if(e.key==="Enter")ask($("promptInput").value)});
$("settingsBtn").addEventListener("click",()=>{
  $("apiUrl").value=config.url; $("modelName").value=config.model; $("apiKey").value=config.key; $("systemPrompt").value=config.system;
  $("settingsStatus").textContent=config.url?"Settings loaded.":"No local model connected yet.";
  $("settingsDialog").showModal();
});
$("saveBtn").addEventListener("click",()=>{
  config={url:$("apiUrl").value.trim(),model:$("modelName").value.trim(),key:$("apiKey").value,system:$("systemPrompt").value.trim()||defaults.system};
  $("connectionLabel").textContent=config.url?"LOCAL MODEL CONFIGURED":"DEMO MODE";
});
$("testBtn").addEventListener("click",async()=>{
  const url=$("apiUrl").value.trim(); const status=$("settingsStatus");
  if(!url){status.textContent="Enter your local API URL first.";return;}
  status.textContent="Testing connection…";
  try{
    const h={"Content-Type":"application/json"}; if($("apiKey").value)h.Authorization="Bearer "+$("apiKey").value;
    const r=await fetch(url,{method:"POST",headers:h,body:JSON.stringify({model:$("modelName").value||"local-model",messages:[{role:"user",content:"Reply with exactly: AMAKA ONLINE"}],max_tokens:20})});
    if(!r.ok)throw new Error("HTTP "+r.status);
    const d=await r.json(); status.textContent="Connected. Model replied: "+(d.choices?.[0]?.message?.content||"response received");
  }catch(e){status.textContent="Connection failed: "+e.message+". HTTPS websites may be blocked from calling HTTP localhost.";}
});
$("micBtn").addEventListener("click",()=>{
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SpeechRecognition){addMessage("assistant","Voice recognition isn't available in this browser. You can still type, and spoken replies use Android text-to-speech.");return;}
  if(recognition){recognition.stop();recognition=null;return;}
  recognition=new SpeechRecognition(); recognition.lang="en-US"; recognition.interimResults=false; recognition.maxAlternatives=1;
  recognition.onstart=()=>setState("listening","LISTENING"); recognition.onresult=e=>{const said=e.results[0][0].transcript;$("promptInput").value=said;ask(said);};
  recognition.onerror=e=>{setState("","MICROPHONE ERROR");addMessage("assistant","Microphone issue: "+e.error);};
  recognition.onend=()=>{recognition=null;if(document.body.classList.contains("listening"))setState("","STANDBY");};
  recognition.start();
});
if("serviceWorker" in navigator && location.protocol.startsWith("http")) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
