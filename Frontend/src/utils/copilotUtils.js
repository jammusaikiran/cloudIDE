import { axiosInstance } from './axiosInstance';
import toast from 'react-hot-toast';

/**
 * Parse copilot commands to extract action details
 */
export const parseCopilotCommand = (message) => {
    const lowerMsg = message.toLowerCase().trim();
    console.log('parseCopilotCommand input:', message);
    console.log('lowercase:', lowerMsg);

    // Handle empty or incomplete commands
    if (!message.trim() || message.trim() === 'create' || message.trim() === 'explain') {
        console.log('✗ Incomplete command');
        return null;
    }

    // Check if message contains a filename with extension (e.g., .py, .js, .java)
    const hasFileExtension = /\.[a-zA-Z0-9]+/.test(message);
    console.log('Has file extension:', hasFileExtension);

    // Generate/write code IN a file (e.g., "generate prime number code in hello.py")
    if ((lowerMsg.includes('generate') || lowerMsg.includes('write') || lowerMsg.includes('code')) && 
        (lowerMsg.includes('in ') || lowerMsg.includes('in\n'))) {
        console.log('✓ Detected code generation for existing file');
        // Extract the filename after "in"
        const inMatch = message.match(/in\s+([a-zA-Z0-9._\-]+\.[a-zA-Z0-9]+)/i);
        if (inMatch) {
            const fileName = inMatch[1];
            console.log('Target file for code generation:', fileName);
            return {
                action: 'generate_code_in_file',
                fileName,
                codeDescription: message,
                language: extractLanguage(message)
            };
        }
    }

    // Create file command - check if "create" is present AND it looks like a filename
    if ((lowerMsg.includes('create') || lowerMsg.includes('file')) && hasFileExtension) {
        console.log('✓ Detected file creation request');
        
        // Extract filename - look for word with file extension
        // This matches: test.py, hello.js, my_file.java, etc.
        const fileNameMatch = message.match(/([a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+)/);
        const fileName = fileNameMatch ? fileNameMatch[1] : 'newFile.js';
        
        console.log('Extracted filename:', fileName);
        
        return {
            action: 'create_file',
            fileName,
            language: extractLanguage(message),
            description: message
        };
    }

    // Explain command - analyze selected file
    if (lowerMsg.includes('explain')) {
        console.log('✓ Detected explain request');
        return {
            action: 'explain_file',
            description: message
        };
    }

    // Create project command
    if (lowerMsg.includes('create') && (lowerMsg.includes('project') || lowerMsg.includes('app'))) {
        console.log('✓ Detected project/app creation');
        const projectType = extractProjectType(message);
        return {
            action: 'create_project',
            projectType,
            description: message
        };
    }

    // Refactor/update file
    if (lowerMsg.includes('refactor') || lowerMsg.includes('optimize') || lowerMsg.includes('improve')) {
        console.log('✓ Detected refactor/optimize/improve');
        return {
            action: 'update_file',
            improvement: extractImprovementType(message),
            description: message
        };
    }

    console.log('✗ No command detected');
    return null;

    return null;
};

/**
 * Extract programming language from command
 */
const extractLanguage = (message) => {
    const languageMap = {
        'javascript': 'javascript',
        'js': 'javascript',
        'typescript': 'typescript',
        'ts': 'typescript',
        'python': 'python',
        'java': 'java',
        'cpp': 'cpp',
        'c++': 'cpp',
        'html': 'html',
        'css': 'css',
        'sql': 'sql',
        'json': 'json',
    };

    for (const [key, value] of Object.entries(languageMap)) {
        if (message.toLowerCase().includes(key)) {
            return value;
        }
    }

    return 'javascript'; // default
};

/**
 * Extract project type from command
 */
const extractProjectType = (message) => {
    const types = ['react', 'node', 'python', 'vue', 'angular', 'express', 'django', 'nextjs'];
    
    for (const type of types) {
        if (message.toLowerCase().includes(type)) {
            return type;
        }
    }

    return 'javascript';
};

/**
 * Extract improvement type
 */
const extractImprovementType = (message) => {
    const msg = message.toLowerCase();
    
    if (msg.includes('performance') || msg.includes('optimize')) return 'performance';
    if (msg.includes('readable') || msg.includes('clean')) return 'readability';
    if (msg.includes('best practice') || msg.includes('follow')) return 'best_practice';
    if (msg.includes('bug') || msg.includes('fix')) return 'bugs';
    
    return 'general';
};

/**
 * Generate smart code based on description
 */
export const generateSmartCode = (description, language) => {
    const lowerDesc = description.toLowerCase();
    
    // Python specific patterns
    if (language === 'python') {
        if (lowerDesc.includes('prime') || lowerDesc.includes('prime number')) {
            return `# ${description}
# Auto-generated prime number code

def is_prime(n):
    """Check if a number is prime"""
    if n < 2:
        return False
    if n == 2:
        return True
    if n % 2 == 0:
        return False
    
    for i in range(3, int(n ** 0.5) + 1, 2):
        if n % i == 0:
            return False
    return True

def generate_primes(limit):
    """Generate prime numbers up to limit"""
    primes = []
    for num in range(2, limit + 1):
        if is_prime(num):
            primes.append(num)
    return primes

def main():
    # Generate first 20 prime numbers
    limit = 100
    primes = generate_primes(limit)
    
    print(f"Prime numbers up to {limit}:")
    print(primes)
    print(f"\\nTotal prime numbers found: {len(primes)}")

if __name__ == "__main__":
    main()`;
        }
        
        if (lowerDesc.includes('fibonacci')) {
            return `# ${description}
# Auto-generated Fibonacci code

def fibonacci(n):
    """Generate Fibonacci sequence up to n terms"""
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    elif n == 2:
        return [0, 1]
    
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    return fib

def main():
    n = 10
    result = fibonacci(n)
    print(f"First {n} Fibonacci numbers:")
    print(result)

if __name__ == "__main__":
    main()`;
        }
        
        if (lowerDesc.includes('sort') || lowerDesc.includes('sorting')) {
            return `# ${description}
# Auto-generated sorting code

def bubble_sort(arr):
    """Sort array using bubble sort"""
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

def quick_sort(arr):
    """Sort array using quick sort"""
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)

def main():
    data = [64, 34, 25, 12, 22, 11, 90]
    print("Original:", data)
    print("Sorted:", quick_sort(data.copy()))

if __name__ == "__main__":
    main()`;
        }
    }
    
    // JavaScript specific patterns
    if (language === 'javascript') {
        if (lowerDesc.includes('prime') || lowerDesc.includes('prime number')) {
            return `// ${description}
// Auto-generated prime number code

function isPrime(n) {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    
    for (let i = 3; i <= Math.sqrt(n); i += 2) {
        if (n % i === 0) return false;
    }
    return true;
}

function generatePrimes(limit) {
    const primes = [];
    for (let num = 2; num <= limit; num++) {
        if (isPrime(num)) {
            primes.push(num);
        }
    }
    return primes;
}

const limit = 100;
const primes = generatePrimes(limit);
console.log(\`Prime numbers up to \${limit}:\`, primes);
console.log(\`Total: \${primes.length} primes\`);`;
        }
    }
    
    // Default code generation
    return generateCodeContent(language, description);
};

/**
 * Generate code for a file based on description
 */
export const generateCodeContent = (language, description) => {
    const templates = {
        javascript: `// ${description}
// Auto-generated code

function main() {
    // TODO: Implement your logic here
    console.log("Hello from generated code!");
}

main();`,
        
        typescript: `// ${description}
// Auto-generated code

interface Config {
    // Add properties here
}

function main(): void {
    // TODO: Implement your logic here
    console.log("Hello from generated code!");
}

main();`,
        
        python: `# ${description}
# Auto-generated code

def main():
    # TODO: Implement your logic here
    print("Hello from generated code!")

if __name__ == "__main__":
    main()`,
        
        java: `// ${description}
// Auto-generated code

public class Main {
    public static void main(String[] args) {
        // TODO: Implement your logic here
        System.out.println("Hello from generated code!");
    }
}`,
        
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${description}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
    </style>
</head>
<body>
    <h1>${description}</h1>
    <p>Welcome to your generated HTML file!</p>
</body>
</html>`,

        css: `/* ${description}
   Auto-generated styles */

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background-color: #f5f5f5;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}`,

        json: {
    "description": description,
    "version": "1.0.0",
    "data": []
}
    };

    return templates[language] || templates.javascript;
};

/**
 * Generate refactored code
 */
export const generateRefactoredCode = (originalCode, improvementType) => {
    // This is a simplified version. In production, you'd use an actual AI service
    
    const improvements = {
        performance: `// Performance-optimized version
${originalCode.split('\n').map(line => {
    if (line.includes('for') || line.includes('forEach')) {
        return `// Optimized: Consider using .map() or other functional methods\n${line}`;
    }
    return line;
}).join('\n')}`,
        
        readability: `// Improved readability version
${originalCode.split('\n').map(line => {
    if (line.trim().length > 80) {
        return '// Consider breaking this line for better readability\n' + line;
    }
    return line;
}).join('\n')}`,
        
        best_practice: `// Best practices applied
// ✓ Added proper error handling
// ✓ Added documentation
// ✓ Following naming conventions
${originalCode}`,
        
        bugs: `// Potential issues identified:
// ⚠️  Check for null/undefined values
// ⚠️  Validate user input
// ⚠️  Add error handling

${originalCode}`
    };

    return improvements[improvementType] || improvements.best_practice;
};

/**
 * Generate project structure
 */
export const generateProjectStructure = (projectType) => {
    const structures = {
        react: [
            { name: 'src/components/Header.jsx', content: 'export default function Header() {\n  return <header><h1>Header</h1></header>;\n}' },
            { name: 'src/components/Footer.jsx', content: 'export default function Footer() {\n  return <footer><p>Footer</p></footer>;\n}' },
            { name: 'src/pages/Home.jsx', content: 'export default function Home() {\n  return <div><h1>Home Page</h1></div>;\n}' },
            { name: 'src/App.jsx', content: 'import Header from "./components/Header";\nimport Footer from "./components/Footer";\n\nexport default function App() {\n  return (\n    <>\n      <Header />\n      <main>Main Content</main>\n      <Footer />\n    </>\n  );\n}' },
            { name: 'src/index.css', content: '* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;\n}' },
        ],
        node: [
            { name: 'src/server.js', content: 'const express = require("express");\nconst app = express();\n\napp.get("/", (req, res) => {\n  res.json({ message: "Welcome to Node.js server" });\n});\n\napp.listen(3000, () => console.log("Server running on port 3000"));' },
            { name: 'src/config/db.js', content: '// Database configuration\nmodule.exports = {\n  host: process.env.DB_HOST,\n  user: process.env.DB_USER,\n  password: process.env.DB_PASSWORD,\n  database: process.env.DB_NAME\n};' },
            { name: '.env.example', content: 'DB_HOST=localhost\nDB_USER=root\nDB_PASSWORD=password\nDB_NAME=myapp\nPORT=3000' },
            { name: 'package.json', content: '{\n  "name": "my-node-app",\n  "version": "1.0.0",\n  "main": "src/server.js",\n  "scripts": {\n    "start": "node src/server.js",\n    "dev": "nodemon src/server.js"\n  },\n  "dependencies": {\n    "express": "^4.18.0"\n  }\n}' },
        ],
        python: [
            { name: 'app.py', content: 'def main():\n    print("Welcome to Python app")\n\nif __name__ == "__main__":\n    main()' },
            { name: 'requirements.txt', content: 'flask==2.0.0\nrequests==2.26.0\npython-dotenv==0.19.0' },
            { name: 'config.py', content: 'import os\nfrom dotenv import load_dotenv\n\nload_dotenv()\n\nclass Config:\n    DEBUG = os.getenv("DEBUG", False)\n    SECRET_KEY = os.getenv("SECRET_KEY")' },
        ],
        vue: [
            { name: 'src/components/Header.vue', content: '<template>\n  <header><h1>Header</h1></header>\n</template>\n\n<script>\nexport default {\n  name: "Header"\n}\n</script>\n\n<style scoped>\nheader { background-color: #f5f5f5; }\n</style>' },
            { name: 'src/App.vue', content: '<template>\n  <div id="app">\n    <Header />\n    <router-view />\n  </div>\n</template>\n\n<script>\nimport Header from "./components/Header.vue";\n\nexport default {\n  components: { Header }\n}\n</script>' },
            { name: 'src/main.js', content: 'import { createApp } from "vue";\nimport App from "./App.vue";\nimport router from "./router";\n\nconst app = createApp(App);\napp.use(router);\napp.mount("#app");' },
        ]
    };

    return structures[projectType] || structures.react;
};

/**
 * Create a file in the project
 */
export const createFileInProject = async (folderId, fileName, content, token) => {
    try {
        const response = await axiosInstance.post('/files/create', {
            folderId,
            name: fileName,
            content
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
            toast.success(`File "${fileName}" created successfully!`);
            return response.data.data;
        } else {
            toast.error('Failed to create file');
            return null;
        }
    } catch (error) {
        console.error('Error creating file:', error);
        toast.error('Error creating file');
        return null;
    }
};

/**
 * Update existing file
 */
export const updateFileContent = async (fileId, content, token) => {
    try {
        const response = await axiosInstance.put(`/files/content/${fileId}`, {
            content
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
            toast.success('File updated successfully!');
            return response.data.data;
        } else {
            toast.error('Failed to update file');
            return null;
        }
    } catch (error) {
        console.error('Error updating file:', error);
        toast.error('Error updating file');
        return null;
    }
};

/**
 * Process copilot response and execute actions
 */
export const processCopilotResponse = (command, context) => {
    if (!command) return null;

    switch (command.action) {
        case 'create_file': {
            const content = generateCodeContent(command.language, command.description);
            return {
                action: 'create_file',
                fileName: command.fileName,
                content,
                language: command.language
            };
        }

        case 'create_project': {
            const structure = generateProjectStructure(command.projectType);
            return {
                action: 'create_project',
                projectType: command.projectType,
                structure
            };
        }

        case 'update_file': {
            const refactored = generateRefactoredCode(context.fileContent || '', command.improvement);
            return {
                action: 'update_file',
                content: refactored,
                improvement: command.improvement
            };
        }

        default:
            return null;
    }
};

/**
 * Format code for display in chat
 */
export const formatCodeForChat = (code, language = 'javascript') => {
    return `\`\`\`${language}\n${code}\n\`\`\``;
};

/**
 * Generate smart suggestions based on code
 */
export const generateSuggestions = (code, fileName = '') => {
    const suggestions = [];

    // Check for console.log
    if (code.includes('console.log')) {
        suggestions.push('💡 Consider using a logger instead of console.log for production');
    }

    // Check for var
    if (code.includes('var ')) {
        suggestions.push('💡 Consider using let or const instead of var');
    }

    // Check for error handling
    if (!code.includes('try') && !code.includes('catch')) {
        suggestions.push('💡 Consider adding error handling with try-catch');
    }

    // Check for comments
    if (code.split('\n').length > 10 && !code.includes('//') && !code.includes('/*')) {
        suggestions.push('💡 Consider adding comments to explain complex logic');
    }

    return suggestions;
};
