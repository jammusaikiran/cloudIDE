# 🎯 How to Use Code Generation Commands

## ✅ **Working Commands**

### 1. **Generate Code in a File** ✨
These commands will:
- AIgenerate code using Groq
- Create the file automatically
- Fill it with the generated code

**Examples:**
```
Generate fibonacci logic in fibo.py
Generate sorting code in utils.js
Write prime number function in prime.py
Create calculator logic in calc.js
```

**What happens:**
1. ✅ Detects `generate_code_in_file` action
2. ✅ Calls Groq API to generate code
3. ✅ Creates `fibo.py` (or specified filename)
4. ✅ Writes AI-generated code to the file

---

### 2. **Create Empty File** 📄
These create an empty file:
```
Create test.py
Create utils.js
Create index.html
```

---

### 3. **Explain Concepts** 💬
Ask general questions (no file needed):
```
Explain React
What is Python?
Tell me about async/await
```

---

### 4. **Explain Code** 📖
Explain the open file:
```
Explain this code
Explain this file
Explain the code
```

---

### 5. **Refactor Code** 🔧
Improve the open file:
```
Refactor for performance
Optimize this code
Improve code readability
```

---

## 🧪 **Testing "Generate Fibonacci in fibo.py"**

### **Expected Flow:**

1. **You type:** `Generate fibonacci logic in fibo.py`

2. **Parser detects:**
   ```javascript
   {
     action: 'generate_code_in_file',
     fileName: 'fibo.py',
     codeDescription: 'Generate fibonacci logic in fibo.py',
     language: 'python'
   }
   ```

3. **Frontend calls:**
   ```
   POST /api/ai/generate-code
   {
     description: "Generate fibonacci logic in fibo.py",
     language: "python",
     fileName: "fibo.py"
   }
   ```

4. **Groq generates:** Fibonacci code

5. **Frontend creates file:** `fibo.py` with the generated code

6. **You see:** 
   - ✨ "Generating code for..." message
   - ✅ "Code successfully generated and written to fibo.py!"
   - File appears in file explorer

---

## ⚠️ **If It's Not Working**

### **Check 1: Is Groq API Key configured?**
```bash
# Check Backend/.env
GROQ_API_KEY=gsk_your-key-here
```

### **Check 2: Is backend running?**
```bash
cd Backend
npm start
```

### **Check 3: Are you logged in?**
- You must be logged into the Cloud IDE
- AI features require authentication

### **Check 4: Is folderId set?**
- You must have a project/folder open
- The file will be created in the current folder

---

## 🔍 **Debugging**

### **Open Browser Console (F12)**
Look for:
```
✓ Detected code generation for existing file
Target file for code generation: fibo.py
Code generation request detected for file: fibo.py
Generated code from Groq: <code preview>
```

If you see these logs, the command is being parsed correctly.

### **Check Network Tab**
Should see:
1. `POST /api/ai/generate-code` - Gets code from Groq
2. `POST /api/files/upload-file` - Creates the file

---

## ✨ **Complete Example**

**Command:**
```
Generate a quicksort algorithm in sort.py
```

**What you should see:**
1. Message: "✨ Generating code for: Generate a quicksort algorithm in sort.py"
2. Message: "Writing to: sort.py..."
3. API call to Groq (check Network tab)
4. Message: "✅ Code successfully generated and written to 'sort.py'!"
5. Code preview shown
6. File `sort.py` appears in file explorer

**File contents (`sort.py`):**
```python
# AI-generated quicksort code
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

# Test
if __name__ == "__main__":
    test_array = [3, 6, 8, 10, 1, 2, 1]
    print(quicksort(test_array))
```

---

## 🎯 **Quick Reference**

| Command Pattern | Result |
|----------------|--------|
| `Generate [description] in [file.ext]` | Creates file with AI code |
| `Write [description] in [file.ext]` | Creates file with AI code |
| `Create [file.ext]` | Creates empty file |
| `Explain [concept]` | AI explains concept |
| `Explain this code` | AI explains open file |
| `Refactor for [goal]` | AI optimizes open file |

---

## ✅ **Prerequisites**

- ✅ Groq API key in `Backend/.env`
- ✅ Backend server running
- ✅ Frontend running
- ✅ Logged into Cloud IDE
- ✅ Project/folder open (for file creation)

---

**Everything is configured correctly!** 🚀

Just make sure you:
1. Have `GROQ_API_KEY` in `.env`
2. Restarted backend after adding the key
3. Are logged in and have a folder open

Then try: **`Generate fibonacci logic in fibo.py`**

It should create the file with AI-generated code! ✨
