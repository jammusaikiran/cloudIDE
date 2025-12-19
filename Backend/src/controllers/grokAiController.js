// Groq Cloud AI Controller
// This controller handles AI code generation using Groq Cloud API
// Groq provides ultra-fast inference with models like Llama 3.1, Mixtral, and Gemma

import axios from 'axios';

/**
 * Generate AI response using Groq Cloud API
 * @route POST /api/ai/chat
 */
export const generateAIResponse = async (req, res) => {
    console.log('=== AI CHAT REQUEST START ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    try {
        const { message, fileContent, fileName, language } = req.body;

        console.log('Extracted data:', {
            message: message?.substring(0, 100),
            hasFileContent: !!fileContent,
            fileName,
            language
        });

        if (!message) {
            console.log('❌ Error: No message provided');
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        // Get Groq API key from environment
        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        console.log('Checking GROQ_API_KEY:', {
            exists: !!GROQ_API_KEY,
            length: GROQ_API_KEY?.length,
            starts_with: GROQ_API_KEY?.substring(0, 4)
        });

        if (!GROQ_API_KEY) {
            console.log("❌ ERROR: No GROQ_API_KEY found in environment!");
            console.log("Environment variables available:", Object.keys(process.env).filter(k => k.includes('GROQ')));
            return res.status(500).json({
                success: false,
                message: 'Groq API key not configured. Please add GROQ_API_KEY to your .env file'
            });
        }

        // Build context-aware system prompt
        let systemPrompt = `You are an expert AI coding assistant integrated into a Cloud IDE. You are highly intelligent and helpful.

Your capabilities include:
- Answering any programming questions (languages, frameworks, concepts, algorithms, best practices)
- Generating production-ready code in any programming language
- Explaining code and technical concepts clearly
- Debugging and fixing code issues
- Refactoring and optimizing existing code
- Creating entire file structures and complete projects
- Providing real-world examples and implementations

When answering questions:
- Be concise but thorough
- Provide code examples when relevant
- Explain complex concepts in simple terms
- Give practical, actionable advice

When generating code:
- Write clean, production-ready code with proper error handling
- Add helpful comments explaining key logic
- Follow language-specific best practices and conventions
- Make code maintainable and well-structured

You can handle ANY request - from simple questions to complex code generation. Be flexible and helpful.`;

        let userPrompt = message;

        // Add file context if available
        if (fileName && fileContent) {
            userPrompt += `\n\nCurrent file: ${fileName}\nContent:\n${fileContent}`;
        } else if (fileName) {
            userPrompt += `\n\nWorking with file: ${fileName}`;
        }

        if (language) {
            userPrompt += `\n\nTarget language: ${language}`;
        }

        console.log('📤 Calling Groq API...');
        console.log('API URL: https://api.groq.com/openai/v1/chat/completions');
        console.log('Model: llama-3.1-8b-instant');
        console.log('User prompt length:', userPrompt.length);

        // Call Groq Cloud API
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ],
                model: 'llama-3.1-8b-instant', // Fast and capable model
                temperature: 0.7,
                max_tokens: 8000,
                top_p: 1,
                stream: false
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                }
            }
        );

        console.log('✅ Groq API Response Status:', response.status);
        console.log('Response data structure:', {
            hasChoices: !!response.data?.choices,
            choicesLength: response.data?.choices?.length,
            hasMessage: !!response.data?.choices?.[0]?.message
        });

        const aiMessage = response.data.choices[0]?.message?.content;

        if (!aiMessage) {
            console.log('❌ Error: No AI message in response');
            console.log('Full response:', JSON.stringify(response.data, null, 2));
            return res.status(500).json({
                success: false,
                message: 'Failed to get response from Groq AI'
            });
        }

        console.log('✅ AI Response received, length:', aiMessage.length);
        console.log('Response preview:', aiMessage.substring(0, 100) + '...');

        console.log('=== AI CHAT REQUEST SUCCESS ===\n');
        return res.status(200).json({
            success: true,
            data: {
                response: aiMessage,
                type: 'text',
                model: 'llama-3.1-8b-instant'
            }
        });

    } catch (error) {
        console.log('\n❌ === AI CHAT REQUEST ERROR === ❌');
        console.error('Error type:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
            console.error('Response headers:', error.response.headers);
        } else if (error.request) {
            console.error('No response received from Groq API');
            console.error('Request:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
        console.log('=== END ERROR LOG ===\n');

        // Handle specific error cases
        if (error.response?.status === 401) {
            console.log('🔑 Authorization Error - Invalid API Key');
            return res.status(401).json({
                success: false,
                message: 'Invalid Groq API key. Please check your configuration.'
            });
        }

        if (error.response?.status === 429) {
            console.log('⏱️ Rate Limit Error');
            return res.status(429).json({
                success: false,
                message: 'Rate limit exceeded. Please try again later.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'An error occurred while processing your request',
            error: error.response?.data?.error?.message || error.message
        });
    }
};

/**
 * Generate code based on description
 * @route POST /api/ai/generate-code
 */
export const generateCode = async (req, res) => {
    try {
        const { description, language, fileName } = req.body;

        if (!description) {
            return res.status(400).json({
                success: false,
                message: 'Code description is required'
            });
        }

        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) {
            return res.status(500).json({
                success: false,
                message: 'Groq API key not configured'
            });
        }

        const systemPrompt = `You are a code generation expert. Generate clean, production-ready code based on the user's description. 
Include proper error handling, comments, and follow best practices for the specified language.
ONLY return the code, no explanations unless specifically asked. Do not wrap the code in markdown code blocks.`;

        let userPrompt = `Generate ${language || 'JavaScript'} code for: ${description}`;

        if (fileName) {
            userPrompt += `\n\nFile name: ${fileName}`;
        }

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                model: 'llama-3.1-8b-instant',
                temperature: 0.3, // Lower temperature for more focused code generation
                max_tokens: 8000,
                top_p: 1,
                stream: false
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                }
            }
        );

        const generatedCode = response.data.choices[0]?.message?.content;

        return res.status(200).json({
            success: true,
            data: {
                code: generatedCode,
                language: language || 'javascript',
                model: 'llama-3.1-8b-instant'
            }
        });

    } catch (error) {
        console.error('Code Generation Error:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate code',
            error: error.response?.data?.error?.message || error.message
        });
    }
};

/**
 * Explain code
 * @route POST /api/ai/explain
 */
export const explainCode = async (req, res) => {
    try {
        const { code, fileName, language } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Code to explain is required'
            });
        }

        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) {
            return res.status(500).json({
                success: false,
                message: 'Groq API key not configured'
            });
        }

        const systemPrompt = `You are a code explanation expert. Provide clear, detailed explanations of code, breaking down:
- What the code does
- How it works
- Key concepts used
- Potential improvements or issues
Be educational but concise.`;

        let userPrompt = `Explain this ${language || ''} code:\n\n${code}`;

        if (fileName) {
            userPrompt = `File: ${fileName}\n\n${userPrompt}`;
        }

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                model: 'llama-3.1-8b-instant',
                temperature: 0.5,
                max_tokens: 8000,
                top_p: 1,
                stream: false
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                }
            }
        );

        const explanation = response.data.choices[0]?.message?.content;

        return res.status(200).json({
            success: true,
            data: {
                explanation,
                model: 'llama-3.1-8b-instant'
            }
        });

    } catch (error) {
        console.error('Code Explanation Error:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to explain code',
            error: error.response?.data?.error?.message || error.message
        });
    }
};

/**
 * Refactor/optimize code
 * @route POST /api/ai/refactor
 */
export const refactorCode = async (req, res) => {
    try {
        const { code, fileName, language, improvementType } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Code to refactor is required'
            });
        }

        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) {
            return res.status(500).json({
                success: false,
                message: 'Groq API key not configured'
            });
        }

        const improvementFocus = improvementType || 'general';
        const systemPrompt = `You are a code refactoring expert. Refactor the provided code focusing on: ${improvementFocus}.
Provide the improved code with comments explaining the changes. Maintain functionality while improving quality.`;

        let userPrompt = `Refactor this ${language || ''} code (focus: ${improvementFocus}):\n\n${code}`;

        if (fileName) {
            userPrompt = `File: ${fileName}\n\n${userPrompt}`;
        }

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                model: 'llama-3.1-8b-instant',
                temperature: 0.4,
                max_tokens: 8000,
                top_p: 1,
                stream: false
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                }
            }
        );

        const refactoredCode = response.data.choices[0]?.message?.content;

        return res.status(200).json({
            success: true,
            data: {
                code: refactoredCode,
                improvementType: improvementFocus,
                model: 'llama-3.1-8b-instant'
            }
        });

    } catch (error) {
        console.error('Code Refactoring Error:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to refactor code',
            error: error.response?.data?.error?.message || error.message
        });
    }
};
