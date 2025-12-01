import * as monaco from "monaco-editor";

// JavaScript/TypeScript completions
export const jsCompletions = [
  // Common methods
  { label: "console.log", insertText: "console.log(${1:})", documentation: "Logs a message to the console" },
  { label: "console.error", insertText: "console.error(${1:})", documentation: "Logs an error message to the console" },
  { label: "console.warn", insertText: "console.warn(${1:})", documentation: "Logs a warning message to the console" },
  { label: "console.table", insertText: "console.table(${1:})", documentation: "Logs data as a table" },
  
  // Array methods
  { label: "map", insertText: "map((${1:item}) => ${2:})", documentation: "Transforms each element in an array" },
  { label: "filter", insertText: "filter((${1:item}) => ${2:})", documentation: "Filters array elements based on condition" },
  { label: "reduce", insertText: "reduce((${1:acc}, ${2:item}) => ${3:})", documentation: "Reduces array to single value" },
  { label: "forEach", insertText: "forEach((${1:item}) => ${2:})", documentation: "Iterates over array elements" },
  { label: "find", insertText: "find((${1:item}) => ${2:})", documentation: "Returns first matching element" },
  { label: "sort", insertText: "sort((${1:a}, ${2:b}) => ${3:})", documentation: "Sorts array elements" },
  { label: "slice", insertText: "slice(${1:start}, ${2:end})", documentation: "Returns shallow copy of array portion" },
  { label: "splice", insertText: "splice(${1:start}, ${2:deleteCount})", documentation: "Changes array contents" },
  { label: "push", insertText: "push(${1:})", documentation: "Adds element to end of array" },
  { label: "pop", insertText: "pop()", documentation: "Removes last element from array" },
  { label: "shift", insertText: "shift()", documentation: "Removes first element from array" },
  { label: "unshift", insertText: "unshift(${1:})", documentation: "Adds element to beginning of array" },
  { label: "includes", insertText: "includes(${1:searchElement})", documentation: "Checks if array includes value" },
  { label: "indexOf", insertText: "indexOf(${1:searchElement})", documentation: "Returns index of element" },
  { label: "join", insertText: "join(${1:separator})", documentation: "Joins array elements into string" },
  
  // String methods
  { label: "split", insertText: "split(${1:separator})", documentation: "Splits string into array" },
  { label: "replace", insertText: "replace(${1:searchValue}, ${2:replaceValue})", documentation: "Replaces text in string" },
  { label: "trim", insertText: "trim()", documentation: "Removes whitespace from both ends" },
  { label: "toUpperCase", insertText: "toUpperCase()", documentation: "Converts string to uppercase" },
  { label: "toLowerCase", insertText: "toLowerCase()", documentation: "Converts string to lowercase" },
  { label: "substring", insertText: "substring(${1:start}, ${2:end})", documentation: "Returns substring" },
  { label: "charAt", insertText: "charAt(${1:index})", documentation: "Returns character at index" },
  { label: "includes", insertText: "includes(${1:searchString})", documentation: "Checks if string includes value" },
  { label: "startsWith", insertText: "startsWith(${1:searchString})", documentation: "Checks if string starts with value" },
  { label: "endsWith", insertText: "endsWith(${1:searchString})", documentation: "Checks if string ends with value" },
  
  // Common patterns
  { label: "const", insertText: "const ${1:name} = ${2:value};", documentation: "Declare constant variable" },
  { label: "let", insertText: "let ${1:name} = ${2:value};", documentation: "Declare block-scoped variable" },
  { label: "var", insertText: "var ${1:name} = ${2:value};", documentation: "Declare function-scoped variable" },
  { label: "if", insertText: "if (${1:condition}) {\n\t${2:}\n}", documentation: "If statement" },
  { label: "else", insertText: "else {\n\t${1:}\n}", documentation: "Else clause" },
  { label: "for", insertText: "for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t${3:}\n}", documentation: "For loop" },
  { label: "while", insertText: "while (${1:condition}) {\n\t${2:}\n}", documentation: "While loop" },
  { label: "try", insertText: "try {\n\t${1:}\n} catch (${2:error}) {\n\t${3:}\n}", documentation: "Try-catch block" },
  { label: "function", insertText: "function ${1:name}(${2:params}) {\n\t${3:}\n}", documentation: "Function declaration" },
  { label: "=>", insertText: "(${1:params}) => ${2:}", documentation: "Arrow function" },
  { label: "async", insertText: "async function ${1:name}(${2:params}) {\n\t${3:}\n}", documentation: "Async function" },
  { label: "await", insertText: "await ${1:promise}", documentation: "Await expression" },
  { label: "class", insertText: "class ${1:Name} {\n\tconstructor(${2:params}) {\n\t\t${3:}\n\t}\n}", documentation: "Class declaration" },
];

// Python completions
export const pythonCompletions = [
  // Print and I/O
  { label: "print", insertText: "print(${1:})", documentation: "Prints output to console" },
  { label: "input", insertText: "input(${1:prompt})", documentation: "Gets user input" },
  
  // List methods
  { label: "append", insertText: "append(${1:item})", documentation: "Adds element to end of list" },
  { label: "extend", insertText: "extend(${1:iterable})", documentation: "Extends list with elements" },
  { label: "insert", insertText: "insert(${1:index}, ${2:item})", documentation: "Inserts element at index" },
  { label: "remove", insertText: "remove(${1:item})", documentation: "Removes first matching element" },
  { label: "pop", insertText: "pop(${1:index})", documentation: "Removes and returns element" },
  { label: "clear", insertText: "clear()", documentation: "Removes all elements" },
  { label: "index", insertText: "index(${1:item})", documentation: "Returns index of element" },
  { label: "count", insertText: "count(${1:item})", documentation: "Counts occurrences" },
  { label: "sort", insertText: "sort()", documentation: "Sorts list in place" },
  { label: "reverse", insertText: "reverse()", documentation: "Reverses list in place" },
  
  // String methods
  { label: "split", insertText: "split(${1:separator})", documentation: "Splits string into list" },
  { label: "join", insertText: "join(${1:iterable})", documentation: "Joins iterable into string" },
  { label: "strip", insertText: "strip()", documentation: "Removes whitespace" },
  { label: "replace", insertText: "replace(${1:old}, ${2:new})", documentation: "Replaces text" },
  { label: "upper", insertText: "upper()", documentation: "Converts to uppercase" },
  { label: "lower", insertText: "lower()", documentation: "Converts to lowercase" },
  
  // Control flow
  { label: "if", insertText: "if ${1:condition}:\n\t${2:pass}", documentation: "If statement" },
  { label: "elif", insertText: "elif ${1:condition}:\n\t${2:pass}", documentation: "Else if statement" },
  { label: "else", insertText: "else:\n\t${1:pass}", documentation: "Else clause" },
  { label: "for", insertText: "for ${1:item} in ${2:iterable}:\n\t${3:pass}", documentation: "For loop" },
  { label: "while", insertText: "while ${1:condition}:\n\t${2:pass}", documentation: "While loop" },
  { label: "def", insertText: "def ${1:name}(${2:params}):\n\t${3:pass}", documentation: "Function definition" },
  { label: "class", insertText: "class ${1:Name}:\n\tdef __init__(self):\n\t\t${2:pass}", documentation: "Class definition" },
  { label: "import", insertText: "import ${1:module}", documentation: "Import module" },
  { label: "from", insertText: "from ${1:module} import ${2:name}", documentation: "Import from module" },
  { label: "try", insertText: "try:\n\t${1:pass}\nexcept ${2:Exception}:\n\t${3:pass}", documentation: "Try-except block" },
  { label: "with", insertText: "with ${1:expression} as ${2:variable}:\n\t${3:pass}", documentation: "Context manager" },
  { label: "lambda", insertText: "lambda ${1:x}: ${2:x}", documentation: "Anonymous function" },
  { label: "return", insertText: "return ${1:value}", documentation: "Return statement" },
  { label: "yield", insertText: "yield ${1:value}", documentation: "Yield statement" },
  { label: "break", insertText: "break", documentation: "Break loop" },
  { label: "continue", insertText: "continue", documentation: "Continue loop" },
  
  // Common functions
  { label: "len", insertText: "len(${1:})", documentation: "Returns length of object" },
  { label: "range", insertText: "range(${1:start}, ${2:stop})", documentation: "Creates range of numbers" },
  { label: "enumerate", insertText: "enumerate(${1:iterable})", documentation: "Returns index and value pairs" },
  { label: "zip", insertText: "zip(${1:})", documentation: "Zips iterables together" },
  { label: "map", insertText: "map(${1:function}, ${2:iterable})", documentation: "Maps function over iterable" },
  { label: "filter", insertText: "filter(${1:function}, ${2:iterable})", documentation: "Filters iterable" },
  { label: "sum", insertText: "sum(${1:iterable})", documentation: "Sums iterable" },
  { label: "min", insertText: "min(${1:})", documentation: "Returns minimum value" },
  { label: "max", insertText: "max(${1:})", documentation: "Returns maximum value" },
  { label: "sorted", insertText: "sorted(${1:iterable})", documentation: "Returns sorted list" },
  { label: "isinstance", insertText: "isinstance(${1:object}, ${2:type})", documentation: "Checks instance type" },
  { label: "type", insertText: "type(${1:object})", documentation: "Returns object type" },
  { label: "str", insertText: "str(${1:object})", documentation: "Converts to string" },
  { label: "int", insertText: "int(${1:object})", documentation: "Converts to integer" },
  { label: "float", insertText: "float(${1:object})", documentation: "Converts to float" },
  { label: "list", insertText: "list(${1:iterable})", documentation: "Converts to list" },
  { label: "dict", insertText: "dict(${1:})", documentation: "Creates dictionary" },
  { label: "set", insertText: "set(${1:iterable})", documentation: "Creates set" },
];

// Java completions
export const javaCompletions = [
  { label: "System.out.println", insertText: "System.out.println(${1:});", documentation: "Prints line to console" },
  { label: "System.out.print", insertText: "System.out.print(${1:});", documentation: "Prints to console" },
  { label: "public", insertText: "public", documentation: "Public access modifier" },
  { label: "private", insertText: "private", documentation: "Private access modifier" },
  { label: "static", insertText: "static", documentation: "Static modifier" },
  { label: "final", insertText: "final", documentation: "Final modifier" },
  { label: "class", insertText: "class ${1:Name} {\n\t${2:}\n}", documentation: "Class declaration" },
  { label: "public static void main", insertText: "public static void main(String[] args) {\n\t${1:}\n}", documentation: "Main method" },
  { label: "for", insertText: "for (int ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t${3:}\n}", documentation: "For loop" },
  { label: "while", insertText: "while (${1:condition}) {\n\t${2:}\n}", documentation: "While loop" },
  { label: "if", insertText: "if (${1:condition}) {\n\t${2:}\n}", documentation: "If statement" },
  { label: "else", insertText: "else {\n\t${1:}\n}", documentation: "Else clause" },
  { label: "try", insertText: "try {\n\t${1:}\n} catch (${2:Exception} e) {\n\t${3:}\n}", documentation: "Try-catch block" },
  { label: "new", insertText: "new ${1:ClassName}(${2:});", documentation: "Creates new object instance" },
];

// SQL completions
export const sqlCompletions = [
  { label: "SELECT", insertText: "SELECT ${1:*} FROM ${2:table}", documentation: "Select statement" },
  { label: "INSERT INTO", insertText: "INSERT INTO ${1:table} (${2:columns}) VALUES (${3:values})", documentation: "Insert statement" },
  { label: "UPDATE", insertText: "UPDATE ${1:table} SET ${2:column} = ${3:value} WHERE ${4:condition}", documentation: "Update statement" },
  { label: "DELETE", insertText: "DELETE FROM ${1:table} WHERE ${2:condition}", documentation: "Delete statement" },
  { label: "CREATE TABLE", insertText: "CREATE TABLE ${1:table} (${2:columns})", documentation: "Create table" },
  { label: "ALTER TABLE", insertText: "ALTER TABLE ${1:table} ADD ${2:column}", documentation: "Alter table" },
  { label: "DROP TABLE", insertText: "DROP TABLE ${1:table}", documentation: "Drop table" },
  { label: "WHERE", insertText: "WHERE ${1:condition}", documentation: "Where clause" },
  { label: "JOIN", insertText: "JOIN ${1:table} ON ${2:condition}", documentation: "Join tables" },
  { label: "GROUP BY", insertText: "GROUP BY ${1:column}", documentation: "Group by clause" },
  { label: "ORDER BY", insertText: "ORDER BY ${1:column}", documentation: "Order by clause" },
];

// HTML completions
export const htmlCompletions = [
  { label: "html", insertText: "<html>\\n\\t${1:}\\n</html>", documentation: "HTML root element" },
  { label: "head", insertText: "<head>\\n\\t${1:}\\n</head>", documentation: "HTML head element" },
  { label: "body", insertText: "<body>\\n\\t${1:}\\n</body>", documentation: "HTML body element" },
  { label: "div", insertText: "<div>\\n\\t${1:}\\n</div>", documentation: "Div container element" },
  { label: "p", insertText: "<p>${1:}</p>", documentation: "Paragraph element" },
  { label: "h1", insertText: "<h1>${1:}</h1>", documentation: "Heading 1 element" },
  { label: "button", insertText: "<button>${1:}</button>", documentation: "Button element" },
  { label: "input", insertText: "<input type=\\\"${1:text}\\\" />", documentation: "Input element" },
  { label: "form", insertText: "<form action=\\\"${1:}\\\" method=\\\"${2:post}\\\">\\n\\t${3:}\\n</form>", documentation: "Form element" },
];

// CSS completions
export const cssCompletions = [
  { label: "display", insertText: "display: ${1:flex};", documentation: "CSS display property" },
  { label: "flex", insertText: "display: flex;", documentation: "Flex display" },
  { label: "grid", insertText: "display: grid;", documentation: "Grid display" },
  { label: "margin", insertText: "margin: ${1:0};", documentation: "CSS margin property" },
  { label: "padding", insertText: "padding: ${1:0};", documentation: "CSS padding property" },
  { label: "width", insertText: "width: ${1:100%};", documentation: "CSS width property" },
  { label: "height", insertText: "height: ${1:auto};", documentation: "CSS height property" },
  { label: "color", insertText: "color: ${1:#000};", documentation: "CSS color property" },
  { label: "background", insertText: "background: ${1:#fff};", documentation: "CSS background property" },
];

export const getCompletionItems = (language) => {
  const completionMap = {
    javascript: jsCompletions,
    typescript: jsCompletions,
    jsx: jsCompletions,
    tsx: jsCompletions,
    python: pythonCompletions,
    java: javaCompletions,
    sql: sqlCompletions,
    html: htmlCompletions,
    css: cssCompletions,
  };

  return completionMap[language] || [];
};

export const registerCompletionProvider = (language) => {
  const completionItems = getCompletionItems(language);

  if (completionItems.length === 0) return;

  monaco.languages.registerCompletionItemProvider(language, {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      return {
        suggestions: completionItems.map((item) => ({
          label: item.label,
          kind: monaco.languages.CompletionItemKind.Function,
          documentation: item.documentation,
          insertText: item.insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range: range,
          sortText: item.label,
        })),
      };
    },
  });
};
