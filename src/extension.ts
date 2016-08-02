/*
 Copyright (c) 2015-present, Facebook, Inc.
 All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 the root directory of this source tree.
 */

'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as config from './config';
import { DeclarationSupport } from './declaration';
import { setup } from './diagnostics';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    let flowPath;
    if (vscode.workspace.getConfiguration('flow').get('path')) {
        flowPath = vscode.workspace.getConfiguration('flow').get('path');
    }else if (process.platform === 'linux') {
        flowPath = `${context.extensionPath}/flow/linux/flow/flow`;
    }else if (process.platform === 'darwin') {
        flowPath = `${context.extensionPath}/flow/osx/flow/flow`;
    }else if (process.platform === 'win32') {
        flowPath = `${context.extensionPath}/flow/win64/flow/flow`;
    }
    if (vscode.workspace.getConfiguration('flow').get('disable')) {
        return undefined;
    }
    if (!flowPath) {
        vscode.window.showErrorMessage('Please add "flow.path": "path/to/flow" in your .vscode/settings.json file');
        return undefined;
    }
    config.configure();
    context.subscriptions.push(vscode.languages.registerDefinitionProvider('javascript', new DeclarationSupport(flowPath)));
    // Diagnostics
    setup(context.subscriptions, flowPath);
}

// this method is called when your extension is deactivated
export function deactivate() { }