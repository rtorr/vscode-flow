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
import { CompletionSupport } from './completion';
import { DeclarationSupport } from './declaration';
import { setup } from './diagnostics';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    config.configure();
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('javascript', new CompletionSupport(), '.'));
    context.subscriptions.push(vscode.languages.registerDefinitionProvider('javascript', new DeclarationSupport()));
    // Diagnostics
    setup(context.subscriptions);
}

// this method is called when your extension is deactivated
export function deactivate() {
}