# Chatbot Error: "Sorry, I encountered an error. Please try again."

## The Issue
The chatbot is showing "Sorry, I encountered an error. Please try again." when you try to use it.

## Most Likely Cause
**The GROQ_API_KEY is not configured in the Backend/.env file.**

## How to Fix

### Step 1: Check if GROQ_API_KEY exists
Open `Backend/.env` and check if you have this line:
```env
GROQ_API_KEY=your_actual_groq_api_key_here
```

### Step 2: If Missing, Get a Groq API Key
1. Go to: https://console.groq.com/
2. Sign up or log in
3. Navigate to "API Keys" section
4. Click "Create API Key"
5. Copy the generated key

### Step 3: Add to .env File
Open `Backend/.env` and add:
```env
GROQ_API_KEY=gsk_your_actual_key_here
```

**IMPORTANT**: Replace `gsk_your_actual_key_here` with your real API key from Groq.

### Step 4: Restart Backend
After adding the key:
1. Stop the backend (Ctrl+C in the terminal)
2. Start it again: `npm start`

### Step 5: Test Again
Try chatting:
- "What is React?"
- "Hello"
- "Explain JavaScript"

## Other Possible Issues

### Issue 2: Backend Not Running Properly
**Check**: Make sure you see "Server is running on http://localhost:5000" in the backend terminal

**Solution**: 
```bash
cd Backend
npm start
```

### Issue 3: Wrong Backend Port
**Check**: Frontend is trying to connect to `http://localhost:5000/api`

**Verify**: Your `Backend/.env` should have:
```env
PORT=5000
```

### Issue 4: CORS Issues
**Check**: Backend allows requests from `http://localhost:5173`

**Verify**: In `Backend/src/server.js`, line 22-24:
```javascript
app.use(cors({
    origin: "http://localhost:5173"
}))
```

## Quick Checklist

Run through this checklist:

- [ ] ✅ GROQ_API_KEY is set in `Backend/.env`
- [ ] ✅ Backend is running (`npm start`)
- [ ] ✅ Frontend is running (`npm run dev`)
- [ ] ✅ Backend shows "Server is running on http://localhost:5000"
- [ ] ✅ Frontend is accessible at http://localhost:5173
- [ ] ✅ You're logged in to the application
- [ ] ✅ No console errors in browser (press F12 to check)

## Testing the Fix

Once you've added the GROQ_API_KEY and restarted the backend:

1. **Refresh the browser** (F5)
2. **Open the chatbot**
3. **Try a simple question**: "What is Python?"
4. **You should see**: A detailed AI-generated response

## Still Not Working?

### Check Browser Console
1. Press F12 in your browser
2. Go to "Console" tab
3. Look for red error messages
4. Share the error message for more help

### Check Backend Terminal
Look for error messages in the backend terminal, such as:
- "Groq API key not configured"
- "Invalid Groq API key"
- "Rate limit exceeded"

## Example .env File

Your `Backend/.env` should look something like this:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/cloudide
JWT_SECRET=your_jwt_secret_here
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET_NAME=cloud-ide-files
```

**The GROQ_API_KEY line is the critical one for the chatbot to work!**

## How to Verify It's Working

When the chatbot is working correctly:

1. **No error messages** - You should see proper AI responses
2. **Contextual answers** - The AI understands your questions
3. **Code generation works** - You can generate code in files
4. **Quick responses** - Groq is very fast (usually < 2 seconds)

---

**TL;DR**: Add `GROQ_API_KEY=your_key` to `Backend/.env`, restart the backend, and try again! 🚀
