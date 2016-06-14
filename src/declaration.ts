/*
 Copyright (c) 2015-present, Facebook, Inc.
 All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 the root directory of this source tree.
 */

import * as vscode from 'vscode';
import { spawn } from 'child_process';

export class DeclarationSupport {

  async provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
    const fileName = document.uri.fsPath;
    const currentContents = document.getText();
    let flowOutput = '';
    let flowOutputError = '';

    const wordAtPosition = document.getWordRangeAtPosition(position);
    if (wordAtPosition) {
      const line = wordAtPosition.start.line + 1; // fix offsets
      const col = wordAtPosition.start.character + 1; // fix offsets

      var config = {
        cwd: `${vscode.workspace.rootPath}`,
        maxBuffer: 10000 * 1024,
        env: process.env
      }

      try {
        const flow = spawn(`flow`, [
          'get-def',
          '--strip-root',
          '--json',
          fileName,
          `${line}`, `${col}`], config)
        flow.stdout.on('data', function (data) {
          flowOutput += data.toString();
        })
        flow.stderr.on('data', function (data) {
          flowOutputError += data.toString();
        })
        flow.on('exit', function (code) {
          let o;
          if (flowOutput.length) {
            o = JSON.parse(flowOutput);
          }
          if (flowOutputError.length) {
            vscode.window.showInformationMessage(flowOutputError);
          }
          const range = new vscode.Range(o.line, o.column, o.line, o.column);
          const uri = vscode.Uri.file(o.file);
          return new vscode.Location(uri, range);
        })
      } catch (error) {
        vscode.window.showErrorMessage(error);
      }
    }

    return null; // no definition
  }
}