# Pulse

Your household command center — track deadlines, expenses, birthdays, and more. With voice input/output, AI assistant, document scanning, and calendar sync.

---

## 🚀 Deploy to Samsung Phone

### Prerequisites
- Node.js installed → https://nodejs.org
- Git installed → https://git-scm.com
- Vercel account → https://vercel.com
- Anthropic API key → https://console.anthropic.com

### Step 1: Clone and Set Up

```bash
git clone https://github.com/aiexecutive4yourbusiness-tech/Pulse.git
cd Pulse
npm install

# Create environment file
copy .env.example .env.local
# Edit .env.local → add your Anthropic API key
```

### Step 2: Test Locally (optional)

```bash
npm run dev
# Open http://localhost:3000
```

### Step 3: Deploy to Vercel

**Option A — Via Vercel Dashboard (easiest):**
1. Go to **vercel.com** → "Add New Project"
2. Import your **Pulse** repo from GitHub
3. Go to Settings → Environment Variables
4. Add `ANTHROPIC_API_KEY` = your key
5. Deploy

**Option B — Via CLI:**
```bash
vercel
vercel env add ANTHROPIC_API_KEY
vercel --prod
```

### Step 4: Generate Android APK

1. Go to **https://www.pwabuilder.com**
2. Paste your Vercel URL
3. Click "Package for stores" → "Android"
4. Download the APK

### Step 5: Install on Samsung

1. Transfer `.apk` to your phone (email / Google Drive / USB)
2. Tap the file → Install
3. Allow "unknown sources" if prompted
4. Done — Pulse is on your home screen!

### Updating the App

After any changes:
```bash
git add .
git commit -m "Description of changes"
git push
```
Vercel auto-deploys within 30 seconds. To update the Samsung app, regenerate the APK from PWABuilder.

---

## ✨ Features

**Views:** Timeline · Calendar · Category · Family Dashboard

**Voice:** 🎙️ Speak to fill forms (EN/DE auto-detect) · 🤖 AI Assistant · 🔊 Voice replies

**Smart:** 📷 Document scanner · 🎁 Gift profiler · 📅 Calendar sync · ↻ Recurring events · 💰 Expense tracking · 📎 Attachments · 👤 Task assignment

**Personalization:** 5 themes · Custom colors · Dark mode

---

## 🔧 Tech Stack

Next.js 14 · next-pwa · Anthropic API · Web Speech API · Vercel · PWABuilder
