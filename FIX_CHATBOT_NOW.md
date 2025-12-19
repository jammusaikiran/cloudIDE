# URGENT: Add GROQ API Key to Fix Chatbot

## The Issue
The chatbot is showing "Sorry, I encountered an error. Please try again." because the **GROQ_API_KEY is NOT configured** in your `Backend/.env` file.

## How to Fix (Step-by-Step)

### Step 1: Get a FREE Groq API Key

1. **Go to Groq Console**: https://console.groq.com/
2. **Sign up or Login** (it's FREE)
3. Click on **"API Keys"** in the left menu
4. Click **"Create API Key"**
5. **Copy the API key** (it starts with `gsk_`)

### Step 2: Add to .env File

1. **Open** `Backend/.env` file
2. **Add this line**:
   ```env
   GROQ_API_KEY=gsk_paste_your_actual_key_here
   ```
3. **Replace** `gsk_paste_your_actual_key_here` with your real key from Step 1
4. **Save** the file (Ctrl+S)

### Step 3: Restart Backend

**IMPORTANT**: After adding the key, you MUST restart the backend!

In the backend terminal:
1. Press `Ctrl+C` to stop the server
2. Run: `npm run dev`
3. Wait for "Server is running on http://localhost:5000"

### Step 4: Test Chatbot

1. **Refresh** the browser (F5)
2. **Open chatbot** in your Cloud IDE
3. **Type**: "What is React?"
4. **You should see**: An AI-generated answer about React!

## Example .env File

Your `Backend/.env` should look like this:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/cloudide
JWT_SECRET=your_jwt_secret_here

# ⭐ ADD THIS LINE - This is the critical one for chatbot! ⭐
GROQ_API_KEY=gsk_your_actual_groq_api_key_from_console

# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET_NAME=cloud-ide-files
```

## How to Verify It's Fixed

### ✅ Success Signs:
- No more "Sorry, I encountered an error" messages
- Chatbot responds with intelligent AI-generated answers
- Responses are contextual and helpful
- Code generation works

### ❌ Still Broken Signs:
- Still seeing error messages
- Backend console shows "Groq API key not configured"
- 401 or 500 errors

## Troubleshooting

### Problem: "Invalid Groq API key"
**Solution**: Your API key is wrong. Go back to https://console.groq.com/ and create a new one.

### Problem: "Rate limit exceeded"
**Solution**: You've hit the free tier limit. Wait a few minutes and try again.

### Problem: Backend not restarting
**Solution**: 
1. Close the terminal
2. Open a new terminal
3. `cd Backend`
4. `npm run dev`

### Problem: Still getting errors after adding key
**Solution**:
1. Double-check the key is correct (no extra spaces)
2. Make sure the line is: `GROQ_API_KEY=gsk_your_key` (no quotes)
3. Restart backend completely
4. Clear browser cache (Ctrl+Shift+Delete)
5. Refresh page (F5)

## Quick Test Commands

After adding the key and restarting, try these in the chatbot:

```
1. "Hello" 
   Expected: Friendly greeting

2. "What is Python?" 
   Expected: Detailed explanation of Python

3. "Generate a factorial function in math.js"
   Expected: Code generated and written to file

4. "Explain React hooks"
   Expected: Comprehensive explanation
```

## What's Happening Behind the Scenes

### Without GROQ_API_KEY ❌
```
User: "What is React?"
   ↓
Frontend sends request to /api/ai/chat
   ↓
Backend tries to call Groq API
   ↓
❌ Error: No API key found
   ↓
Backend returns 500 error
   ↓
Chatbot shows: "Sorry, I encountered an error"
```

### With GROQ_API_KEY ✅
```
User: "What is React?"
   ↓
Frontend sends request to /api/ai/chat
   ↓
Backend calls Groq API with your key
   ↓
✅ Groq AI (Llama 3.1) generates response
   ↓
Backend returns AI response
   ↓
Chatbot shows: Detailed answer about React!
```

## Common Mistakes to Avoid

1. ❌ Adding quotes: `GROQ_API_KEY="gsk_xxx"` (WRONG)
2. ✅ No quotes: `GROQ_API_KEY=gsk_xxx` (CORRECT)

3. ❌ Extra spaces: `GROQ_API_KEY = gsk_xxx` (WRONG)
4. ✅ No spaces around =: `GROQ_API_KEY=gsk_xxx` (CORRECT)

5. ❌ Wrong variable name: `GROQ_KEY=gsk_xxx` (WRONG)
6. ✅ Exact name: `GROQ_API_KEY=gsk_xxx` (CORRECT)

7. ❌ Forgetting to restart backend (WRONG)
8. ✅ Always restart after changing .env (CORRECT)

## Your Action Items (Do This Now!)

- [ ] Step 1: Go to https://console.groq.com/ and get API key
- [ ] Step 2: Open `Backend/.env` file
- [ ] Step 3: Add line: `GROQ_API_KEY=gsk_your_actual_key`
- [ ] Step 4: Save the file
- [ ] Step 5: Stop backend (Ctrl+C)
- [ ] Step 6: Start backend (`npm run dev`)
- [ ] Step 7: Wait for "Server is running..."
- [ ] Step 8: Refresh browser (F5)
- [ ] Step 9: Test chatbot: "What is React?"
- [ ] Step 10: 🎉 Enjoy your working AI chatbot!

---

## TL;DR (Too Long; Didn't Read)

1. **Get key**: https://console.groq.com/ (free signup)
2. **Add to Backend/.env**: `GROQ_API_KEY=gsk_your_key_here`
3. **Restart backend**: Ctrl+C, then `npm run dev`
4. **Test**: Type "What is React?" in chatbot
5. **Celebrate**: You now have a working AI assistant! 🚀

---

**This is the ONLY thing preventing your chatbot from working!** Once you add the GROQ_API_KEY, everything will work perfectly! 💪
