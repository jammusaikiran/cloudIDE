# Code Generation & Refactoring Features - Quick Implementation Guide

## Current Status
✅ Chatbot is working
✅ Code generation endpoint exists (`/ai/generate-code`)
✅ Explain endpoint exists (`/ai/explain`)  
✅ Refactor endpoint exists (`/ai/refactor`)
✅ Command parsing is in place

## What's Missing
The handlers for `explain_file` and `update_file` (refactor) don't actually call the AI APIs - they just show placeholders.

## Quick Fix

### Add Handler for Refactor (after line 391)

Between the `} else if (command && command.action === 'explain_file') {` block and the `} else if (command && command.action === 'generate_code_in_file') {` block, add:

```javascript
} else if (command && command.action === 'update_file') {
    console.log('Refactor command detected');
    if (!selectedFile || !fileContent) {
        const botMessage = {
            id: messages.length + 2,
            type: 'bot',
            content: "Please open a file first, then I can refactor it for you.",
            timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
    } else {
        // Show processing message
        const processingMessage = {
            id: messages.length + 2,
            type: 'bot',
            content: `🔧 Refactoring "${selectedFile.name}"...`,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, processingMessage]);

        // Call AI to refactor the code
        setIsProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axiosInstance.post('/ai/refactor', {
                code: fileContent,
                fileName: selectedFile.name,
                language: selectedFile.name.split('.').pop(),
                improvementType: command.improvement || 'general'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setIsProcessing(false);

            if (response.data.success) {
                const refactoredCode = response.data.data.code;
                const resultMessage = {
                    id: messages.length + 3,
                    type: 'bot',
                    content: `✅ **Refactored Code:**\n\n\`\`\`${selectedFile.name.split('.').pop()}\n${refactoredCode.substring(0, 400)}${refactoredCode.length > 400 ? '\n...' : ''}\n\`\`\`\n\nThe code has been optimized for ${command.improvement || 'general improvements'}!`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, resultMessage]);
            }
        } catch (error) {
            setIsProcessing(false);
            console.error('Refactor error:', error);
            const errorMessage = {
                id: messages.length + 3,
                type: 'bot',
                content: "Failed to refactor code. Please try again.",
                isError: true,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    }
}
```

### Update Explain Handler (replace lines 372-391)

Replace the current explain handler with:

```javascript
} else if (command && command.action === 'explain_file') {
    console.log('Explain command detected');
    if (!selectedFile || !fileContent) {
        const botMessage = {
            id: messages.length + 2,
            type: 'bot',
            content: "Please open a file first, then I can explain it for you.",
            timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
    } else {
        // Show processing message
        const processingMessage = {
            id: messages.length + 2,
            type: 'bot',
            content: `🔍 Analyzing "${selectedFile.name}"...`,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, processingMessage]);

        // Call AI to explain the code
        setIsProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axiosInstance.post('/ai/explain', {
                code: fileContent,
                fileName: selectedFile.name,
                language: selectedFile.name.split('.').pop()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setIsProcessing(false);

            if (response.data.success) {
                const explanationMessage = {
                    id: messages.length + 3,
                    type: 'bot',
                    content: `📄 **Explanation:**\n\n${response.data.data.explanation}`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, explanationMessage]);
            }
        } catch (error) {
            setIsProcessing(false);
            console.error('Explain error:', error);
            const errorMessage = {
                id: messages.length + 3,
                type: 'bot',
                content: "Failed to explain code. Please try again.",
                isError: true,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    }
}
```

## Test Commands

### 1. Code Generation
```
"Generate a prime number checker in primes.py"
"Create a factorial function in math.js"  
"Write a binary search in search.java"
```

### 2. Explain Code
```
(Open a file first, then:)
"Explain this code"
"Explain this file"
```

### 3. Refactor Code
```
(Open a file first, then:)
"Refactor this code"
"Optimize this file"
"Improve the performance"
```

## Expected Workflow

### Code Generation Workflow
1. User: "Generate fibonacci in fibo.py"
2. AI generates the code
3. Code is written to `fibo.py` in your project
4. File appears in file tree
5. You can open and edit it

### Explain Workflow
1. User opens `hello.py`
2. User: "Explain this code"
3. AI analyzes the file content
4. Shows detailed explanation in chat

### Refactor Workflow
1. User opens `messy.js`
2. User: "Refactor this code"
3. AI refactors for improvements
4. Shows refactored code preview in chat
5. (Future: Option to apply changes)

## Alternative: Use General Chat

Since the chatbot now uses AI for ALL responses, you can also just ask naturally:

```
"Can you generate a sorting algorithm in sort.py?"
"Explain what this code does" (with file open)
"How can I improve this code?" (with file open)
```

The AI will understand and respond intelligently even without exact command patterns!
