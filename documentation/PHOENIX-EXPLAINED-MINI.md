# Phoenix: The Quick & Simple Guide (Mini Edition)

> **"Phoenix is a personal AI system that runs on your computer. It is designed to remember your work, understand what you are doing, and help you interact with your PC and connected devices."**

If you want the quick 2-minute summary of Phoenix without reading a long manual, this is for you.

---

## 1. What Is Phoenix in 30 Seconds?

* **Normal Chatbots** are like smart strangers with amnesia. Every time you open a new chat, they have completely forgotten who you are and what you talked about yesterday.
* **Phoenix** is like a personal assistant sitting at your desk. It runs quietly in the background on your computer, keeps an encrypted diary of what you do, and remembers your decisions so you never have to repeat yourself.

---

## 2. The 3 Things Phoenix Actually Does

| What It Does | How It Works | Everyday Example |
| :--- | :--- | :--- |
| **1. Remembers Everything** | Saves your chats, commands, and notes into an encrypted memory box on your hard drive. | You tell it your project deadline is Friday; next week you ask *"When is it due?"* and it instantly knows. |
| **2. Sees & Senses** | Notices what window you have open and can check if you are sitting at your desk with your webcam. | You step away from your computer; Phoenix pauses reminders until you sit back down. |
| **3. Reaches Other Devices** | Connects to your Android phone, other PCs in your house, and smart home lights. | You are downstairs on the couch and ask your phone: *"Did my PC finish its backup?"* |

---

## 3. How It Works (The Brain vs. The Body)

A lot of people ask: *"Is Phoenix the AI?"*

The easiest way to understand it is:

```text
┌─────────────────────────────────────────────────────────────┐
│                           PHOENIX                           │
│                         (The Body)                          │
│                                                             │
│   • SENSES:   Notices your active window and desk presence  │
│   • MEMORY:   Organized, encrypted diary on your hard drive │
│   • HANDS:    Runs computer commands & controls devices     │
│                                                             │
│                 ┌─────────────────────────┐                 │
│                 │       THE AI BRAIN      │                 │
│                 │   (Gemma 4 or Claude)   │                 │
│                 │                         │                 │
│                 │ "Reads notes, reasons,  │                 │
│                 │   and writes answers"   │                 │
│                 └─────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

* **The AI Model** is the **brain** that understands language.
* **Phoenix** is the **body, memory, and hands** that give that brain access to your computer, notes, and devices.

---

## 4. The 3 Kinds of Memory

Phoenix doesn't just store a giant pile of text. It files information into three distinct drawers:

1. **What Happened (Episodic):** A timeline of your day (*"Ran a backup at 3:00 PM; worked on math homework at 4:30 PM"*).
2. **Facts Learned (Semantic):** Things it learns about you (*"Prefers dark mode; allergic to peanuts; project deadline is Oct 18"*).
3. **How-To Skills (Procedural):** Instructions on how to run tasks or commands on your computer.

---

## 5. A Quick Real-Life Example

**Imagine Sarah is working on a school history paper:**

1. **Monday:** Sarah tells Phoenix: *"My history paper is on the Roman Empire and needs 4 sources."* Phoenix files this fact into its memory box.
2. **Wednesday:** Sarah has been researching all afternoon. She leaves to eat dinner.
3. **Thursday:** Sarah sits down and asks: *"What were the requirements for my history paper?"*
4. **Result:** Phoenix searches its encrypted memory and tells her: *"Your paper is on the Roman Empire and needs 4 sources."* Sarah didn't have to search through old papers or notes.

---

## 6. How to Actually Use Phoenix

Using Phoenix is as simple as chatting with an assistant, whether you are at your desk or on the move:

### Step 1: Start Phoenix
* **One-Click Launch:** Double-click `PHOENIX.bat` on your computer (or run `cd service && node phoenix.js start`).
* **Open the Dashboard:** Navigate to `http://localhost:7777/v2/terminal` in your web browser (or use the Phoenix desktop app).
* **For 100% Free & Offline AI:** Install [Ollama](https://ollama.com) and pull the default lightweight models:
  ```bash
  ollama pull gemma4:e2b
  ollama pull qwen3-embedding:0.6b
  ```

### Step 2: The 3 Ways to Interact
1. **Web / Desktop Dashboard:** Chat, view your encrypted memory log, run commands, and organize tasks from `http://localhost:7777/v2/terminal`.
2. **AI Coding Tools (Claude Code / MCP):** If you use Claude Code, Phoenix connects automatically via `.mcp.json`. Every new coding session starts with Claude already remembering your recent progress and decisions.
3. **Android Phone App:** Tap the microphone or type to your home PC from anywhere over a private, secure connection (Tailscale).

### Step 3: Everyday Prompts You Can Use

| What You Want | Example Prompt | What Phoenix Does |
| :--- | :--- | :--- |
| **Save a fact or preference** | *"Remember that the team presentation is rescheduled to Friday at 3 PM."* | Extracts the fact and stores it in semantic memory. |
| **Recall past information** | *"When did we say the team presentation was?"* | Searches memory and replies with Friday at 3 PM. |
| **Check where you left off** | *"What was I working on before lunch?"* | Checks your recent window activity and screen notes. |
| **Trigger smart home devices** | *"Turn on the desk lamp."* | Matches the name to Home Assistant and turns on the light. |
| **Multi-device commands** | *"Did the backup finish on my desktop?"* | Checks the status of your computer even while you are on your phone. |

---

## 7. Where Does Your Data Go? (Local vs. Cloud)

* **Your Memories & Files:** **100% on your own computer.** They are stored in an encrypted database (`phoenix.db`) on your disk. They are never uploaded to a public cloud.
* **Local Offline AI:** Phoenix can think completely offline using **Ollama** (free local AI models like Google's Gemma 4). Unplug your internet, and it still works!
* **Optional Cloud AI:** For voice chats on your phone, Phoenix can optionally use fast cloud AI (like Claude) so spoken replies come back in under 1 second.
* **Full Privacy Mode:** You can toggle Phoenix to **"Local Only"** so not a single word ever leaves your PC.

---

## 8. Reality Check: Today vs. Future

| Works Right Now (Today) | Future Research (Not Built Yet) |
| :--- | :--- |
| Encrypted memory search across all chats & notes | A physical wearable pendant necklace with camera/mic |
| Window activity & screen awareness | Biometric sensors (air quality, radiation, heart rate) |
| Webcam presence detection (is someone at the desk?) | Fully autonomous AI that rewrites its own code |
| Android phone app connecting over a private network | |
| Smart home control (turning on lights via Home Assistant) | |
| Free offline AI models running on your PC | |

---

## 9. Fast FAQ

* **Do I need to know how to code?** No. You can talk or type to Phoenix just like any messaging app.
* **Does it remember after I turn off my PC?** Yes. All memories are saved to disk and reload when you turn your PC back on.
* **Can someone steal my notes?** The database is locked with an encryption key (`phoenix.key`). Without the key, the file is unreadable scramble.
* **Does it replace Windows?** No, it runs quietly as an assistant inside Windows or Linux.
* **How do I stop or shut down Phoenix?** You can shut it down from the dashboard's Settings panel or close the server command window.

---

*(For the complete, deep-dive explanation of all 16 sections, see the full [PHOENIX-EXPLAINED.md](./PHOENIX-EXPLAINED.md).)*
