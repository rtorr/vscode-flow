import * as vscode from 'vscode';
import { spawn } from 'child_process';

import { flowCommand } from './helpers';

function typeToKind(flowEntry): number {
    if (flowEntry.type === 'FUNCTION' || flowEntry.func_details || flowEntry.type.includes('=>')) {
      return vscode.CompletionItemKind.Function;
    }

    if (flowEntry.type.indexOf('[class: ') >= 0) {
      return vscode.CompletionItemKind.Class;
    }

    if (flowEntry.type.indexOf('[type: ') >= 0) {
      return vscode.CompletionItemKind.Interface;
    }

    return vscode.CompletionItemKind.Variable;
  }

export class CompletionSupport {
  async provideCompletionItems(document, position, token) {
    let flowOutput = '';
    let flowOutputError = '';
    const fileName = document.uri.fsPath;
    const currentContents = document.getText();
    const line = position.line + 1;
    const col = position.character + 1;
    const flowPath = vscode.workspace.getConfiguration('flow').get('path');

    try {
      const flowResponse = await new Promise<any>((resolve, reject) => {
        const flowInstance = flowCommand(flowPath, [
          'autocomplete',
          '--strip-root',
          '--json',
          '--no-auto-start',
          fileName,
          line,
          col
        ], resolve);
        flowInstance.stdin.end(currentContents);
      });

      const results =  flowResponse.result.map(item => {
        const completion = new vscode.CompletionItem(item.name);
        completion.kind = typeToKind(item);
        completion.detail = item.type;

        // FIXME: undestand scoring system
        completion.sortText = `\u0000${item.name}`;
        return completion;
      });
      return results;
    } catch (error) {
      vscode.window.showErrorMessage(error);
    }
    return [];
  }
}