/*
 Copyright (c) 2015-present, Facebook, Inc.
 All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 the root directory of this source tree.
 */

import * as vscode from 'vscode';
import { flowCommand } from './helpers';

export class DeclarationSupport {

  flowPath;

  constructor(flowPath) {
    this.flowPath = flowPath;
  }

  provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
    const fileName = document.uri.fsPath;
    const currentContents = document.getText();
    let flowOutput = '';
    let flowOutputError = '';

    const wordAtPosition = document.getWordRangeAtPosition(position);
    if (wordAtPosition) {
      const line = wordAtPosition.start.line + 1; // fix offsets
      const col = wordAtPosition.start.character + 1; // fix offsets
      flowCommand(
        this.flowPath,
        [
        'get-def',
        '--strip-root',
        '--json',
        fileName,
        `${line}`, 
        `${col}`
        ], function (output) {
          const range = new vscode.Range(output.line, output.start, output.line, output.end);
          const uri = vscode.Uri.file(output.path);
          return new vscode.Location(uri, range);
        });
    }

    return null; // no definition
  }
}