import * as vscode from 'vscode';

import { flowCommand } from './helpers';

export class HoverSupport {
  async provideHover(document: vscode.TextDocument, position: vscode.Position) {
    const flowPath = vscode.workspace.getConfiguration('flow').get('path');
    const fileName = document.uri.fsPath;
    const wordPosition = document.getWordRangeAtPosition(position)
    if (!wordPosition) return;
    const word = document.getText(wordPosition);
    const currentContents = document.getText();
    const line = position.line + 1;
    const col = position.character + 1;
    const completions = await new Promise<any>(resolve => {
      const flowInstance = flowCommand(flowPath, [
        'type-at-pos',
        '--json',
        fileName,
        line.toString(),
        col.toString()
      ], resolve);
      flowInstance.stdin.end(currentContents);
    });

    if (completions) {
      return new vscode.Hover([
        '[Flow]',
        {language: 'javascript', value: `${word}: ${completions.type}`}
      ]);
    }
  }
}
