import{b as d,f as y,t as J}from"../chunks/1xDYMsv7.js";import{ag as Qe,ai as E,p as _e,t as m,Q as e,ah as Ve,ak as r,an as k,aj as o,al as a,ao as Ke,am as Pe}from"../chunks/CcnWlipk.js";import{d as Ze,a as I,s as c}from"../chunks/BYSZAdUn.js";import{i as x}from"../chunks/Bhm47Ww1.js";import{e as Q,i as V}from"../chunks/BQV0Be4p.js";import{r as $e,s as Ce}from"../chunks/Voixi2NJ.js";import{s as K}from"../chunks/DSRFdqZ5.js";import{b as Je}from"../chunks/DlTYNGVX.js";import{b as Ae}from"../chunks/DbekpjWC.js";import{a as Xe}from"../chunks/CoFwl0L4.js";const ve=[{id:"getting-started",title:"Getting Started",icon:"🚀",badge:"Basics",summary:"What is Phoenix, how it differs from normal chatbots, and your first prompt steps."},{id:"memory",title:"Memory & Diary",icon:"🧠",badge:"Core",summary:"The 3 drawers of memory, how notes are saved, encrypted, and remembered over time."},{id:"ai-engines",title:"AI Engines",icon:"⚡",badge:"Models",summary:"Local offline AI with Ollama vs Cloud AI, model recommendations, and switching engines."},{id:"privacy-senses",title:"Privacy & Senses",icon:"🛡️",badge:"Security",summary:"Screen awareness, desk presence, Tailscale private networking, and local data residency."},{id:"backup-safety",title:"Backup & Safety",icon:"💾",badge:"Safety",summary:"How encryption keys protect your notes and how to backup or restore your memory."},{id:"troubleshooting",title:"Troubleshooting & Fixes",icon:"🔧",badge:"Remedies",summary:"One-click fixes for sleeping AI engines, missing models, and busy databases."}],et=[{id:"what-is-phoenix",category:"getting-started",title:"What is Phoenix?",badge:"Introduction",summary:"A personal AI assistant that lives on your PC and remembers your work instead of having amnesia.",keywords:["phoenix","what is","amnesia","personal ai","assistant","diary","desktop","introduction"],content:`
Normal website chatbots are like smart strangers with amnesia. Every time you open a new chat window, they completely forget who you are, what projects you are working on, and what you decided yesterday.

Phoenix is designed to be completely different:
• **It stays with you over time:** It keeps an encrypted diary of what you do and learn on your computer.
• **It has continuous memory:** When you talk to it next week, it remembers what you decided last Friday.
• **It lives on your computer:** Its files, memories, and thoughts live right on your own PC's hard drive, not on a faraway company server.
• **It has senses:** It can notice which window is open on your screen and check whether you are sitting at your desk.
• **It reaches other devices:** It can talk to your Android phone, other PCs, and smart home lights over a private connection.
    `,action:{type:"navigate",label:"Open Chat & Try Asking",target:"/v2/terminal"}},{id:"body-vs-brain",category:"getting-started",title:"The Brain vs. The Body",badge:"Concepts",summary:"Understanding the relationship between Phoenix and AI models like Gemma, Llama, or Claude.",keywords:["brain","body","ollama","gemma","llama","claude","architecture","concept"],content:`
A lot of people ask: *"Is Phoenix the AI?"*

The easiest way to understand it is:
• **The AI Model (The Brain):** An AI model (like Llama 3.2 or Claude) is the language engine that reads notes, reasons, and writes sentences.
• **Phoenix (The Body):** Phoenix is the body, memory, and hands. It notices your screen, files notes into an encrypted diary, and runs commands on your computer.

Without Phoenix, an AI model has no memory and cannot see your computer. Without an AI model, Phoenix could save notes but could not understand or reply in natural language. Together, they form a complete personal assistant.
    `,action:{type:"navigate",label:"View AI Settings",target:"/v2/settings"}},{id:"everyday-prompts",category:"getting-started",title:"Everyday Prompts & Cheatsheet",badge:"Examples",summary:"Practical phrases you can use right now to save facts, search history, and control tasks.",keywords:["prompts","examples","cheatsheet","how to use","questions","remember","recall"],content:`
You do not need special technical commands to speak to Phoenix. Talk to it like a colleague:

**Save a fact or decision:**
• *"Remember that the team presentation is rescheduled to Friday at 3 PM."*
• *"Remember that I prefer dark mode and Chicago-style paper citations."*

**Recall past information:**
• *"When did we say the team presentation was?"*
• *"What were the requirements for my school project?"*

**Check where you left off:**
• *"What was I working on before lunch?"*
• *"Summarize what happened on my computer this afternoon."*

**Computer & Smart Home:**
• *"Did the backup finish on my desktop?"*
• *"Turn on the desk lamp."*
    `,action:{type:"navigate",label:"Try a Prompt in Terminal",target:"/v2/terminal"}},{id:"three-ways-to-interact",category:"getting-started",title:"3 Ways to Talk to Phoenix",badge:"Interfaces",summary:"Chat directly in the desktop app, connect Claude Code via MCP, or speak through your Android phone.",keywords:["interfaces","desktop","android","phone","claude code","mcp","terminal","dashboard"],content:`
You can interact with Phoenix wherever you are:

1. **Desktop Dashboard:**
   Chat, view your memory timeline, check active tasks, and adjust settings from the desktop window or web browser at \`http://localhost:7777/v2/terminal\`.

2. **AI Coding Tools (Claude Code / MCP):**
   If you use Claude Code or Cursor, Phoenix connects automatically through Model Context Protocol (\`.mcp.json\`). Claude can read and write to your Phoenix memory so your coding context is never lost.

3. **Android Companion App:**
   Tap the microphone on your phone while away from your desk. Your phone speaks directly to your PC over a secure private network (Tailscale) with zero open internet ports.
    `,action:{type:"navigate",label:"Explore Connected Devices",target:"/v2/settings"}},{id:"three-kinds-of-memory",category:"memory",title:"The 3 Drawers of Memory",badge:"Architecture",summary:"How Phoenix organizes your day into episodic timeline, semantic facts, and procedural skills.",keywords:["memory","episodic","semantic","procedural","drawers","timeline","facts","skills"],content:`
Phoenix doesn't just dump all your words into a giant messy pile. It neatly sorts information into three specialized drawers:

1. **What Happened (Episodic Memory):**
   A chronological diary of events: *"Ran backup at 3:00 PM; edited report at 4:30 PM; stepped away at 6:00 PM."*

2. **Facts Learned (Semantic Memory):**
   Explicit things Phoenix has learned about you or your projects: *"Allergic to peanuts; project deadline is Oct 18; school club color is royal blue."*

3. **How-To Skills (Procedural Memory):**
   Step-by-step instructions on how to run scripts, restart servers, or control specific smart devices.
    `,action:{type:"navigate",label:"View Timeline Data",target:"/v2/timeline"}},{id:"sarah-paper-example",category:"memory",title:"Real-Life Story: Sarah’s History Paper",badge:"Case Study",summary:"A step-by-step walkthrough of how Sarah used Phoenix across four days without taking notes.",keywords:["story","sarah","example","case study","homework","paper","recall","use case"],content:`
**Monday:**
Sarah sits at her computer and tells Phoenix: *"My history paper is on the Roman Empire and needs 4 sources."* Phoenix files this fact into its encrypted memory box.

**Wednesday:**
Sarah has been researching articles all afternoon. She leaves to eat dinner.

**Thursday:**
Sarah sits down and asks: *"What were the requirements for my history paper?"*

**Result:**
Phoenix searches its encrypted memory and replies immediately: *"Your paper is on the Roman Empire and needs 4 sources."* Sarah didn't have to search through old sticky notes, browser history, or chat transcripts.
    `,action:{type:"navigate",label:"Ask Phoenix a Question",target:"/v2/terminal"}},{id:"how-memory-search-works",category:"memory",title:"How Search & Recall Works",badge:"Deep Dive",summary:"Combining fast keyword searching with mathematical vector embeddings for instant semantic recall.",keywords:["search","recall","vector","embeddings","hybrid","sqlite-vec","fts5","keywords"],content:`
When you ask Phoenix a question, it uses two powerful search techniques at the same time:

1. **Exact Word Matching (Full-Text Search):**
   Searches instantly for exact names, project codes, dates, and file names in milliseconds.

2. **Idea Matching (Vector Embeddings):**
   Converts ideas into mathematical coordinates. If you search for *"pets"*, it will find notes mentioning *"my golden retriever Charlie"*, even if the word 'pet' was never typed.

Both results are combined and scored so the most relevant facts are handed to the AI brain before it writes an answer to you.
    `,action:{type:"navigate",label:"View Memory Status",target:"/v2/setup"}},{id:"local-vs-cloud",category:"ai-engines",title:"Local AI (Ollama) vs. Cloud AI",badge:"Comparison",summary:"Compare free offline local processing with fast cloud intelligence to pick what fits your needs.",keywords:["local","cloud","ollama","privacy","offline","speed","costs","comparison"],content:`
Phoenix gives you complete freedom to choose where your AI thinking happens:

• **Local AI (On this Computer via Ollama):**
  - **100% Free Forever:** No subscriptions, no credit cards, no monthly token limits.
  - **Total Privacy:** Prompts and answers never leave your computer's RAM.
  - **Works Offline:** Turn off Wi-Fi or unplug your internet cable and Phoenix still answers questions.
  - *Requirement:* Requires a computer with at least 8GB of RAM and a modern CPU or GPU.

• **Cloud AI (Anthropic / Cerebras / OpenAI):**
  - **Ultra-Fast Voice:** Returns spoken replies to your phone in under 1 second.
  - **Maximum Reasoning:** Excellent for complex coding tasks or massive multi-step problem solving.
  - *Requirement:* Requires an internet connection and your own API key.
    `,action:{type:"navigate",label:"Choose AI Engine in Settings",target:"/v2/settings"}},{id:"recommended-models",category:"ai-engines",title:"Recommended Local Models",badge:"Catalog",summary:"Curated models tested for speed, accuracy, and low memory consumption on Windows.",keywords:["models","llama","qwen","download","size","ram","recommendations","local ai"],content:`
We recommend three tested models for local on-device use:

1. **Llama 3.2 (1B) — Default & Recommended**
   • *Download size:* ~1.3 GB
   • *RAM needed:* ~2.5 GB
   • *Best for:* Fast everyday chat, fact saving, and quick answers on any modern laptop.

2. **Llama 3.2 (3B) — Higher Quality**
   • *Download size:* ~2.0 GB
   • *RAM needed:* ~4.5 GB
   • *Best for:* Deeper reasoning, creative writing, and nuanced conversation.

3. **Qwen 2.5 (1.5B) — Balanced Alternative**
   • *Download size:* ~1.0 GB
   • *RAM needed:* ~2.5 GB
   • *Best for:* Multilingual understanding and code comprehension.
    `,action:{type:"navigate",label:"Manage Models in Settings",target:"/v2/settings"}},{id:"strict-local-mode",category:"ai-engines",title:"Strict Local Mode & Zero Cloud Fallback",badge:"Guarantees",summary:"Why Phoenix will never secretly send your private words to cloud servers when set to Local AI.",keywords:["strict","privacy","no fallback","leak","guarantee","local only","cloud leak"],content:`
Some software quietly falls back to cloud servers if a local engine encounters an error. **Phoenix strictly refuses to do this.**

When you choose **Local AI**:
• If Ollama is sleeping or a model is missing, Phoenix halts cleanly and presents a recovery card.
• It will **NEVER** silently upload your private question to Anthropic, OpenAI, or Google.
• Your local preference is honored as a hard security boundary.
    `,action:{type:"navigate",label:"Review AI Provider",target:"/v2/settings"}},{id:"senses-explained",category:"privacy-senses",title:"Senses & Awareness: What Does Phoenix See?",badge:"Privacy",summary:"How active window tracking and desk presence work, and why they exist.",keywords:["senses","screen","window","webcam","presence","tracking","privacy","permission"],content:`
Phoenix can optionally pay attention to your physical and digital surroundings:

• **Active Window Awareness:**
  *What it does:* Notices the title of the program you have in focus (e.g. *"Word - History Paper"* or *"Chrome - Research"*).
  *Why it matters:* Lets you ask *"What was I working on this morning?"* without manually writing down your hours.

• **Desk Presence (Webcam Glance):**
  *What it does:* Checks if a human face is present in front of the webcam.
  *Why it matters:* If you walk away from your desk, Phoenix pauses pop-up notifications and holds reminders until you sit back down.
  *Privacy:* Raw camera frames are analyzed directly in memory on your PC and **never recorded, saved to disk, or sent anywhere**.
    `,action:{type:"navigate",label:"Configure Senses & Permissions",target:"/v2/settings"}},{id:"what-leaves-your-computer",category:"privacy-senses",title:"What Leaves Your Computer?",badge:"Audit",summary:"An honest audit of data residency: zero notes uploaded, private mesh networking for phones.",keywords:["network","data residency","leaves","cloud","tailscale","upload","telemetry"],content:`
Here is the strict truth about your data:

• **Your Notes, Chats, and Files:** **100% on your computer.** They are stored inside an encrypted database on your hard drive. There is no Phoenix central cloud server storing your memories.
• **Local AI Mode:** Zero bytes leave your PC. All thinking is done in local RAM.
• **Cloud AI Mode (Optional):** Only the specific prompt you send and the recent relevant memory facts are sent to the AI provider you explicitly chose.
• **Phone Companion App:** Connects directly to your PC over your own private encrypted Tailscale network mesh. Your traffic does not route through public web servers.
    `,action:{type:"navigate",label:"Inspect Security Settings",target:"/v2/settings"}},{id:"encryption-and-storage",category:"backup-safety",title:"Encrypted Storage & Encryption Keys",badge:"Security",summary:"How SQLCipher and phoenix.key lock your database so no other user or program can read your notes.",keywords:["encryption","sqlcipher","phoenix.key","phoenix.db","database","key","security"],content:"\nYour memory is saved on your computer inside `phoenix.db`.\n\n• **Locked with High-Grade Encryption:** The database is encrypted using SQLCipher.\n• **The Key:** A 64-character encryption key (`phoenix.key`) is stored in your personal user data folder.\n• **What this means:** If someone copies your `phoenix.db` file without your key, all they see is random unreadable binary garbage. Your private thoughts and notes cannot be read.\n    ",action:{type:"navigate",label:"View Storage Location",target:"/v2/settings"}},{id:"backup-and-safeguarding",category:"backup-safety",title:"How to Safeguard & Back Up Your Memory",badge:"Guides",summary:"Step-by-step instructions on protecting your memory database before switching computers or reinstalling.",keywords:["backup","restore","export","safeguard","reinstall","transfer","copy"],content:`
Because Phoenix stores all memories locally on your hard drive, keeping a backup is smart practice:

**Your Critical Files:**
Your data lives in:
\`%LOCALAPPDATA%\\Phoenix\\data\\\`
• \`phoenix.db\` (Your encrypted memory database)
• \`phoenix.key\` (Your database key)

**To Back Up:**
1. Open **Settings → Storage**.
2. Click **Create Backup Archive** to export a single encrypted \`.phoenix-backup\` file.
3. Save this backup file to a safe location (e.g. a USB drive or your personal cloud drive).

**To Restore on a New PC:**
Install Phoenix, open Settings, and select **Restore from Backup**. All your past chats, memories, and facts will be restored instantly.
    `,action:{type:"navigate",label:"Open Backup Settings",target:"/v2/settings"}},{id:"troubleshoot-ollama-sleeping",category:"troubleshooting",title:'Fix: "Local AI Engine is Sleeping"',badge:"One-Click Fix",summary:"What to do when Ollama is not running on your computer and how to wake it up in 1 click.",keywords:["econnrefused","sleeping","ollama","wake up","start","troubleshoot","11434","offline"],content:`
**What Happened:**
Phoenix tried to connect to your local Ollama engine on port 11434, but Ollama is not running right now.

**How to Fix It:**
• Click the **[Wake Up Local AI]** button below. Phoenix will automatically launch the local Ollama background service for you.
• Alternatively, open your Windows Start Menu and launch **Ollama** manually.
    `,action:{type:"api_call",label:"Wake Up Local AI",target:"/api/v1/ollama/start"}},{id:"troubleshoot-model-missing",category:"troubleshooting",title:'Fix: "AI Model Needs Download"',badge:"One-Click Fix",summary:"Resolve missing local models when Ollama returns error 404.",keywords:["404","model not found","download","pull","missing","llama3.2","fix"],content:`
**What Happened:**
Ollama is running, but the specific model selected in Phoenix (e.g. \`llama3.2:1b\`) has not been downloaded to your computer yet.

**How to Fix It:**
• Click **[Download Default Model]** below. Phoenix will start the download in the background with a live progress bar.
• Once the download reaches 100%, your local assistant is immediately ready to chat.
    `,action:{type:"api_call",label:"Download Default Model (llama3.2:1b)",target:"/api/v1/ollama/pull",body:{model:"llama3.2:1b"}}},{id:"troubleshoot-database-busy",category:"troubleshooting",title:'Fix: "Memory is Saving Notes"',badge:"Explanation",summary:"Understanding brief SQLITE_BUSY moments when Phoenix is saving multiple notes at once.",keywords:["sqlite_busy","database locked","busy","retry","saving notes","slow"],content:`
**What Happened:**
Phoenix received a lot of information at the exact same millisecond (e.g. saving an episodic event while writing a new fact), causing the encrypted database to lock momentarily for safe writing.

**How to Fix It:**
• You do not need to do anything technical! Phoenix automatically retries saving the note with a safe delay.
• If an error card appears in the chat bubble, simply click **[Try Again]**.
    `,action:{type:"navigate",label:"Return to Chat",target:"/v2/terminal"}},{id:"troubleshoot-port-conflict",category:"troubleshooting",title:'Fix: "Port in Use by Another Program"',badge:"Diagnostic",summary:"Resolving port conflicts when another application occupies port 7777.",keywords:["port","eaddrinuse","7777","conflict","port in use","network"],content:`
**What Happened:**
Phoenix attempted to start its service on port 7777, but another program (or an older copy of Phoenix) is already using that port.

**How to Fix It:**
1. Check the Windows Task Manager to see if an older Phoenix or Node.js process is running and end it.
2. The Tauri desktop shell automatically attempts to discover the next available port on start.
3. Restarting Phoenix from your Start Menu will usually resolve the issue cleanly.
    `,action:{type:"navigate",label:"Check System Readiness",target:"/v2/setup"}}],tt=[{q:"Do I need to know how to code to use Phoenix?",a:"No, absolutely not. You can chat or type to Phoenix just like any messaging app. All computer commands, notes, and searches happen in natural language."},{q:"Does Phoenix remember after I turn off my computer?",a:"Yes. All memories, facts, and timelines are permanently saved to your encrypted local database file on your hard drive and reload automatically when you turn your PC back on."},{q:"Can someone steal or read my personal notes?",a:"Your database is locked with high-grade SQLCipher encryption using a unique encryption key (phoenix.key). Without the key, the file is unreadable scramble."},{q:"Does Phoenix replace Windows or change my operating system?",a:"No. Phoenix runs quietly as a friendly assistant app inside Windows, just like Spotify or Word."},{q:"Can I use Phoenix completely offline without internet?",a:"Yes! When you configure Phoenix to use Local AI (Ollama), you can unplug your internet connection and Phoenix will still recall your notes and chat with you."},{q:"How do I stop or shut down Phoenix?",a:"You can exit Phoenix anytime from the Settings menu or close the application window from your taskbar."}];function at(X="",F="all"){const b=(X||"").trim().toLowerCase();let f=et;if(F&&F!=="all"&&(f=f.filter(l=>l.category===F)),!b)return f;const S=b.split(/\s+/).filter(Boolean);return f.map(l=>{let v=0;const R=l.title.toLowerCase(),H=l.summary.toLowerCase(),Z=l.content.toLowerCase(),ee=l.keywords||[];for(const W of S)R.includes(W)&&(v+=10),ee.some(te=>te.toLowerCase().includes(W))&&(v+=6),H.includes(W)&&(v+=4),Z.includes(W)&&(v+=2);return{topic:l,score:v}}).filter(l=>l.score>0).sort((l,v)=>v.score-l.score).map(l=>l.topic)}var ot=y('<button class="search-clear-btn svelte-1vby5nc" title="Clear search">✕</button>'),nt=y('<button><span class="pill-icon"> </span> </button>'),st=y('<div class="category-card svelte-1vby5nc"><div class="category-card-top svelte-1vby5nc"><span class="category-card-icon svelte-1vby5nc"> </span> <span class="category-card-badge svelte-1vby5nc"> </span></div> <h3 class="category-card-title svelte-1vby5nc"> </h3> <p class="category-card-summary svelte-1vby5nc"> </p> <span class="category-card-link svelte-1vby5nc">Browse articles →</span></div>'),rt=y('<section class="categories-grid svelte-1vby5nc"></section>'),it=y('<div class="empty-state svelte-1vby5nc"><span class="empty-icon svelte-1vby5nc">🔎</span> <h3 class="svelte-1vby5nc"> </h3> <p class="svelte-1vby5nc">Try searching for words like <em>ollama</em>, <em>memory</em>, <em>offline</em>, or <em>backup</em>.</p> <button class="empty-reset-btn svelte-1vby5nc">Show All Guides</button></div>'),lt=y("<p> </p>"),ct=y('<a class="action-btn navigate svelte-1vby5nc"> </a>'),dt=y('<span class="spinner svelte-1vby5nc"></span> Running...',1),ut=y('<button class="action-btn api-trigger svelte-1vby5nc"><!></button>'),yt=y('<div><span class="result-icon"> </span> <span class="result-text"> </span></div>'),ht=y('<div class="topic-action-box svelte-1vby5nc"><!> <!></div>'),pt=y('<div class="topic-card-body svelte-1vby5nc"><div class="topic-markdown-content svelte-1vby5nc"></div> <!></div>'),mt=y('<article><div class="topic-card-header svelte-1vby5nc" role="button" tabindex="0"><div class="topic-header-left svelte-1vby5nc"><span class="topic-badge svelte-1vby5nc"> </span> <h3 class="topic-title svelte-1vby5nc"> </h3> <p class="topic-summary svelte-1vby5nc"> </p></div> <div class="topic-header-right"><span class="expand-indicator svelte-1vby5nc"> </span></div></div> <!></article>'),vt=y('<div class="topics-list svelte-1vby5nc"></div>'),gt=y('<div class="faq-answer-box svelte-1vby5nc"><p class="svelte-1vby5nc"> </p></div>'),bt=y('<div><button class="faq-question-btn svelte-1vby5nc"><span class="faq-q-text"> </span> <span class="faq-icon svelte-1vby5nc"> </span></button> <!></div>'),ft=y(`<div class="help-page svelte-1vby5nc"><header class="help-header svelte-1vby5nc"><div class="header-badge svelte-1vby5nc">IN-APP USER GUIDE</div> <h1 class="header-title svelte-1vby5nc">Phoenix Help Center</h1> <p class="header-subtitle svelte-1vby5nc">Search guides, understand how your memory works, or resolve technical issues with one click.</p> <div class="search-container svelte-1vby5nc"><span class="search-icon svelte-1vby5nc">🔍</span> <input type="text" class="search-input svelte-1vby5nc" placeholder="How can we help you today? (e.g., 'ollama', 'memory', 'private', 'backup')..."/> <!></div></header> <nav class="category-tabs svelte-1vby5nc"><button><span class="pill-icon">📚</span> All Guides</button> <!></nav> <!> <section class="articles-section svelte-1vby5nc"><div class="section-heading-row svelte-1vby5nc"><h2 class="section-title svelte-1vby5nc"><!></h2> <span class="results-count svelte-1vby5nc"> </span></div> <!></section> <section class="faq-section svelte-1vby5nc"><h2 class="faq-title svelte-1vby5nc">Frequently Asked Questions</h2> <p class="faq-subtitle svelte-1vby5nc">Common questions from normal users getting started with Phoenix.</p> <div class="faq-accordion svelte-1vby5nc"></div></section> <footer class="help-footer-card svelte-1vby5nc"><div class="footer-card-left svelte-1vby5nc"><span class="footer-dot svelte-1vby5nc"></span> <div><strong class="svelte-1vby5nc">100% On-Device Knowledge</strong> <p class="svelte-1vby5nc">All guides, search indexing, and troubleshooting triggers operate entirely on your PC with zero cloud tracking.</p></div></div> <a class="footer-card-btn svelte-1vby5nc">Open Settings ⚙</a></footer></div>`);function Wt(X,F){Qe(F,!0);let b=E(""),f=E("all"),S=E(null),T=E(_e({})),l=E(_e({})),v=E(null),R=Ke(()=>at(e(b),e(f)));function H(t){k(f,t,!0)}function Z(t){k(S,e(S)===t?null:t,!0)}function ee(t){k(v,e(v)===t?null:t,!0)}function W(){k(b,"")}async function te(t){if(!t.action)return;const s=t.action;if(s.type==="api_call"){k(T,{...e(T),[t.id]:!0},!0),k(l,{...e(l),[t.id]:null},!0);try{const i=await Xe.post(s.target,s.body||{});k(l,{...e(l),[t.id]:{ok:!0,message:i.message||"Action executed successfully!"}},!0)}catch(i){k(l,{...e(l),[t.id]:{ok:!1,message:i.message||"Failed to execute action. Check system logs."}},!0)}finally{k(T,{...e(T),[t.id]:!1},!0)}}}var ae=ft(),oe=o(ae),ge=r(o(oe),6),ne=r(o(ge),2);$e(ne);var Ie=r(ne,2);{var Se=t=>{var s=ot();I("click",s,W),d(t,s)};x(Ie,t=>{e(b)&&t(Se)})}a(ge),a(oe);var se=r(oe,2),re=o(se);let be;var Te=r(re,2);Q(Te,17,()=>ve,V,(t,s)=>{var i=nt();let n;var u=o(i),g=o(u,!0);a(u);var h=r(u);a(i),m(()=>{n=K(i,1,"category-pill svelte-1vby5nc",null,n,{active:e(f)===e(s).id}),c(g,e(s).icon),c(h,` ${e(s).title??""}`)}),I("click",i,()=>H(e(s).id)),d(t,i)}),a(se);var fe=r(se,2);{var We=t=>{var s=rt();Q(s,21,()=>ve,V,(i,n)=>{var u=st(),g=o(u),h=o(g),q=o(h,!0);a(h);var _=r(h,2),Y=o(_,!0);a(_),a(g);var P=r(g,2),G=o(P,!0);a(P);var C=r(P,2),M=o(C,!0);a(C),Pe(2),a(u),m(()=>{c(q,e(n).icon),c(Y,e(n).badge),c(G,e(n).title),c(M,e(n).summary)}),I("click",u,()=>H(e(n).id)),d(i,u)}),a(s),d(t,s)};x(fe,t=>{!e(b)&&e(f)==="all"&&t(We)})}var ie=r(fe,2),le=o(ie),ce=o(le),qe=o(ce);{var Me=t=>{var s=J();m(()=>c(s,`Search Results for "${e(b)??""}"`)),d(t,s)},Le=t=>{var s=J();m(i=>c(s,i),[()=>ve.find(i=>i.id===e(f))?.title||"Articles"]),d(t,s)},Re=t=>{var s=J("Featured Topics & Guides");d(t,s)};x(qe,t=>{e(b)?t(Me):e(f)!=="all"?t(Le,1):t(Re,-1)})}a(ce);var we=r(ce,2),Be=o(we);a(we),a(le);var Oe=r(le,2);{var De=t=>{var s=it(),i=r(o(s),2),n=o(i);a(i);var u=r(i,4);a(s),m(()=>c(n,`No guides found matching "${e(b)??""}"`)),I("click",u,W),d(t,s)},Ee=t=>{var s=vt();Q(s,21,()=>e(R),V,(i,n)=>{var u=mt();let g;var h=o(u),q=o(h),_=o(q),Y=o(_,!0);a(_);var P=r(_,2),G=o(P,!0);a(P);var C=r(P,2),M=o(C,!0);a(C),a(q);var U=r(q,2),$=o(U),He=o($,!0);a($),a(U),a(h);var Ye=r(h,2);{var Ge=L=>{var ue=pt(),ye=o(ue);Q(ye,21,()=>e(n).content.trim().split(`

`),V,(N,j)=>{var B=lt(),he=o(B,!0);a(B),m(pe=>c(he,pe),[()=>e(j).replace(/\*\*(.*?)\*\*/g,"$1")]),d(N,B)}),a(ye);var Ue=r(ye,2);{var Ne=N=>{var j=ht(),B=o(j);{var he=w=>{var p=ct(),O=o(p);a(p),m(()=>{Ce(p,"href",`${Ae??""}${e(n).action.target??""}`),c(O,`${e(n).action.label??""} ↗`)}),d(w,p)},pe=w=>{var p=ut(),O=o(p);{var z=A=>{var D=dt();Pe(),d(A,D)},me=A=>{var D=J();m(()=>c(D,`${e(n).action.label??""} ⚡`)),d(A,D)};x(O,A=>{e(T)[e(n).id]?A(z):A(me,-1)})}a(p),m(()=>p.disabled=e(T)[e(n).id]),I("click",p,()=>te(e(n))),d(w,p)};x(B,w=>{e(n).action.type==="navigate"?w(he):e(n).action.type==="api_call"&&w(pe,1)})}var je=r(B,2);{var ze=w=>{var p=yt();let O;var z=o(p),me=o(z,!0);a(z);var A=r(z,2),D=o(A,!0);a(A),a(p),m(()=>{O=K(p,1,"action-result-banner svelte-1vby5nc",null,O,{success:e(l)[e(n).id].ok,error:!e(l)[e(n).id].ok}),c(me,e(l)[e(n).id].ok?"✓":"⚠️"),c(D,e(l)[e(n).id].message)}),d(w,p)};x(je,w=>{e(l)[e(n).id]&&w(ze)})}a(j),d(N,j)};x(Ue,N=>{e(n).action&&N(Ne)})}a(ue),d(L,ue)};x(Ye,L=>{e(S)===e(n).id&&L(Ge)})}a(u),m(()=>{g=K(u,1,"topic-card svelte-1vby5nc",null,g,{expanded:e(S)===e(n).id}),c(Y,e(n).badge),c(G,e(n).title),c(M,e(n).summary),c(He,e(S)===e(n).id?"▲":"▼")}),I("click",h,()=>Z(e(n).id)),I("keydown",h,L=>{(L.key==="Enter"||L.key===" ")&&(L.preventDefault(),Z(e(n).id))}),d(i,u)}),a(s),d(t,s)};x(Oe,t=>{e(R).length===0?t(De):t(Ee,-1)})}a(ie);var de=r(ie,2),ke=r(o(de),4);Q(ke,21,()=>tt,V,(t,s,i)=>{var n=bt();let u;var g=o(n),h=o(g),q=o(h,!0);a(h);var _=r(h,2),Y=o(_,!0);a(_),a(g);var P=r(g,2);{var G=C=>{var M=gt(),U=o(M),$=o(U,!0);a(U),a(M),m(()=>c($,e(s).a)),d(C,M)};x(P,C=>{e(v)===i&&C(G)})}a(n),m(()=>{u=K(n,1,"faq-item svelte-1vby5nc",null,u,{open:e(v)===i}),c(q,e(s).q),c(Y,e(v)===i?"−":"+")}),I("click",g,()=>ee(i)),d(t,n)}),a(ke),a(de);var xe=r(de,2),Fe=r(o(xe),2);a(xe),a(ae),m(()=>{be=K(re,1,"category-pill svelte-1vby5nc",null,be,{active:e(f)==="all"}),c(Be,`${e(R).length??""} ${e(R).length===1?"article":"articles"}`),Ce(Fe,"href",`${Ae??""}/settings`)}),Je(ne,()=>e(b),t=>k(b,t)),I("click",re,()=>H("all")),d(X,ae),Ve()}Ze(["click","keydown"]);export{Wt as component};
