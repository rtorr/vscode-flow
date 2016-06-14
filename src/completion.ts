/*
 Copyright (c) 2015-present, Facebook, Inc.
 All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 the root directory of this source tree.
 */

/**
 * TODO MAKE THIS WORK!
 */


import * as vscode from 'vscode';
import { spawn } from 'child_process';

export class CompletionSupport {
  triggerCharacters: Array<string>;
  constructor() {
    this.triggerCharacters = ['.'];
  }

  provideCompletionItems(document, position, token) {
    console.log('wat')
    let flowOutput = '';
    let flowOutputError = '';
    const fileName = document.uri.fsPath;
    const currentContents = document.getText();
    const line = position.line;
    const col = position.character;
    const prefix = '.'; // TODO do better.
    // const completions = await FlowService.flowGetAutocompleteSuggestions(
    //   fileName,
    //   currentContents,
    //   line,
    //   col,
    //   prefix,
    //   true
    // );

    const environment = process.env;
    const config = {
      cwd: `${vscode.workspace.rootPath}`,
      maxBuffer: 10000 * 1024,
      env: environment
    };
    const flowPath = vscode.workspace.getConfiguration('flow').get('path');

    try {
      const flow = spawn(`${flowPath}`, [
        'autocomplete',
        '--strip-root',
        '--json',
        '--no-auto-start',
        fileName,
        line, col], config)
      flow.stdout.on('data', function (data) {
        flowOutput += data.toString();
      })
      flow.stderr.on('data', function (data) {
        flowOutputError += data.toString();
      })
      flow.on('exit', function (code) {
        let o = { errors: null };
        if (flowOutput.length) {
          o = JSON.parse(flowOutput);
        }
        if (flowOutputError.length) {
          vscode.window.showInformationMessage(flowOutputError);
        }
        console.log(o);
        // if (o.errors) {
        //   applyDiagnostics(o.errors);
        // }
      })
    } catch (error) {
      vscode.window.showErrorMessage(error);
    }

    // if (completions) {
    //   return completions.map(atomCompletion => {
    //     const completion = new vscode.CompletionItem(atomCompletion.displayText);
    //     if (atomCompletion.description) {
    //       completion.detail = atomCompletion.description;
    //     }
    //     completion.kind = this.typeToKind(atomCompletion.type, atomCompletion.description);

    //     if (completion.kind === vscode.CompletionItemKind.Function) {
    //       completion.insertText = atomCompletion.snippet.replace(/\${\d+:/g, '{{').replace(/}/g, '}}') + '{{}}';
    //     }

    //     return completion;
    //   });
    // }

    return [];
  }

  typeToKind(type: string, description: string): number {
    // Possible Kinds in VS Code:
    // Method,
    // Function,
    // Constructor,
    // Field,
    // Variable,
    // Class,
    // Interface,
    // Module,
    // Property
    if (type === 'function') {
      return vscode.CompletionItemKind.Function;
    }

    if (description && description.indexOf('[class: ') >= 0) {
      return vscode.CompletionItemKind.Class;
    }

    return vscode.CompletionItemKind.Variable;
  }
}