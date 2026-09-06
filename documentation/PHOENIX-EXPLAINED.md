# Phoenix Explained: A Guide for Normal People

> **"Phoenix is a personal AI system that runs on your computer and is designed to remember information, understand what is happening around it, and help you interact with your computer and other connected devices."**

Let's break that opening sentence down into simple ideas:

* **"A personal AI system"**: It is not a giant company's website that you log into. It is your own private digital assistant.
* **"Runs on your computer"**: Its main files, its thoughts, and its memories live right on your own PC's hard drive, not on a faraway company's computer.
* **"Designed to remember information"**: Unlike standard chat websites that forget everything the moment you close the browser window, Phoenix saves what you do, what you say, and what you decide so it can help you tomorrow, next week, or next year.
* **"Understand what is happening around it"**: If you turn on its sensors, Phoenix can glance at what window is open on your screen, notice if someone is sitting in front of the webcam, and pay attention to what tasks you are working on.
* **"Help you interact with your computer and other connected devices"**: You can talk or type to Phoenix from your computer or your phone to control tasks, search your past notes, run commands, or even turn on smart lights in your house.

---

## SECTION 1 — WHAT IS PHOENIX?

### The Difference Between a Normal Chatbot and Phoenix

When you use a normal website chatbot, the experience is like walking up to a smart stranger at an information desk:
1. You walk up and introduce yourself.
2. You explain your question in detail.
3. The stranger gives you a helpful answer.
4. You walk away.
5. The next morning, you walk up to the exact same desk, but the stranger has **complete amnesia**. You have to introduce yourself all over again, explain your project all over again, and remind them of what you talked about yesterday.

**Phoenix is designed to be completely different.**

Phoenix is like a personal assistant who sits at the desk right next to you:
* **It stays with you over time.** It writes down what you work on in a secure diary on your computer.
* **It has continuous memory.** When you talk to it next Tuesday, it remembers what you decided last Friday.
* **It lives on your computer.** It runs directly in the background of your operating system (like Windows).
* **It has senses.** It can notice which program you are using, read summaries of what is on your screen, and check whether you are sitting at your desk.
* **It reaches out to other devices.** It can talk to an app on your Android phone, connect to other computers in your house, and speak to smart home devices.

**Overall Purpose:** Phoenix exists to turn your computer into an assistant that **remembers your life and work**, so you never have to start from scratch every single time you sit down to use a computer.

---

## SECTION 2 — WHAT PROBLEM DOES IT SOLVE?

Here are the real, everyday frustrations Phoenix solves:

### 1. The "Amnesia" Problem (Forgetting Information)
* **The Frustration:** You spend 30 minutes explaining a complex project to an AI tool. Two days later, you start a new conversation and have to paste all that background information in again.
* **Everyday Example:** You told Phoenix last week: *"My history paper is due on October 18th and my teacher wants Chicago-style citations."* Three days later, you can simply ask: *"What style citations did my teacher want?"* Phoenix searches its memory and gives you the exact answer.

### 2. The "Lost Notes" Problem (Information Scattered Everywhere)
* **The Frustration:** You made a design decision three weeks ago. Was it written in a sticky note, a text file, an email, or a Discord chat?
* **Everyday Example:** You can ask: *"What was that color palette we picked for the school club logo?"* Phoenix searches through its history of past conversations and decisions to find it immediately.

### 3. Repetitive Computer Tasks
* **The Frustration:** Having to type the same technical commands, run the same checks, or open five different tools every time you begin work.
* **Everyday Example:** Instead of opening three different terminal windows and typing commands manually, you can ask Phoenix to kick off your project or check if your background tasks are still running.

### 4. Phone and Computer Disconnect
* **The Frustration:** You are sitting on the couch downstairs with your phone, but the file or task you want to run is on your desktop computer upstairs in your bedroom.
* **Everyday Example:** You open the Phoenix companion app on your phone, speak into the microphone, and tell your desktop PC upstairs to search its memory or trigger a task.

---

## SECTION 3 — WHAT DOES PHOENIX ACTUALLY DO?

Here is a list of real capabilities that are built and working in the current Phoenix project:

### 1. Long-Term Encrypted Memory Search
* **What it does:** Phoenix searches through all your past conversations, commands, and notes.
* **How it works:** Every time an event happens, Phoenix saves it to an encrypted database file on your computer. It creates an index (like the index at the back of a textbook) so it can find exact words or similar meanings.
* **Example:** *"What did I do on Wednesday afternoon?"*
* **Result:** Phoenix returns a list of activities, chats, and decisions from that specific afternoon.

### 2. Screen and Activity Awareness
* **What it does:** Phoenix notices which program you have open and what you are looking at.
* **How it works:** A background helper quietly checks the title of your active window (for example, "Google Docs" or "Visual Studio Code"). Periodically, it takes a screenshot and asks a small vision AI to write a one-sentence summary of what is happening.
* **Example:** You leave your desk while reading a math assignment. You return 10 minutes later.
* **Result:** Phoenix knows you were working on math homework and keeps that context ready.

### 3. Webcam Presence Checking
* **What it does:** Phoenix detects whether you are actually sitting at your desk.
* **How it works:** It uses your computer's webcam to check for a face. It does not record continuous video to the internet; it just takes a quick snapshot to verify: *"Is my person here, or is the chair empty?"*
* **Example:** Phoenix has an important reminder to share, but sees the desk is empty.
* **Result:** It avoids blurting out reminders into an empty room.

### 4. Smart Fact Extraction (Semantic Memory)
* **What it does:** Phoenix pulls out key facts and personal preferences from everyday conversation.
* **How it works:** When you tell it something about yourself, a background process extracts the fact (e.g., *"User prefers dark mode"* or *"Dog's name is Barnaby"*) and files it into a special facts table.
* **Example:** You say, *"I am allergic to peanuts, so remind me when I look up recipes."*
* **Result:** Phoenix saves this as a permanent personal rule and remembers it weeks later.

### 5. AI Coding Tool Bridge (MCP Server)
* **What it does:** Phoenix connects your saved memory directly into professional AI coding assistants like Claude Code.
* **How it works:** Phoenix runs a bridge called an **MCP Server** (Model Context Protocol). When you start a coding session, your AI coding tool automatically asks Phoenix: *"What did the user do recently, and what decisions did they make?"*
* **Example:** You open a coding terminal. The coding assistant immediately says: *"Phoenix Remembers: We were fixing the login button yesterday."*
* **Result:** You jump straight into work without spending 10 minutes explaining yesterday's progress.

### 6. Running Local AI Models (Offline AI)
* **What it does:** Phoenix can think, summarize, and answer questions using AI models that live on your own computer.
* **How it works:** It connects to a free program called **Ollama**, which runs language models directly using your computer's graphics card or processor.
* **Example:** You unplug your internet router. You ask Phoenix to summarize your recent notes.
* **Result:** Phoenix processes the answer locally on your PC without needing any internet connection.

### 7. Android Phone Companion
* **What it does:** A mobile app that lets you talk or type to your computer from anywhere.
* **How it works:** The app uses an encrypted private network tunnel (Tailscale) to connect your phone directly to your computer at home.
* **Example:** You are at school or a coffee shop. You pull out your phone, tap the mic, and ask: *"Did I finish that report on my PC?"*
* **Result:** Your computer at home answers your phone securely.

### 8. Controlling Smart Home Devices
* **What it does:** Phoenix can turn lights on or off, adjust climate, or check smart home sensors.
* **How it works:** It connects to **Home Assistant** (a popular smart home platform). When you say *"Turn on the desk lamp"*, Phoenix matches your words to the device name and triggers it.
* **Example:** You say to your phone or computer: *"Turn on the reading lights."*
* **Result:** The physical lamp turns on.

### 9. Multi-Machine Remote Control (Phoenix Client)
* **What it does:** Phoenix can send commands to other computers in your house.
* **How it works:** You install a tiny companion script called `phoenix-client` on a second computer (like a laptop or living room machine). It connects to your main PC over your private home network.
* **Example:** From your desktop, you tell Phoenix: *"Restart the music player on the living room computer."*
* **Result:** The living room computer performs the command.

### 10. The Nightly "Dream Cycle" (Memory Clean-up)
* **What it does:** Cleans, organizes, and summarizes all the events from your day.
* **How it works:** Every few hours (or late at night), a background task sorts through all the raw logs, removes useless computer noise, consolidates similar memories, and updates summaries.
* **Example:** Phoenix collected 500 tiny computer events today (window switches, keystrokes, messages).
* **Result:** Instead of keeping an unreadable mess, Phoenix condenses it into a clear, searchable daily summary.

---

## SECTION 4 — HOW DOES IT WORK?

Think of Phoenix as a simple team:

```text
    YOU
     │  (Voice, Typing, or Phone)
     ▼
┌─────────────────────────────────────────────────────────────┐
│                      PHOENIX CORE                           │
│                                                             │
│   1. The Front Door (Accepts your message)                  │
│   2. The Manager    (Keeps connections alive)               │
│   3. The Worker     (Runs the actual logic & routes)        │
└────────┬──────────────────────┬──────────────────────┬──────┘
         │                      │                      │
         ▼                      ▼                      ▼
   ┌───────────┐          ┌───────────┐          ┌───────────┐
   │  MEMORY   │          │    AI     │          │   TOOLS   │
   │ (Database)│          │  (Brain)  │          │(Computer) │
   └─────┬─────┘          └─────┬─────┘          └─────┬─────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                                ▼
                             RESULT
                       (Answer or Action)
```

### The Three Layers of Phoenix

To make sure Phoenix never crashes or loses your work while you are using it, its software is split into three parts:

1. **The Front Door ("Super-Carrier", Port 7777):**
   * This is the permanent address you connect to. It never closes. If other parts of Phoenix need a quick update, this front door holds your connection open so your screen doesn't freeze.
2. **The Manager ("Carrier", Port 17760):**
   * This manages active sessions, like open terminal windows and live chat streams.
3. **The Worker ("Craft", Port 17700+):**
   * This is where the actual code and rules live. Because it is separate from the Manager, Phoenix can upgrade its own brain in the background ("hot-swap") without closing your open terminals or interrupting your work!

### How Phoenix Handles a Request

When you say: *"What did we decide about the project budget?"*

1. **You speak or type:** Your phone or browser sends your question to the Front Door.
2. **The Worker checks Memory:** Phoenix searches its encrypted database for words and meanings related to "project" and "budget".
3. **The Worker consults the AI Brain:** Phoenix hands the retrieved notes along with your question to the AI model.
4. **The AI answers:** The AI reads the old notes and formats a clear response: *"On Tuesday, you decided the budget was $150."*
5. **Phoenix logs the interaction:** Phoenix records that you asked this question so it can keep building its context.

---

## SECTION 5 — TECHNOLOGIES USED

Phoenix uses several well-known tools and building blocks. Here is what they are in plain English:

| Technology / Component | What it is in simple words | Why Phoenix uses it | Where it is used |
| :--- | :--- | :--- | :--- |
| **Node.js & JavaScript** | A popular engine that lets computers run website-style code as a program. | It is fast, flexible, and handles multiple tasks at once without slowing down. | The main Phoenix server (`service/`). |
| **Svelte & SvelteKit** | A modern tool for creating clean, fast web pages. | Makes the dashboard look beautiful, responsive, and easy to use. | The Phoenix web dashboard (`service/dashboard/`). |
| **SQLite with SQLCipher** | A lightweight database that stores data in a single file, protected by an encryption password. | Keeps all your memories organized in one place and locks them so nobody can read them without the key. | Phoenix's memory box (`%LOCALAPPDATA%/Phoenix/data/phoenix.db`). |
| **sqlite-vec** | A mathematical search extension for the database. | Allows Phoenix to search by **meaning** rather than just exact matching words (e.g. searching "automobile" finds notes about "cars"). | Semantic memory search in the database. |
| **Ollama** | A free desktop app that runs AI models directly on your graphics card or processor. | Lets Phoenix think completely offline without sending personal data to outside companies. | Local AI model runner on your PC. |
| **Gemma 4 (`gemma4:e2b`)** | A compact AI model built by Google that runs locally on your PC. | Fast at chatting, reading text, and analyzing screenshots without melting your computer. | Local chat and vision analysis. |
| **Qwen Embeddings (`qwen3-embedding:0.6b`)** | A specialized local model that converts sentences into mathematical maps. | Turns your notes and memories into number patterns so Phoenix can compare their meanings instantly. | Database indexing and memory recall. |
| **Anthropic Claude (Haiku / CLI)** | A powerful cloud AI model. | Used for lightning-fast voice answers or heavy programming tasks when local AI is too slow. | Optional cloud AI fallback and coding sessions. |
| **WebSockets** | A live two-way phone line between your web browser and the server. | Allows instant live updates (like terminal output or chat messages) without needing to refresh the page. | Communication between dashboard, phone, and server. |
| **Tailscale** | A secure, encrypted virtual tunnel connecting your own devices together. | Lets your phone talk to your home computer from anywhere in the world without exposing your home network to hackers. | Phone-to-desktop connection. |
| **MCP (Model Context Protocol)** | A universal plug standard created by Anthropic that connects AI models to external tools and databases. | Lets external tools like Claude Code plug directly into Phoenix's memory bank. | `service/src/mcp-server.js`. |
| **Android & Kotlin** | The programming language and system used to build Android smartphone apps. | Powers the mobile app so you can talk to Phoenix while away from your desk. | The mobile app (`android/`). |
| **Tauri & Rust** | A tool for making lightweight, secure desktop windows on Windows and Mac. | Wraps Phoenix into a desktop application window that stays open on your taskbar. | The desktop application wrapper. |
| **Python** | A popular coding language used heavily in AI and speech tools. | Handles voice detection and microphone listening. | Microphone and speech tools (`service/bin/dictate-vad.py`). |

---

## SECTION 6 — HOW MEMORY WORKS

Human beings do not store every memory the same way. You have memories of what you had for breakfast, memories of general facts (like "Paris is the capital of France"), and memories of skills (like how to ride a bicycle).

Phoenix organizes its memory in a very similar three-part way:

```text
                  ┌─────────────────────────────────┐
                  │      PHOENIX MEMORY BOX         │
                  └────────────────┬────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
  1. EPISODIC               2. SEMANTIC               3. PROCEDURAL
  "What happened"           "Facts I learned"         "How to do it"
  ───────────────           ─────────────────         ──────────────
  • Tuesday's chat          • User likes dark mode    • How to run test
  • Command run at 3pm      • Project deadline is Fri • How to restart
  • Window opened at 4pm    • Dog's name is Barnaby   • Custom skills
```

### 1. Episodic Memory (What happened and when)
* **What it stores:** A chronological timeline of events. It records when you ran a command, what you chatted about at 2:00 PM, and what program was open.
* **Why it matters:** It lets you search backward in time: *"What did I do yesterday morning?"*

### 2. Semantic Memory (Facts and knowledge)
* **What it stores:** Isolated facts, truths, and preferences.
* **Why it matters:** Phoenix extracts facts from your conversations. If you say, *"I prefer dark mode and my main coding language is Python,"* Phoenix stores those two facts so it never has to ask you again.

### 3. Procedural Memory (How to do things)
* **What it stores:** Instructions, workflows, and skills.
* **Why it matters:** If you teach Phoenix how to run a complex build script or test command, it remembers the exact steps to follow next time.

### Where Is the Memory Kept?
All of this is stored in **one encrypted file** on your hard drive:
`%LOCALAPPDATA%/Phoenix/data/phoenix.db`

The file is locked using an encryption key (`phoenix.key`). If someone steals your computer's hard drive or copies the file, they cannot open it or read your notes without your secret key.

### What Happens if Phoenix Cannot Find the Answer?
If you ask Phoenix about something it has never seen or recorded, it does not invent a fake story. It checks its search index, finds zero matching results, and honestly tells you: *"I could not find any memory of that in my records."*

---

## SECTION 7 — HOW AI IS USED

A common point of confusion is: **Is Phoenix the AI, or does Phoenix use an AI?**

Here is the best way to picture it:

> **The AI model is the brain.**
> **Phoenix is the entire body, memory, senses, hands, and tools built around that brain.**

```text
   ┌────────────────────────────────────────────────────────┐
   │                        PHOENIX                         │
   │                                                        │
   │   [ Senses: Screen & Webcam Watcher ]                  │
   │   [ Hands: Terminal, Smart Home, Remote Clients ]      │
   │   [ Memory: Encrypted SQLite Database ]                │
   │                                                        │
   │               ┌────────────────────────┐               │
   │               │     THE AI BRAIN       │               │
   │               │  (Gemma 4 or Claude)   │               │
   │               │                        │               │
   │               │  "Understands words &  │               │
   │               │   decides answers"     │               │
   │               └────────────────────────┘               │
   └────────────────────────────────────────────────────────┘
```

* An AI model by itself cannot remember you tomorrow, cannot look at your local database, and cannot turn on your bedroom lamp.
* Phoenix gives that AI model hands, ears, eyes, and a permanent diary.

### Where Does the Brain Live? (Local vs Cloud)

Phoenix supports both **local AI** and **cloud AI**, and switches between them intelligently depending on what you are doing:

1. **Local Brain (Ollama with Gemma 4):**
   * Runs directly on your computer hardware.
   * Completely free and private.
   * Used by default for background tasks (like analyzing screenshots or categorizing notes) because you are not waiting on an immediate reply.
2. **Cloud Brain (Anthropic Claude / Cerebras):**
   * Runs on high-speed internet servers.
   * Extremely smart and responds in less than one second.
   * Used for voice conversations because when you speak into a phone, you don't want to wait 10 seconds for a response.
3. **The Fallback Chain:**
   * If the cloud model fails or you lose internet connection, Phoenix automatically falls back to your local model.
   * **Full Privacy Option:** If you never want a single word to leave your computer, you can set Phoenix to "local only." Everything will run 100% on your own PC.

---

## SECTION 8 — HOW A NORMAL PERSON USES PHOENIX

Here is what your everyday experience looks like:

```text
Step 1: Start Phoenix on your computer (it runs quietly in the background).
                            │
                            ▼
Step 2: Open the Phoenix Dashboard in your browser (or use the desktop app).
                            │
                            ▼
Step 3: Type or speak to Phoenix naturally:
        "Remember that the biology presentation is rescheduled to Friday."
                            │
                            ▼
Step 4: Phoenix saves the fact into its encrypted memory box.
                            │
                            ▼
Step 5: Later, ask Phoenix a question from your PC or phone:
        "When is my biology presentation?"
                            │
                            ▼
Step 6: Phoenix searches its memory, passes the notes to its AI,
        and answers you accurately in seconds!
```

---

## SECTION 9 — REAL-LIFE USE CASES

### 1. For a Student
* **Homework & Deadlines:** You can tell Phoenix assignment deadlines, teacher guidelines, and exam dates.
* **Study Session Tracker:** Phoenix notices when you have a textbook PDF open and keeps your notes attached to that topic.
* **Quick Recall:** While writing an essay on Thursday, you can ask: *"What were the three sources I found on Monday?"*

### 2. For a Software Developer or Tech Hobbyist
* **Continuous Coding Context:** When you open a coding terminal with Claude Code, Phoenix automatically feeds it what you were working on yesterday so you don't have to re-explain your code.
* **Command Memory:** Phoenix remembers complicated terminal commands, server setup steps, and project decisions.
* **Remote Testing:** You can trigger tests on your desktop computer while sitting on your couch with your laptop.

### 3. For an Office Worker
* **Meeting Notes:** Summarize client calls or discussions and file the key decisions into searchable memory.
* **Daily Catch-up:** Ask Phoenix at 9:00 AM: *"What tasks were left unfinished when I logged off yesterday?"*
* **Context Protection:** If you get pulled away by an unexpected phone call, Phoenix's screen history helps you remember what document you had open before the interruption.

### 4. For Personal Everyday Productivity
* **Personal Fact Diary:** Keep track of gift ideas, doctor appointment dates, pet medications, and favorite recipes.
* **Smart Home Routines:** Ask Phoenix to turn off your desk lamp and computer screen when you leave your desk.
* **Habit Awareness:** Notice how much time you spent in study programs versus distraction apps during the week.

### 5. Multi-Device Use (Phone + Computer)
* **Voice on the Go:** You are downstairs eating breakfast. You pick up your Android phone and say: *"Did my overnight backup finish on the computer?"* Phoenix checks your desktop and gives you the answer instantly.

---

## SECTION 10 — ONE FULL EXAMPLE

### The Story of Rahul’s Science Fair Project

#### Before Phoenix:
Rahul is building a solar-powered weather station for the science fair.
* On Monday, he spent an hour finding the right voltage settings for his solar panel and wrote them on a scrap of paper.
* On Wednesday, he lost the scrap of paper. He had to search Google all over again.
* On Thursday, he asked an online AI chatbot to help him write a report. It gave good suggestions, but when he closed his laptop to eat dinner, the chat session expired.
* On Friday, he had to start completely over, explaining the entire project to the chatbot a second time.

#### With Phoenix:
* **Monday:** Rahul turns on Phoenix. He tests his solar panel and types into Phoenix: *"The optimal solar panel voltage is 4.8 volts, and we are using sensor model BME280."* Phoenix saves this into its encrypted memory.
* **Wednesday:** Rahul sits down at his desk. He opens his Phoenix dashboard and asks: *"What voltage did I record for the solar panel?"* Phoenix immediately replies: *"You recorded 4.8 volts for sensor model BME280 on Monday."*
* **Thursday:** Rahul is working in his bedroom. He pulls out his Android phone and says: *"Log a decision: we are presenting on Friday morning instead of Thursday afternoon."* Phoenix saves the decision into memory.
* **Friday:** Rahul opens his laptop to write his final science fair paper. His AI assistant connects to Phoenix's memory, reads all the decisions, voltages, and schedules from the whole week, and helps him draft his paper in 15 minutes without forgetting a single detail.

**The Result:** Rahul saved hours of repeated work, never lost his notes, and completed his project with zero stress.

---

## SECTION 11 — WHAT IS THE OUTCOME OF USING PHOENIX?

Why should a normal person care about Phoenix?

1. **It Saves You Time:** You stop wasting 20 minutes a day searching for lost notes or re-typing things you already explained.
2. **It Protects Your Focus:** You don't have to keep every tiny detail in your head. You can offload dates, facts, and tasks to Phoenix and trust that they will be there when you need them.
3. **Your Data Belongs to You:** Unlike big commercial tech platforms that sell your browsing habits or train their public models on your private conversations, Phoenix stores your memories in an encrypted file right on your own machine.
4. **It Connects Your Devices:** It bridges the gap between your phone, your desktop computer, other laptops in your house, and your smart home devices.

---

## SECTION 12 — WHAT PHOENIX IS NOT

To be completely honest and realistic, here is what Phoenix is **NOT**:

* **It is NOT a sentient human being.** It does not have feelings, consciousness, or real life awareness. It is a computer program powered by mathematical language models.
* **It is NOT magic.** It cannot guess what you want if you have never told it or if it didn't observe it.
* **It does NOT automatically know everything in the world.** Its knowledge comes from the AI models you install and the notes you give it.
* **It is NOT a replacement for your operating system.** Phoenix runs *inside* Windows or Linux; it does not replace Windows.
* **It cannot run on a weak toaster.** Running local AI models requires a reasonably modern computer (at least 8 GB to 16 GB of RAM and a decent processor).
* **It is NOT finished software.** It is an active, open-source project. While the core features work today, it is continually being improved.

---

## SECTION 13 — LOCAL VS CLOUD

Understanding where your data goes is important:

| Feature | Runs Locally on Your PC | Can Use the Cloud | Why? |
| :--- | :---: | :---: | :--- |
| **Database & Memories** | **YES (100%)** | NO | Your memory file is encrypted on your hard drive and never uploaded to cloud storage. |
| **Screen & Webcam Tracking** | **YES (100%)** | NO | Screenshots and camera checks are analyzed locally; they are never uploaded to the internet. |
| **Local Chat (Ollama)** | **YES (100%)** | NO | Runs on your graphics card / CPU without an internet connection. |
| **Voice Chat (Default)** | Fallback only | **YES** | Cloud models answer spoken questions in less than 1 second, making voice conversations feel natural. |
| **Mobile Phone Connection** | Runs on your devices | Private tunnel | Uses Tailscale (a secure private tunnel) to connect your phone directly to your PC, not via public web servers. |

> **The Golden Privacy Rule in Phoenix:** If you do not want *anything* leaving your computer, you can set the AI settings to **Local Only**. In this mode, no text or prompts ever leave your machine, even if it means voice replies take a few seconds longer.

---

## SECTION 14 — COMPONENT MAP

Here is a map showing how the pieces of Phoenix connect in real life:

```text
               ┌───────────────────────────┐
               │         YOU               │
               │  (Speaking or Typing)     │
               └─────────────┬─────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   ┌───────────┐       ┌───────────┐       ┌───────────┐
   │  Android  │       │  Desktop  │       │  Browser  │
   │ Phone App │       │   Shell   │       │ Dashboard │
   └─────┬─────┘       └─────┬─────┘       └─────┬─────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
               ┌───────────────────────────┐
               │    SUPER-CARRIER (:7777)  │
               │    The Stable Front Door  │
               └─────────────┬─────────────┘
                             │
                             ▼
               ┌───────────────────────────┐
               │      CARRIER (:17760)     │
               │  Active Sessions & Relays │
               └─────────────┬─────────────┘
                             │
                             ▼
               ┌───────────────────────────┐
               │     CRAFT SERVER (:17700) │
               │   The Brain & Route Logic │
               └─────────────┬─────────────┘
                             │
     ┌───────────────────────┼───────────────────────┐
     ▼                       ▼                       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│ SENSORS      │     │ MEMORY BOX   │     │ AI BRAIN LAYER   │
│ • Screen     │     │ • SQLite     │     │ • Ollama (Local) │
│ • Webcam     │     │ • SQLCipher  │     │ • Claude (Cloud) │
│ • Activity   │     │ • Vector Search│   │ • Embeddings     │
└──────────────┘     └──────────────┘     └──────────────────┘
                             │
     ┌───────────────────────┴───────────────────────┐
     ▼                                               ▼
┌──────────────────────────┐           ┌──────────────────────────┐
│ EXTERNAL TOOLS           │           │ CONNECTED DEVICES        │
│ • Claude Code CLI (MCP)  │           │ • Home Assistant Lights  │
│ • Terminal commands      │           │ • Remote Client PCs      │
└──────────────────────────┘           └──────────────────────────┘
```

---

## SECTION 15 — QUICK FAQ

#### "Do I need to be a programmer to understand or use this?"
**No.** While developers love Phoenix for coding projects, anyone who wants an assistant that remembers notes, tasks, and daily schedules can use it through the dashboard or phone app.

#### "Can I use Phoenix alone on my computer without a phone?"
**Yes.** The phone app is completely optional. Phoenix works 100% on a single desktop or laptop computer.

#### "Does Phoenix remember things after I turn my computer off?"
**Yes.** Every memory and fact is written directly to your encrypted hard drive database. When you turn your computer back on tomorrow, all your notes and history are still there.

#### "Can Phoenix type or run things on my computer?"
**Yes.** Through its terminal and task runners, Phoenix can execute commands that you approve.

#### "Does Phoenix need an internet connection to work?"
**Not if you use local models.** With Ollama installed, Phoenix can chat, search its memory, and summarize text with your internet cable unplugged. An internet connection is only needed if you choose to use cloud AI models (like Claude) or connect your phone away from home.

#### "Where are my personal files and passwords stored?"
**On your own PC.** All memories live in `%LOCALAPPDATA%/Phoenix/data/phoenix.db`. Secret API keys are protected on your local system and are never displayed in regular screen reports.

#### "What happens if I close Phoenix?"
When you close Phoenix, it stops watching your windows and stops answering requests. The next time you launch it, it reads its saved database and picks up right where you left off.

---

## SECTION 16 — WHAT EXISTS TODAY VS. FUTURE IDEAS

It is very important to separate what is **already built and working** from what is **only a future plan**.

### What Works Right Now (Today):
1. **Encrypted local database** with keyword and meaning-based search.
2. **Three-tier memory:** remembering what happened (episodic), facts learned (semantic), and how to do tasks (procedural).
3. **Screen watcher & window activity tracker** to know what program you have open.
4. **Webcam presence detector** to know if someone is sitting at the computer.
5. **Interactive web dashboard** with live terminal tabs, task boards (Kanban), and data explorer.
6. **Claude Code MCP bridge:** lets Claude Code read your past notes and decisions.
7. **Local AI runner:** full integration with Ollama models (`gemma4` and `qwen3-embedding`).
8. **Android companion app:** mobile voice and text control over private Tailscale network.
9. **Smart home bridge:** controls Home Assistant lights and switches.
10. **Nightly Dream Cycle:** automatically cleans up and summarizes daily events.
11. **Remote PC client:** allows Phoenix to send commands to other computers in your home.

### What Is a Future Idea (Not Built Yet):
1. **The Physical Wearable Pendant:**
   * *The Idea:* A physical necklace device (based on an ESP32 microchip) with an onboard camera, microphone, and environmental sensors (like air quality or temperature meters) that talks to your phone via Bluetooth.
   * *Status:* Early research and planning only. **Not built.**
2. **Autonomous Multi-Agent Self-Coding Loops:**
   * *The Idea:* Phoenix automatically discovering bugs in itself, writing new software patches, running tests, and updating its own code without any human intervention.
   * *Status:* Experimental concept and architectural goal. **Not a finished feature.**
3. **Advanced Biometric Sensing:**
   * *The Idea:* Detecting room air quality, radiation, or heart rate through specialized external hardware chips.
   * *Status:* Theoretical research in design documents. **Not part of the working desktop software.**

---

## SOURCES & HOW THIS DOCUMENT WAS CREATED

This document was created by directly inspecting the working source code and verified documentation of the Phoenix project repository, including:
* Server architecture and process management (`service/src/server.js`, `carrier.js`, `super-carrier.js`)
* Encrypted database and vector storage (`service/src/db.js`, `platform.js`)
* Memory categorization pipelines (`service/src/memory/semantic.js`, `episodic.js`, `procedural.js`)
* AI fallback chains and Ollama integration (`service/src/llm-fallback.js`)
* Senses and watchers (`service/src/screen-watcher.js`, `webcam-watcher.js`, `activity-tracker.js`)
* Model Context Protocol bridge (`service/src/mcp-server.js`, `mcp/phoenix-tools.js`)
* Mobile companion application (`android/`)
* Smart home controllers (`service/src/skills/home-assistant/`)
* Project documentation (`README.md`, `CLAUDE.md`, `docs/`)

No features were invented or exaggerated. Everything described in this document reflects the actual state of the Phoenix repository.
