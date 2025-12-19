import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Code2, FolderPlus, FileText, MessageCircle, X, Copy, Check } from 'lucide-react';
import { axiosInstance } from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { parseCopilotCommand } from '../utils/copilotUtils';

const CopilotChat = ({ onCreateFile, onUpdateFile, onCreateProject, selectedFile, fileContent, folderId, onRefresh }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            content: "👋 Hello! I'm your AI Copilot powered by Groq's Llama 3.1.\n\n💬 **Ask me anything:**\n• Programming concepts and languages\n• Code explanations and best practices\n• Algorithm implementations\n• Debugging help\n\n✨ **Code Generation:**\n• \"Create a prime number finder in Python\"\n• \"Generate a REST API in Node.js\"\n• \"Write a sorting algorithm in Java\"\n\n📄 **File Operations:**\n• \"Create a utils.js file\"\n• \"Generate code in hello.py\"\n\nI'm here to help with any coding task. What would you like to build today?",
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

    // Generate AI response using Groq API backend
    const generateAIResponse = async (userMessage) => {
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                toast.error('Authentication required');
                return {
                    type: 'text',
                    content: 'Please log in to use the AI assistant.',
                    isError: true
                };
            }

            // Build context for AI
            let contextData = {
                message: userMessage,
                fileName: selectedFile?.name || null,
                fileContent: (selectedFile && fileContent) ? fileContent : null,
                language: selectedFile?.name ? selectedFile.name.split('.').pop() : null
            };

            console.log('Sending request to Groq AI:', contextData);

            const response = await axiosInstance.post('/ai/chat', contextData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log('Groq AI response:', response.data);

            if (response.data.success) {
                return {
                    type: 'text',
                    content: response.data.data.response,
                    model: response.data.data.model
                };
            } else {
                return {
                    type: 'text',
                    content: 'Sorry, I encountered an error. Please try again.',
                    isError: true
                };
            }

        } catch (error) {
            console.error('AI Response Error:', error);

            // Handle specific error cases
            if (error.response?.status === 401) {
                return {
                    type: 'text',
                    content: 'Authentication failed. Please log in again.',
                    isError: true
                };
            }

            if (error.response?.status === 429) {
                return {
                    type: 'text',
                    content: 'Rate limit exceeded. Please wait a moment and try again.',
                    isError: true
                };
            }

            return {
                type: 'text',
                content: error.response?.data?.message || 'Sorry, I encountered an error. Please try again.',
                isError: true
            };
        }
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

    // Generate code using Groq AI API
    const generateCodeUsingAI = async (description, language, fileName) => {
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                toast.error('Authentication required');
                return null;
            }

            console.log('Generating code with Groq AI:', { description, language, fileName });

            const response = await axiosInstance.post('/ai/generate-code', {
                description,
                language,
                fileName
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log('Code generation response:', response.data);

            if (response.data.success) {
                return response.data.data.code;
            } else {
                toast.error('Failed to generate code');
                return null;
            }

        } catch (error) {
            console.error('Code generation error:', error);
            toast.error(error.response?.data?.message || 'Error generating code');
            return null;
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

                // Show initial message
                const initialMessage = {
                    id: messages.length + 2,
                    type: 'bot',
                    content: `✨ Generating code with AI for: ${command.codeDescription}\n\nTarget file: ${command.fileName}...`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, initialMessage]);

                // Generate the code using Groq AI
                setIsProcessing(true);
                const generatedCode = await generateCodeUsingAI(
                    command.codeDescription,
                    command.language || 'javascript',
                    command.fileName
                );

                if (generatedCode) {
                    console.log('Generated code length:', generatedCode.length);

                    // Update the file with generated code
                    const success = await updateFileWithCode(command.fileName, generatedCode);
                    setIsProcessing(false);

                    // Show result message
                    const resultMessage = {
                        id: messages.length + 3,
                        type: 'bot',
                        content: success
                            ? `✅ Code successfully generated and written to "${command.fileName}"!\n\nPreview:\n\`\`\`${command.language || 'javascript'}\n${generatedCode.substring(0, 300)}${generatedCode.length > 300 ? '...' : ''}\n\`\`\`\n\nOpen the file to see the complete code.`
                            : `❌ Failed to write code to "${command.fileName}". Please try again.`,
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, resultMessage]);
                } else {
                    setIsProcessing(false);
                    const errorMessage = {
                        id: messages.length + 3,
                        type: 'bot',
                        content: `❌ Failed to generate code. Please try again with a different description.`,
                        isError: true,
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, errorMessage]);
                }
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
                            className={`max-w-xs rounded-lg px-3 py-2 ${message.type === 'user'
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
                        className={`p-2 rounded transition ${loading || !input.trim()
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
