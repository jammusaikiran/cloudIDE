import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Code2, FolderPlus, FileText, MessageCircle, X, Copy, Check } from 'lucide-react';
import { axiosInstance } from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { parseCopilotCommand, generateSmartCode } from '../utils/copilotUtils';

const CopilotChat = ({ onCreateFile, onUpdateFile, onCreateProject, selectedFile, fileContent, folderId, onRefresh }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            content: "👋 Hello! I'm your Copilot. I can help you:\n• Write and refactor code\n• Create new files and projects\n• Modify existing files\n• Answer questions about your code\n\nWhat would you like me to help you with?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef(null);
    const [copiedId, setCopiedId] = useState(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Mock AI response - in production, this would call an actual AI API
    const generateAIResponse = async (userMessage) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const lowerMessage = userMessage.toLowerCase().trim();

        // Handle incomplete commands
        if (lowerMessage === 'create' || lowerMessage === 'explain') {
            return {
                type: 'guide',
                content: `I see you want to ${lowerMessage}. Could you provide more details?\n\nExamples:\n• "Create a utils.py"\n• "Explain the current file"\n• "Generate a sorting function in utils.py"`,
                isGuide: true
            };
        }

        // Check for code generation in file (e.g., "generate prime number code in hello.py")
        if ((lowerMessage.includes('generate') || lowerMessage.includes('write')) && 
            (lowerMessage.includes('code') || lowerMessage.includes('function'))) {
            const inMatch = userMessage.match(/in\s+([a-zA-Z0-9._\-]+\.[a-zA-Z0-9]+)/i);
            if (inMatch) {
                const fileName = inMatch[1];
                return {
                    type: 'code_generation',
                    action: 'generate_code_in_file',
                    fileName,
                    content: `I'll generate code for: ${userMessage}\n\nGenerating code...`,
                    suggestion: `Code will be added to ${fileName}`
                };
            }
        }

        // Check for explanation requests
        if (lowerMessage.includes('explain')) {
            if (!selectedFile) {
                return {
                    type: 'guide',
                    content: "Open a file or select a project to get started. I can then help you with code modifications and analysis.",
                    isGuide: true
                };
            }
            const codeSnippet = fileContent.substring(0, 300);
            return {
                type: 'text',
                content: `📄 Analyzing "${selectedFile}"...\n\n${codeSnippet}${fileContent.length > 300 ? '...' : ''}\n\nWould you like me to:\n• Explain this code in detail\n• Refactor it for better performance\n• Add comments and documentation`
            };
        }

        // Check for file creation requests
        if (lowerMessage.includes('create') && lowerMessage.includes('file')) {
            return {
                type: 'suggestion',
                action: 'create_file',
                content: "I can create a new file for you. What should I name it and what language?",
                suggestion: "Example: 'Create a file named utils.js with JavaScript code for sorting'"
            };
        }

        // Check for project creation requests
        if (lowerMessage.includes('create') && (lowerMessage.includes('project') || lowerMessage.includes('app'))) {
            return {
                type: 'suggestion',
                action: 'create_project',
                content: "I can generate a project structure for you. What type of project? (React, Node.js, Python, etc.)",
                suggestion: "Example: 'Create a React project with components, hooks, and utilities'"
            };
        }

        // Check for refactoring/modification requests
        if ((lowerMessage.includes('refactor') || lowerMessage.includes('optimize') || lowerMessage.includes('improve'))) {
            if (!selectedFile) {
                return {
                    type: 'guide',
                    content: "Open a file or select a project to get started. I can then help you with code modifications and analysis.",
                    isGuide: true
                };
            }
            return {
                type: 'suggestion',
                action: 'update_file',
                content: "I can refactor the current file to improve it. What aspect would you like me to focus on?",
                suggestion: "Performance, readability, or following best practices?"
            };
        }

        // === KNOWLEDGE BASE: Answer general questions ===
        
        // React questions
        if ((lowerMessage.includes('what is react') || lowerMessage.includes('what\'s react') || lowerMessage.includes('tell me about react'))) {
            return {
                type: 'text',
                content: `**React** is a popular JavaScript library for building user interfaces, developed by Facebook.\n\n**Key Features:**\n• **Component-Based**: Build encapsulated components that manage their own state\n• **Declarative**: Design simple views for each state in your app\n• **Virtual DOM**: Efficiently updates and renders components\n• **Learn Once, Write Anywhere**: Works for web, mobile (React Native), and desktop\n\n**Example:**\n\`\`\`jsx\nfunction Welcome() {\n  return <h1>Hello, React!</h1>;\n}\n\`\`\`\n\nWould you like to create a React component?`
            };
        }

        // JavaScript questions
        if ((lowerMessage.includes('what is javascript') || lowerMessage.includes('what\'s javascript') || lowerMessage.includes('tell me about javascript'))) {
            return {
                type: 'text',
                content: `**JavaScript** is a versatile programming language that powers the web.\n\n**Key Features:**\n• **High-level**: Easy to read and write\n• **Dynamic**: Variables can hold any type\n• **Prototype-based**: Object-oriented with prototypes\n• **Event-driven**: Great for interactive web pages\n• **Runs everywhere**: Browsers, servers (Node.js), mobile apps\n\n**Popular Uses:**\n• Web development (frontend & backend)\n• Mobile apps (React Native)\n• Desktop apps (Electron)\n• Game development\n\nNeed help with JavaScript code?`
            };
        }

        // Python questions
        if ((lowerMessage.includes('what is python') || lowerMessage.includes('what\'s python') || lowerMessage.includes('tell me about python'))) {
            return {
                type: 'text',
                content: `**Python** is a high-level, interpreted programming language known for its simplicity.\n\n**Key Features:**\n• **Easy to Learn**: Clean, readable syntax\n• **Versatile**: Web, data science, AI, automation, and more\n• **Extensive Libraries**: NumPy, Pandas, Django, Flask, etc.\n• **Cross-platform**: Runs on Windows, Mac, Linux\n\n**Popular Uses:**\n• Data Science & Machine Learning\n• Web Development (Django, Flask)\n• Automation & Scripting\n• Scientific Computing\n\nWant to create a Python file?`
            };
        }

        // Node.js questions
        if ((lowerMessage.includes('what is node') || lowerMessage.includes('what\'s node') || lowerMessage.includes('tell me about node'))) {
            return {
                type: 'text',
                content: `**Node.js** is a JavaScript runtime built on Chrome's V8 engine.\n\n**Key Features:**\n• **Server-side JavaScript**: Run JS outside the browser\n• **Asynchronous & Event-driven**: Non-blocking I/O operations\n• **NPM**: Largest package ecosystem\n• **Fast & Scalable**: Perfect for real-time applications\n\n**Common Uses:**\n• REST APIs & Microservices\n• Real-time apps (chat, games)\n• Web servers\n• Command-line tools\n\nNeed help with a Node.js project?`
            };
        }

        // HTML/CSS questions
        if ((lowerMessage.includes('what is html') || lowerMessage.includes('what\'s html'))) {
            return {
                type: 'text',
                content: `**HTML** (HyperText Markup Language) is the standard language for creating web pages.\n\n**Key Concepts:**\n• **Elements**: Building blocks (div, p, h1, img, etc.)\n• **Attributes**: Add info to elements (class, id, src)\n• **Semantic**: Use meaningful tags (header, nav, article)\n• **Structure**: Head (metadata) and Body (content)\n\n**Basic Structure:**\n\`\`\`html\n<!DOCTYPE html>\n<html>\n  <head><title>My Page</title></head>\n  <body>\n    <h1>Hello World!</h1>\n  </body>\n</html>\n\`\`\`\n\nWant to create an HTML file?`
            };
        }

        if ((lowerMessage.includes('what is css') || lowerMessage.includes('what\'s css'))) {
            return {
                type: 'text',
                content: `**CSS** (Cascading Style Sheets) is used to style and layout web pages.\n\n**Key Features:**\n• **Selectors**: Target HTML elements\n• **Properties**: Color, font, spacing, layout\n• **Responsive**: Adapt to different screen sizes\n• **Animations**: Create smooth transitions\n\n**Example:**\n\`\`\`css\n.button {\n  background: blue;\n  color: white;\n  padding: 10px 20px;\n  border-radius: 5px;\n}\n\`\`\`\n\nNeed help styling your page?`
            };
        }

        // Programming concepts
        if (lowerMessage.includes('what is api') || lowerMessage.includes('what\'s api')) {
            return {
                type: 'text',
                content: `**API** (Application Programming Interface) allows different software to communicate.\n\n**Types:**\n• **REST API**: Uses HTTP methods (GET, POST, PUT, DELETE)\n• **GraphQL**: Query language for APIs\n• **WebSocket**: Real-time, bidirectional communication\n\n**Example REST Endpoint:**\n\`\`\`\nGET /api/users      → Get all users\nPOST /api/users     → Create user\nPUT /api/users/:id  → Update user\nDELETE /api/users/:id → Delete user\n\`\`\`\n\nWant to create API endpoints?`
            };
        }

        if (lowerMessage.includes('what is git') || lowerMessage.includes('what\'s git')) {
            return {
                type: 'text',
                content: `**Git** is a distributed version control system for tracking code changes.\n\n**Key Commands:**\n• \`git init\` - Initialize repository\n• \`git add .\` - Stage changes\n• \`git commit -m "message"\` - Save changes\n• \`git push\` - Upload to remote\n• \`git pull\` - Download updates\n• \`git branch\` - Create branches\n\n**Benefits:**\n• Track history of changes\n• Collaborate with teams\n• Revert to previous versions\n• Work on features in parallel\n\nNeed help with Git?`
            };
        }

        // General help responses
        if (lowerMessage.includes('help') || lowerMessage === '?') {
            return {
                type: 'text',
                content: `I'm your AI coding assistant! Here's what I can do:\n\n**💬 Chat & Learn:**\n• Ask me about programming languages\n• Learn concepts (APIs, Git, databases)\n• Get explanations and examples\n\n**📄 File Operations:**\n• Create new files\n• Generate code snippets\n• Modify existing files\n\n**🔧 Code Help:**\n• Refactor code\n• Find bugs\n• Optimize performance\n\n**Examples:**\n• "What is React?"\n• "Create a hello.py"\n• "Generate sorting code in utils.js"\n\nWhat would you like to know?`
            };
        }

        // Greetings
        if (lowerMessage.match(/^(hi|hello|hey|greetings)$/)) {
            return {
                type: 'text',
                content: `👋 Hello! I'm your AI Copilot assistant.\n\nI can help you with:\n• Answering programming questions\n• Creating and editing files\n• Generating code\n• Explaining concepts\n\nWhat would you like to do today?`
            };
        }

        // Default response for unrecognized questions
        return {
            type: 'text',
            content: `I'm here to help! I can:\n\n💡 **Answer questions** about:\n• Programming languages (React, Python, JavaScript, etc.)\n• Concepts (APIs, Git, databases)\n• Best practices\n\n✏️ **Help with code**:\n• Create files: "Create a test.py"\n• Generate code: "Generate prime numbers in math.py"\n• Explain code in open files\n\nTry asking me something like:\n• "What is React?"\n• "Create a utils.js file"\n• "Explain this code"\n\nWhat would you like to know?`
        };
    };

    const createFileAction = async (fileName, language = 'javascript') => {
        if (!folderId) {
            console.error('No folderId provided');
            toast.error('Please select a folder first');
            return false;
        }

        if (!fileName || fileName.trim() === '') {
            console.error('No filename provided');
            toast.error('Please provide a valid filename');
            return false;
        }

        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.error('No auth token found');
                toast.error('Authentication required. Please log in again.');
                return false;
            }
            
            // Create file blob with empty content
            const contentType = getContentType(fileName, language);
            const blob = new Blob([''], { type: contentType });
            const fileObj = new window.File([blob], fileName, { type: contentType });

            const formData = new FormData();
            formData.append('files', fileObj);
            formData.append('folderId', folderId);

            console.log('Creating file with:', {
                fileName,
                folderId,
                contentType,
                tokenPresent: !!token
            });

            const response = await axiosInstance.post('/files/upload-file', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('File creation response:', response.data);

            if (response.data.success) {
                toast.success(`File "${fileName}" created successfully!`);
                if (onRefresh) {
                    console.log('Calling onRefresh callback');
                    onRefresh();
                }
                return true;
            } else {
                console.error('File creation failed:', response.data.message);
                toast.error(response.data.message || 'Failed to create file');
                return false;
            }
        } catch (error) {
            console.error('Error creating file:', error);
            console.error('Error response:', error.response?.data);
            toast.error(error.response?.data?.message || error.message || 'Error creating file');
            return false;
        }
    };

    const getContentType = (fileName, language) => {
        const ext = fileName.split('.').pop().toLowerCase();
        const typeMap = {
            'js': 'text/javascript',
            'jsx': 'text/javascript',
            'ts': 'text/typescript',
            'tsx': 'text/typescript',
            'json': 'application/json',
            'html': 'text/html',
            'css': 'text/css',
            'txt': 'text/plain',
            'md': 'text/markdown',
            'py': 'text/x-python',
            'java': 'text/x-java',
            'cpp': 'text/x-c++src',
            'c': 'text/x-csrc',
        };
        return typeMap[ext] || 'text/plain';
    };

    const updateFileWithCode = async (fileName, codeContent) => {
        if (!folderId) {
            console.error('No folder selected');
            toast.error('Please select a project folder first');
            return false;
        }

        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.error('No auth token found');
                toast.error('Authentication required. Please log in again.');
                return false;
            }

            // First, try to get the file to update it
            // If it doesn't exist, create it
            const contentType = getContentType(fileName, 'text');
            const blob = new Blob([codeContent], { type: contentType });
            const fileObj = new window.File([blob], fileName, { type: contentType });

            const formData = new FormData();
            formData.append('files', fileObj);
            formData.append('folderId', folderId);

            console.log('Updating file with generated code:', {
                fileName,
                folderId,
                codeLength: codeContent.length,
                tokenPresent: !!token
            });

            const response = await axiosInstance.post('/files/upload-file', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('File update response:', response.data);

            if (response.data.success) {
                toast.success(`Code generated and added to "${fileName}"!`);
                if (onRefresh) {
                    console.log('Refreshing file tree');
                    onRefresh();
                }
                return true;
            } else {
                console.error('File update failed:', response.data.message);
                toast.error(response.data.message || 'Failed to update file');
                return false;
            }
        } catch (error) {
            console.error('Error updating file:', error);
            console.error('Error response:', error.response?.data);
            toast.error(error.response?.data?.message || error.message || 'Error updating file');
            return false;
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        console.log('=== COPILOT MESSAGE START ===');
        console.log('User input:', input);
        console.log('FolderId:', folderId);
        console.log('OnRefresh:', typeof onRefresh);

        // Add user message
        const userMessage = {
            id: messages.length + 1,
            type: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Parse command to check if it's a file creation request
            console.log('Parsing command...');
            const command = parseCopilotCommand(input);
            console.log('Parsed command:', command);
            
            if (command && command.action === 'create_file') {
                console.log('File creation request detected');
                console.log('Command details:', {
                    action: command.action,
                    fileName: command.fileName,
                    language: command.language
                });

                // Extract filename - more robust pattern
                // Matches: "Create a mod.py", "Create file mod.py", "Create mod.py", etc.
                let fileName = null;
                
                // Try multiple patterns to extract filename
                const patterns = [
                    /(?:create|create a|file|named?)\s+([a-zA-Z0-9._\-]+(?:\.[a-zA-Z0-9]+)?)/i,
                    /([a-zA-Z0-9._\-]+(?:\.[a-zA-Z0-9]+)?)\s*$/i,
                ];
                
                console.log('Attempting to extract filename from input:', input);
                for (let i = 0; i < patterns.length; i++) {
                    const pattern = patterns[i];
                    const match = input.match(pattern);
                    console.log(`Pattern ${i}:`, pattern, 'Match:', match);
                    if (match && match[1]) {
                        fileName = match[1];
                        console.log(`Pattern ${i} matched! Filename: ${fileName}`);
                        break;
                    }
                }
                
                // If still no filename, use command's default
                if (!fileName) {
                    fileName = command.fileName;
                    console.log('Using command filename:', fileName);
                }
                
                // Clean up filename - replace slashes with dots
                fileName = fileName.replace(/\//g, '.').trim();
                console.log('Final filename:', fileName);
                
                setIsProcessing(true);
                const success = await createFileAction(fileName, command.language);
                setIsProcessing(false);

                const botMessage = {
                    id: messages.length + 2,
                    type: 'bot',
                    content: success 
                        ? `✅ File "${fileName}" has been created successfully! You can now start editing it.`
                        : `❌ Failed to create file "${fileName}". Please try again.`,
                    timestamp: new Date()
                };
                
                setMessages(prev => [...prev, botMessage]);
            } else if (command && command.action === 'explain_file') {
                console.log('Explain command detected');
                if (!selectedFile) {
                    const botMessage = {
                        id: messages.length + 2,
                        type: 'bot',
                        content: "Open a file or select a project to get started. I can then help you with code modifications and analysis.",
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, botMessage]);
                } else {
                    const codeSnippet = fileContent.substring(0, 300);
                    const botMessage = {
                        id: messages.length + 2,
                        type: 'bot',
                        content: `📄 File: ${selectedFile}\n\n${codeSnippet}${fileContent.length > 300 ? '\n...' : ''}\n\nThis file contains ${fileContent.length} characters. Would you like me to explain it in detail, refactor it, or add documentation?`,
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, botMessage]);
                }
            } else if (command && command.action === 'generate_code_in_file') {
                console.log('Code generation request detected for file:', command.fileName);
                
                // Generate the code
                const generatedCode = generateSmartCode(command.codeDescription, command.language);
                console.log('Generated code length:', generatedCode.length);
                
                // Show initial message
                const initialMessage = {
                    id: messages.length + 2,
                    type: 'bot',
                    content: `✨ Generating code for: ${command.codeDescription}\n\nWriting to: ${command.fileName}...`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, initialMessage]);
                
                // Update the file with generated code
                setIsProcessing(true);
                const success = await updateFileWithCode(command.fileName, generatedCode);
                setIsProcessing(false);
                
                // Show result message
                const resultMessage = {
                    id: messages.length + 3,
                    type: 'bot',
                    content: success 
                        ? `✅ Code successfully generated and written to "${command.fileName}"!\n\n${generatedCode.substring(0, 200)}...\n\nOpen the file to see the complete code.`
                        : `❌ Failed to write code to "${command.fileName}". Please try again.`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, resultMessage]);
            } else {
                console.log('Not a file creation request, generating AI response');
                // Generate AI response for other messages
                const response = await generateAIResponse(input);
                console.log('AI response:', response);
                
                const botMessage = {
                    id: messages.length + 2,
                    type: 'bot',
                    content: response.content,
                    action: response.action,
                    suggestion: response.suggestion,
                    isGuide: response.isGuide,
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, botMessage]);
            }
            console.log('=== COPILOT MESSAGE END ===');
        } catch (error) {
            console.error('Error in handleSendMessage:', error);
            const errorMessage = {
                id: messages.length + 2,
                type: 'bot',
                content: "Sorry, I encountered an error. Please try again.",
                isError: true,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleActionClick = (action) => {
        if (action === 'create_file') {
            setInput('Create a file named ');
        } else if (action === 'create_project') {
            setInput('Create a ');
        } else if (action === 'update_file') {
            setInput('Refactor the current file to ');
        }
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col h-full">
            {/* Header */}
            <div className="bg-gray-800/50 border-b border-gray-800 px-4 py-3 flex items-center gap-2">
                <MessageCircle size={18} className="text-blue-400" />
                <h3 className="font-semibold text-white flex-1">Copilot</h3>
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Beta</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {message.type === 'bot' && (
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                <Code2 size={16} />
                            </div>
                        )}
                        
                        <div
                            className={`max-w-xs rounded-lg px-3 py-2 ${
                                message.type === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : message.isError
                                    ? 'bg-red-900/30 text-red-200 border border-red-800'
                                    : 'bg-gray-800 text-gray-100 border border-gray-700'
                            }`}
                        >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            
                            {/* Suggestion */}
                            {message.suggestion && (
                                <p className="text-xs text-gray-400 mt-2 italic">
                                    💡 {message.suggestion}
                                </p>
                            )}

                            {/* Action Buttons */}
                            {message.action && (
                                <div className="mt-3 space-y-2">
                                    {message.action === 'create_file' && (
                                        <>
                                            <button
                                                onClick={() => handleActionClick('create_file')}
                                                className="w-full flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 rounded transition"
                                            >
                                                <FileText size={14} />
                                                Create File
                                            </button>
                                        </>
                                    )}
                                    {message.action === 'create_project' && (
                                        <>
                                            <button
                                                onClick={() => handleActionClick('create_project')}
                                                className="w-full flex items-center gap-2 text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1.5 rounded transition"
                                            >
                                                <FolderPlus size={14} />
                                                Create Project
                                            </button>
                                        </>
                                    )}
                                    {message.action === 'update_file' && (
                                        <>
                                            <button
                                                onClick={() => handleActionClick('update_file')}
                                                className="w-full flex items-center gap-2 text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1.5 rounded transition"
                                            >
                                                <Code2 size={14} />
                                                Refactor Now
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Copy Button */}
                            {message.type === 'bot' && message.content.includes('```') && (
                                <button
                                    onClick={() => copyToClipboard(message.content, message.id)}
                                    className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-white transition"
                                >
                                    {copiedId === message.id ? (
                                        <>
                                            <Check size={12} />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={12} />
                                            Copy
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                            <Loader2 size={16} className="animate-spin" />
                        </div>
                        <div className="bg-gray-800 text-gray-100 rounded-lg px-3 py-2 border border-gray-700">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-800 p-4 space-y-3">
                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                        onClick={() => setInput('Create a ')}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 flex items-center gap-1 justify-center transition"
                    >
                        <FileText size={14} />
                        Create
                    </button>
                    <button
                        onClick={() => setInput('Refactor ')}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 flex items-center gap-1 justify-center transition"
                    >
                        <Code2 size={14} />
                        Refactor
                    </button>
                    <button
                        onClick={() => setInput('Explain ')}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 flex items-center gap-1 justify-center transition"
                    >
                        <MessageCircle size={14} />
                        Explain
                    </button>
                    <button
                        onClick={() => setInput('Debug ')}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 flex items-center gap-1 justify-center transition"
                    >
                        <Loader2 size={14} />
                        Debug
                    </button>
                </div>

                {/* Input field */}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask Copilot..."
                        className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className={`p-2 rounded transition ${
                            loading || !input.trim()
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                        {loading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </form>

                {/* Context info */}
                <div className="text-xs text-gray-500 text-center">
                    {selectedFile ? (
                        <p>📄 Editing: <span className="text-blue-400">{selectedFile.name}</span></p>
                    ) : (
                        <p>Open a file to get personalized suggestions</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CopilotChat;
