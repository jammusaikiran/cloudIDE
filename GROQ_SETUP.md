# 🚀 Groq Cloud Setup - Quick Start

## ⚡ What is Groq?

**Groq Cloud** provides ultra-fast AI inference with models like:
- **Llama 3.1** (70B & 8B) - Fast and capable
- **Mixtral 8x7B** - High performance
- **Gemma 2** - Efficient reasoning

**Why Groq?**
- ⚡ **Ultra-fast** inference (up to 10x faster than competitors)
- 🆓 **Free tier** available
- 🎯 **Production-ready** models
- 💰 **Cost-effective** pricing

---

## 📋 3-Minute Setup

### Step 1: Get Groq API Key (2 minutes)
1. Go to: **https://console.groq.com/**
2. Sign up (free) or log in
3. Click "**API Keys**" in the sidebar
4. Click "**Create API Key**"
5. Copy the key (starts with `gsk_`)

### Step 2: Configure Backend (30 seconds)
1. Open `Backend/.env` file
2. Add this line:
   ```env
   GROQ_API_KEY=gsk_paste-your-key-here
   ```
3. Save the file

### Step 3: Restart Backend (30 seconds)
```bash
cd Backend
npm start
```

---

## ✅ Test It Works!

### Open your Cloud IDE and try:

1. **Press `Ctrl + P`** to open AI Copilot

2. **Ask a question**:
   ```
   Explain React hooks
   ```
   ✅ Should get intelligent response from Llama 3.1

3. **Generate code**:
   ```
   Generate a factorial function in math.py
   ```
   ✅ Should create file with AI-generated code

4. **Explain code**:
   - Open any file
   - Type: `Explain this code`
   ✅ Should analyze actual file content

---

## 🎯 Quick Commands

| Say This | AI Does This |
|----------|--------------|
| `Explain Python` | Explains Python concepts |
| `Generate sorting code in utils.js` | Creates utils.js with sorting code |
| `Explain this code` | Analyzes open file |
| `Refactor for performance` | Optimizes open file |
| `Create test.py` | Creates empty test.py file |

---

## 🆓 Free Tier Limits

Groq's free tier includes:
- **14,400 requests/day** (10 requests/minute)
- **Llama 3.1 70B**: Up to 6,000 tokens/min
- **Llama 3.1 8B**: Up to 30,000 tokens/min
- Perfect for development and testing!

---

##⚠️ Troubleshooting

### "AI service not configured"
→ Add `GROQ_API_KEY` to `.env` and restart backend

### "Authentication required"  
→ Log in to the Cloud IDE first

### "Rate limit exceeded"
→ Wait 1 minute (free tier: 10 requests/min)

---

## 🔄 Migrating from Grok to Groq

If you were using Grok before:
1. Replace `GROK_API_KEY` with `GROQ_API_KEY` in `.env`
2. Get new API key from console.groq.com
3. Restart backend

**All done!** Groq is faster and has better free tier! 🚀

---

## 📖 Available Models

The AI Copilot uses **Llama 3.1 70B Versatile** by default, which offers:
- Excellent balance of speed and quality
- Great for code generation and explanations
- Context window: 8,192 tokens

### Other Available Models:
- `llama-3.1-8b-instant` - Ultra-fast responses
- `mixtral-8x7b-32768` - Large context window
- `gemma2-9b-it` - Efficient reasoning

---

## 🎉 Done!

Your AI Copilot is now powered by **Groq Cloud**!

Enjoy blazing-fast, intelligent coding assistance! ⚡🚀
