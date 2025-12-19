# Grok AI Integration Setup Guide

## Overview
The Cloud IDE now uses **Grok AI** by xAI for the AI Copilot feature. This provides real-time code generation, explanations, and intelligent assistance powered by state-of-the-art language models.

## Features
- 🤖 **Real-time AI Chat**: Ask programming questions and get instant answers
- 💻 **Code Generation**: Generate code from natural language descriptions
- 📖 **Code Explanation**: Understand existing code with detailed explanations
- 🔧 **Code Refactoring**: Optimize and improve your code automatically
- 🎯 **Context-Aware**: AI knows about your current file and project context

## Setup Instructions

### 1. Get Your Grok API Key

1. Visit [https://console.x.ai/](https://console.x.ai/)
2. Sign up or log in to your xAI account
3. Navigate to the API Keys section
4. Create a new API key
5. Copy the API key (it starts with `xai-...`)

### 2. Configure the Backend

1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```

2. Open the `.env` file (or create it if it doesn't exist)

3. Add your Grok API key:
   ```env
   GROK_API_KEY=xai-your-api-key-here
   ```

4. Save the file

### 3. Restart the Backend Server

```bash
npm start
```

The server will now use the Grok API for AI features.

## Testing the Integration

1. **Start the application**:
   - Backend: `cd Backend && npm start`
   - Frontend: `cd Frontend && npm run dev`

2. **Open the Cloud IDE** in your browser (usually `http://localhost:5173`)

3. **Test the AI Copilot**:
   - Press `Ctrl + P` to toggle the Copilot panel
   - Ask a question like: "What is React?"
   - Try creating a file: "Create a hello.py file"
   - Generate code: "Generate a prime number function in Python"

## API Endpoints

The following AI endpoints are now available:

### Chat
```
POST /api/ai/chat
```
General AI chat for questions and assistance.

**Request Body:**
```json
{
  "message": "What is recursion?",
  "fileName": "app.js",
  "fileContent": "// current file content",
  "language": "javascript"
}
```

### Generate Code
```
POST /api/ai/generate-code
```
Generate code based on a description.

**Request Body:**
```json
{
  "description": "Create a function to sort an array",
  "language": "javascript",
  "fileName": "utils.js"
}
```

### Explain Code
```
POST /api/ai/explain
```
Get detailed explanation of code.

**Request Body:**
```json
{
  "code": "function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); }",
  "fileName": "math.js",
  "language": "javascript"
}
```

### Refactor Code
```
POST /api/ai/refactor
```
Refactor and optimize code.

**Request Body:**
```json
{
  "code": "// code to refactor",
  "fileName": "app.js",
  "language": "javascript",
  "improvementType": "performance"
}
```

## Troubleshooting

### Error: "AI service not configured"
**Solution**: Make sure you've added `GROK_API_KEY` to your `.env` file and restarted the backend server.

### Error: "Invalid API key"
**Solution**: Double-check that your API key is correct and active on the xAI console.

### Error: "Rate limit exceeded"
**Solution**: You've exceeded the API rate limit. Wait a moment before making more requests, or upgrade your xAI plan.

### Error: "Authentication required"
**Solution**: Make sure you're logged in to the Cloud IDE. The AI features require user authentication.

## Cost & Limits

- Grok API usage is billed by xAI
- Default rate limits apply (check your xAI dashboard)
- Consider implementing caching for frequently asked questions
- Monitor your usage on the xAI console

## Environment Variables Reference

Add these to your `Backend/.env` file:

```env
# Required for AI features
GROK_API_KEY=xai-your-api-key-here

# Other existing env variables
PORT=3000
MONGODB_URI=mongodb://localhost:27017/cloudide
JWT_SECRET=your-jwt-secret
# ... etc
```

## Features by Command

| User Input | AI Action |
|------------|-----------|
| "What is React?" | Explains React concepts |
| "Create a hello.py" | Creates a new Python file |
| "Generate sorting code in utils.js" | Generates and writes sorting code |
| "Explain this code" | Explains the currently open file |
| "Refactor for performance" | Optimizes current file code |
| "Debug this function" | Identifies potential bugs |

## Security Notes

⚠️ **Important**:
- Never commit your `.env` file with the API key to Git
- The `.env` file is already in `.gitignore`
- Rotate your API keys regularly
- Use environment-specific keys for development/production

## Support

If you encounter issues:
1. Check the backend console logs for detailed error messages
2. Verify your API key is valid on https://console.x.ai/
3. Ensure the backend server is running
4. Check your network connection

## Next Steps

Consider implementing:
- [ ] Caching for common queries
- [ ] Rate limiting on the frontend
- [ ] Usage tracking and analytics
- [ ] Streaming responses for better UX
- [ ] Custom system prompts for domain-specific help
