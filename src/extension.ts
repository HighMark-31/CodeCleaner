import * as vscode from 'vscode';

interface CommentMatch {
    line: number;
    startChar: number;
    endChar: number;
    text: string;
}

interface EmojiMatch {
    line: number;
    startChar: number;
    endChar: number;
    emoji: string;
}

let currentMatches: (CommentMatch | EmojiMatch)[] = [];
let currentMatchIndex = -1;
let isNavigationActive = false;

export function activate(context: vscode.ExtensionContext) {
    console.log('Code Cleaner is now active!');

    let findInline = vscode.commands.registerCommand('codecleaner.findInlineComments', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor!');
            return;
        }

        const matches = findInlineComments(editor.document);
        startNavigation(editor, matches);
        vscode.window.showInformationMessage(`Found ${matches.length} inline comments. Use Enter to navigate, Esc to exit.`);
    });

    let findMultiline = vscode.commands.registerCommand('codecleaner.findMultilineComments', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor!');
            return;
        }

        const matches = findMultilineComments(editor.document);
        startNavigation(editor, matches);
        vscode.window.showInformationMessage(`Found ${matches.length} multiline comments. Use Enter to navigate, Esc to exit.`);
    });

    let findEmojisCmd = vscode.commands.registerCommand('codecleaner.findEmojis', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor!');
            return;
        }

        const matches = findEmojis(editor.document);
        startNavigation(editor, matches);
        vscode.window.showInformationMessage(`Found ${matches.length} emojis. Use Enter to navigate, Esc to exit.`);
    });

    let navigateNext = vscode.commands.registerCommand('codecleaner.navigateNext', () => {
        if (!isNavigationActive || currentMatches.length === 0) {
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        currentMatchIndex = (currentMatchIndex + 1) % currentMatches.length;
        navigateToMatch(editor, currentMatches[currentMatchIndex]);
    });

    let clearHighlights = vscode.commands.registerCommand('codecleaner.clearHighlights', () => {
        clearNavigation();
    });

    let removeInline = vscode.commands.registerCommand('codecleaner.removeInlineComments', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor!');
            return;
        }

        const matches = findInlineComments(editor.document);
        if (matches.length === 0) {
            vscode.window.showInformationMessage('No inline comments found');
            return;
        }

        const answer = await vscode.window.showWarningMessage(
            `Remove ${matches.length} inline comments?`,
            'Yes', 'No'
        );

        if (answer === 'Yes') {
            await removeComments(editor, matches);
            vscode.window.showInformationMessage(`${matches.length} inline comments removed`);
        }
    });

    let removeMultiline = vscode.commands.registerCommand('codecleaner.removeMultilineComments', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor!');
            return;
        }

        const matches = findMultilineComments(editor.document);
        if (matches.length === 0) {
            vscode.window.showInformationMessage('No multiline comments found');
            return;
        }

        const answer = await vscode.window.showWarningMessage(
            `Remove ${matches.length} multiline comments?`,
            'Yes', 'No'
        );

        if (answer === 'Yes') {
            await removeComments(editor, matches);
            vscode.window.showInformationMessage(`${matches.length} multiline comments removed`);
        }
    });

    let removeEmojisCmd = vscode.commands.registerCommand('codecleaner.removeEmojis', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor!');
            return;
        }

        const matches = findEmojis(editor.document);
        if (matches.length === 0) {
            vscode.window.showInformationMessage('No emojis found');
            return;
        }

        const mode = await vscode.window.showQuickPick(
            ['Automatic removal', 'Custom replacement'],
            { placeHolder: 'Choose removal mode' }
        );

        if (!mode) return;

        if (mode === 'Automatic removal') {
            await removeEmojisAuto(editor, matches);
            vscode.window.showInformationMessage(`${matches.length} emojis removed`);
        } else {
            await removeEmojisCustom(editor, matches);
        }
    });

    let onDidChangeTextEditorSelection = vscode.window.onDidChangeTextEditorSelection((event) => {
        if (isNavigationActive && event.kind === vscode.TextEditorSelectionChangeKind.Mouse) {
            clearNavigation();
        }
    });

    context.subscriptions.push(
        findInline,
        findMultiline,
        findEmojisCmd,
        navigateNext,
        clearHighlights,
        removeInline,
        removeMultiline,
        removeEmojisCmd,
        onDidChangeTextEditorSelection
    );
}

function isInsideRegex(text: string, position: number): boolean {
    const regexPattern = /\/(?:[^\/\\\n]|\\.)+\/[gimsuyx]*/g;
    let match;
    
    while ((match = regexPattern.exec(text)) !== null) {
        if (position >= match.index && position < match.index + match[0].length) {
            return true;
        }
    }
    
    const newRegexPattern = /new\s+RegExp\s*\(\s*["'`]([^"'`\\]|\\.)*["'`]\s*(?:,\s*["'`][gimsuyx]*["'`])?\s*\)/g;
    while ((match = newRegexPattern.exec(text)) !== null) {
        if (position >= match.index && position < match.index + match[0].length) {
            return true;
        }
    }
    
    return false;
}

function getLanguageConfig(languageId: string): { inline: RegExp[], multiline: RegExp[] } {
    const configs: { [key: string]: { inline: RegExp[], multiline: RegExp[] } } = {
        'javascript': {
            inline: [/(?<![\w\/])\/\/.*$/gm],
            multiline: [/\/\*[\s\S]*?\*\//g]
        },
        'typescript': {
            inline: [/(?<![\w\/])\/\/.*$/gm],
            multiline: [/\/\*[\s\S]*?\*\//g]
        },
        'python': {
            inline: [/(?<![\w])#.*$/gm],
            multiline: [/"""[\s\S]*?"""/g, /'''[\s\S]*?'''/g]
        },
        'java': {
            inline: [/(?<![\w\/])\/\/.*$/gm],
            multiline: [/\/\*[\s\S]*?\*\//g]
        },
        'c': {
            inline: [/(?<![\w\/])\/\/.*$/gm],
            multiline: [/\/\*[\s\S]*?\*\//g]
        },
        'cpp': {
            inline: [/(?<![\w\/])\/\/.*$/gm],
            multiline: [/\/\*[\s\S]*?\*\//g]
        },
        'csharp': {
            inline: [/(?<![\w\/])\/\/.*$/gm],
            multiline: [/\/\*[\s\S]*?\*\//g]
        },
        'html': {
            inline: [],
            multiline: [/<!--[\s\S]*?-->/g]
        },
        'css': {
            inline: [],
            multiline: [/\/\*[\s\S]*?\*\//g]
        },
        'ruby': {
            inline: [/(?<![\w])#.*$/gm],
            multiline: [/=begin[\s\S]*?=end/g]
        },
        'php': {
            inline: [/(?<![\w\/])\/\/.*$/gm, /(?<![\w])#.*$/gm],
            multiline: [/\/\*[\s\S]*?\*\//g]
        },
        'go': {
            inline: [/(?<![\w\/])\/\/.*$/gm],
            multiline: [/\/\*[\s\S]*?\*\//g]
        },
        'rust': {
            inline: [/(?<![\w\/])\/\/.*$/gm],
            multiline: [/\/\*[\s\S]*?\*\//g]
        },
        'kotlin': {
            inline: [/(?<![\w\/])\/\/.*$/gm],
            multiline: [/\/\*[\s\S]*?\*\//g]
        },
        'swift': {
            inline: [/(?<![\w\/])\/\/.*$/gm],
            multiline: [/\/\*[\s\S]*?\*\//g]
        },
        'sql': {
            inline: [/(?<![\w])--.*/g],
            multiline: [/\/\*[\s\S]*?\*\//g]
        }
    };

    return configs[languageId] || { inline: [/(?<![\w\/])\/\/.*$/gm, /(?<![\w])#.*$/gm], multiline: [/\/\*[\s\S]*?\*\//g] };
}

function startNavigation(editor: vscode.TextEditor, matches: (CommentMatch | EmojiMatch)[]) {
    currentMatches = matches;
    currentMatchIndex = -1;
    isNavigationActive = true;
    
    if (matches.length > 0) {
        if ('text' in matches[0]) {
            highlightMatches(editor, matches as CommentMatch[]);
        } else {
            highlightEmojiMatches(editor, matches as EmojiMatch[]);
        }
    }
}

function navigateToMatch(editor: vscode.TextEditor, match: CommentMatch | EmojiMatch) {
    const position = new vscode.Position(match.line, match.startChar);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
}

function clearNavigation() {
    isNavigationActive = false;
    currentMatches = [];
    currentMatchIndex = -1;
    
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        editor.setDecorations(decorationType, []);
    }
}

function findInlineComments(document: vscode.TextDocument): CommentMatch[] {
    const matches: CommentMatch[] = [];
    const config = getLanguageConfig(document.languageId);
    const text = document.getText();

    let textWithoutMultiline = text;
    for (const regex of config.multiline) {
        textWithoutMultiline = textWithoutMultiline.replace(regex, (match) => ' '.repeat(match.length));
    }

    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const lineText = line.text;

        for (const regex of config.inline) {
            regex.lastIndex = 0;
            const match = regex.exec(lineText);
            
            if (match) {
                const startChar = match.index;
                const endChar = match.index + match[0].length;
                
                const absoluteStart = document.offsetAt(new vscode.Position(i, startChar));
                const charInOriginal = textWithoutMultiline[absoluteStart];
                
                if (charInOriginal !== ' ' && !isInsideRegex(lineText, startChar)) {
                    matches.push({
                        line: i,
                        startChar,
                        endChar,
                        text: match[0]
                    });
                }
            }
        }
    }

    return matches;
}

function findMultilineComments(document: vscode.TextDocument): CommentMatch[] {
    const matches: CommentMatch[] = [];
    const config = getLanguageConfig(document.languageId);
    const text = document.getText();

    for (const regex of config.multiline) {
        regex.lastIndex = 0;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            
            if (!isInsideRegex(text, match.index)) {
                matches.push({
                    line: startPos.line,
                    startChar: startPos.character,
                    endChar: endPos.character,
                    text: match[0]
                });
            }
        }
    }

    return matches;
}

function findEmojis(document: vscode.TextDocument): EmojiMatch[] {
    const matches: EmojiMatch[] = [];
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}]/gu;

    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const lineText = line.text;
        
        let match;
        emojiRegex.lastIndex = 0;
        
        while ((match = emojiRegex.exec(lineText)) !== null) {
            matches.push({
                line: i,
                startChar: match.index,
                endChar: match.index + match[0].length,
                emoji: match[0]
            });
        }
    }

    return matches;
}

const decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 200, 0, 0.3)',
    border: '1px solid rgba(255, 200, 0, 0.8)'
});

function highlightMatches(editor: vscode.TextEditor, matches: CommentMatch[]) {
    const ranges = matches.map(match => 
        new vscode.Range(
            new vscode.Position(match.line, match.startChar),
            new vscode.Position(match.line, match.endChar)
        )
    );
    
    editor.setDecorations(decorationType, ranges);
}

function highlightEmojiMatches(editor: vscode.TextEditor, matches: EmojiMatch[]) {
    const ranges = matches.map(match => 
        new vscode.Range(
            new vscode.Position(match.line, match.startChar),
            new vscode.Position(match.line, match.endChar)
        )
    );
    
    editor.setDecorations(decorationType, ranges);
}

async function removeComments(editor: vscode.TextEditor, matches: CommentMatch[]) {
    await editor.edit(editBuilder => {
        const sortedMatches = [...matches].sort((a, b) => {
            if (b.line !== a.line) return b.line - a.line;
            return b.startChar - a.startChar;
        });

        for (const match of sortedMatches) {
            const range = new vscode.Range(
                new vscode.Position(match.line, match.startChar),
                new vscode.Position(match.line, match.endChar)
            );
            
            const line = editor.document.lineAt(match.line);
            if (line.text.trim() === match.text.trim()) {
                const lineRange = new vscode.Range(
                    new vscode.Position(match.line, 0),
                    new vscode.Position(match.line + 1, 0)
                );
                editBuilder.delete(lineRange);
            } else {
                editBuilder.delete(range);
            }
        }
    });
}

async function removeEmojisAuto(editor: vscode.TextEditor, matches: EmojiMatch[]) {
    await editor.edit(editBuilder => {
        const sortedMatches = [...matches].sort((a, b) => {
            if (b.line !== a.line) return b.line - a.line;
            return b.startChar - a.startChar;
        });

        for (const match of sortedMatches) {
            const range = new vscode.Range(
                new vscode.Position(match.line, match.startChar),
                new vscode.Position(match.line, match.endChar)
            );
            editBuilder.delete(range);
        }
    });
}

async function removeEmojisCustom(editor: vscode.TextEditor, matches: EmojiMatch[]) {
    const uniqueEmojis = [...new Set(matches.map(m => m.emoji))];
    const replacements: { [emoji: string]: string } = {};

    for (const emoji of uniqueEmojis) {
        const replacement = await vscode.window.showInputBox({
            prompt: `What do you want to replace ${emoji} with?`,
            placeHolder: 'Leave empty to remove'
        });

        if (replacement === undefined) {
            return; 
        }

        replacements[emoji] = replacement || '';
    }

    await editor.edit(editBuilder => {
        const sortedMatches = [...matches].sort((a, b) => {
            if (b.line !== a.line) return b.line - a.line;
            return b.startChar - a.startChar;
        });

        for (const match of sortedMatches) {
            const range = new vscode.Range(
                new vscode.Position(match.line, match.startChar),
                new vscode.Position(match.line, match.endChar)
            );
            editBuilder.replace(range, replacements[match.emoji]);
        }
    });

    vscode.window.showInformationMessage(`${matches.length} emojis replaced`);
}

export function deactivate() {}
