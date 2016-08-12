import * as vscode from 'vscode';
import { spawn } from 'child_process';

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

function spawnFlowAsPromised(command, params, config, input) {
  let resolve, reject;
  let output = '';
  let errorOutput = '';
  const promise = new Promise<string>((ok, fail) => { resolve = ok; reject = fail });
  const spawnedCommand = spawn(command, params, config);
  spawnedCommand.stdin.end(input);
  spawnedCommand.stdout.on('data', function (data) {
    output += data.toString();
  });
  spawnedCommand.stderr.on('data', function (data) {
    errorOutput += data.toString();
  });
  spawnedCommand.on('exit', function (code) {
    if (errorOutput.length) {
      vscode.window.showInformationMessage(errorOutput);
    }

    resolve(output);
  });
  return promise;
}

export class CompletionSupport {
  async provideCompletionItems(document, position, token) {
    let flowOutput = '';
    let flowOutputError = '';
    const fileName = document.uri.fsPath;
    const currentContents = document.getText();
    const line = position.line + 1;
    const col = position.character + 1;
    const environment = process.env;
    const config = {
      cwd: `${vscode.workspace.rootPath}`,
      maxBuffer: 10000 * 1024,
      env: environment
    };
    const flowPath = vscode.workspace.getConfiguration('flow').get('path');

    try {
      const output = await spawnFlowAsPromised(
        flowPath,
        [
          'autocomplete',
          '--strip-root',
          '--json',
          '--no-auto-start',
          fileName,
          line,
          col
        ],
        config,
        currentContents
      );
      if (output.length) {
        const flowResponse = JSON.parse(output);
        const results =  flowResponse.result.map(item => {
            const completion = new vscode.CompletionItem(item.name);
            completion.kind = typeToKind(item);
            completion.detail = item.type;

            // FIXME: undestand scoring system
            completion.sortText = `\u0000${item.name}`;
            return completion;
        });
        return results;
      }
    } catch (error) {
      vscode.window.showErrorMessage(error);
    }
    return [];
  }
}