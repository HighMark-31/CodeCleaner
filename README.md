# 🧹 Code Cleaner – Remove & Manage Comments and Emojis from Code

Clean your source code by automatically removing unwanted **inline comments**, **multiline comments**, and **emojis** in JavaScript, Python, HTML, and 15+ languages. Perfect for code reviews, minification, or preparing clean production code.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Publisher](https://img.shields.io/badge/publisher-highmark--it-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)

**Code Cleaner** is a powerful and versatile extension for Visual Studio Code designed to help you quickly clean your code of unwanted comments and emojis, improving the readability and maintainability of your source code.

Visit our website: [codecleaner.highmark.it](https://codecleaner.highmark.it)

## ✨ Why choose Code Cleaner?

- **Fast and Efficient**: Finds and removes comments and emojis in seconds
- **Precision**: Advanced algorithms that avoid false positives
- **Multi-language**: Supports over 15 programming languages
- **Intuitive Interface**: Context menu and easy-to-use commands
- **Quick Navigation**: Jump between found occurrences with a simple key

## 🌐 Supported Languages

- ✅ **JavaScript** - `//` and `/* */`
- ✅ **TypeScript** - `//` and `/* */`
- ✅ **HTML** - `<!-- -->`
- ✅ **CSS** - `/* */`
- ✅ **PHP** - `//`, `#` and `/* */`
- ✅ **C** - `//` and `/* */`
- ✅ **C++** - `//` and `/* */`
- ✅ **C#** - `//` and `/* */`
- ✅ **Rust** - `//` and `/* */`
- ✅ **Go** - `//` and `/* */`
- ✅ **Java** - `//` and `/* */`
- ✅ **Kotlin** - `//` and `/* */`
- ✅ **Swift** - `//` and `/* */`
- ✅ **Python** - `#`, `"""` and `'''`
- ✅ **Ruby** - `#` and `=begin...=end`
- ✅ **SQL** - `--` and `/* */`

> **Note**: For languages not explicitly supported, Code Cleaner uses generic patterns that work with most common syntaxes (`//`, `#`, `/* */`).

## 🚀 Features

Code Cleaner offers a series of powerful commands to identify and remove various types of "noise" from your code:

### Search Commands
- **Find Inline Comments**: Highlights all single-line comments (e.g., `// comment`)
- **Find Multiline Comments**: Highlights all comment blocks (e.g., `/* comment */`)
- **Find Emojis**: Highlights all emojis present in the code

### Removal Commands
- **Remove Inline Comments**: Removes all found single-line comments
- **Remove Multiline Comments**: Removes all found comment blocks
- **Remove Emojis**: Removes all found emojis

### Navigation Commands
- **Navigate to Next Match**: Move to the next highlighted occurrence
- **Clear Highlights**: Removes all highlights created by the extension

## 📖 How to use

You can access Code Cleaner commands in two ways:

1.  **Context Menu**: Right-click in the text editor, select `Code Cleaner` from the menu to view all available commands.
2.  **Command Palette**: Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac) and type `Code Cleaner:` to filter and select the desired command.

## 📋 Available Commands

| Command                               | Description                               | Command ID                              |
| ------------------------------------- | ----------------------------------------- | --------------------------------------- |
|  **Find Inline Comments**           | Finds all single-line comments.           | `codecleaner.findInlineComments`       |
|  **Find Multiline Comments**        | Finds all comment blocks.                 | `codecleaner.findMultilineComments`    |
|  **Find Emojis**                    | Finds all emojis in the code.             | `codecleaner.findEmojis`                |
|  **Remove Inline Comments**         | Removes all single-line comments.         | `codecleaner.removeInlineComments`     |
|  **Remove Multiline Comments**      | Removes all multiline comment blocks.     | `codecleaner.removeMultilineComments`  |
|  **Remove Emojis**                  | Removes all emojis in the code.           | `codecleaner.removeEmojis`              |
|  **Navigate to Next Match**         | Moves to the next occurrence.             | `codecleaner.navigateNext`             |
|  **Clear Highlights**               | Clears all highlights.                    | `codecleaner.clearHighlights`          |

## Keyboard Shortcuts

For an even faster workflow, you can use the following shortcuts:

- `Enter`  Go to the next found occurrence
- `Escape`  Clear all highlights

## 📦 Installation

1. Open Visual Studio Code
2. Go to the Extensions panel (`Ctrl+Shift+X`)
3. Click the 3 dots
4. Click on "Install from VSIX..."
5. Select the extension file

Or install directly from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=highmark-it.codecleaner).

## 💡 Usage Examples

### Scenario 1: Cleaning a JavaScript file
```javascript
// TODO: Implement this function 😅
function calculateTotal(items) {
    /* 
     * This function calculates the total
     * of items in the cart 🛒
     */
    return items.reduce((sum, item) => sum + item.price, 0); // Sum the prices
}
```

**After using Code Cleaner:**
```javascript
function calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.price, 0);
}
```

### Scenario 2: Removing emojis from Python code
```python
def greet_user(name): # Greeting function 👋
    """Greets the user with a personalized message 🎉"""
    return f"Hello {name}! 😊"  # Welcome message
```

**After using Code Cleaner:**
```python
def greet_user(name):
    return f"Hello {name}!"
```

## Author

Developed by [**HighMark IT [Marco N.]**](https://highmark.it/).

---

 ⭐ **Thank you for choosing Code Cleaner!** We hope this extension helps you keep your code clean and professional | If you like this extension, please leave a review on the Marketplace!