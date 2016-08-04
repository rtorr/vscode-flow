import * as vscode from 'vscode';
import * as path from 'path';
import { flowCommand } from './helpers';

let lastDiagnostics: vscode.DiagnosticCollection = null;

export function setup(disposables, flowPath) {

  // Do an initial call to get diagnostics from the active editor if any
  if (vscode.window.activeTextEditor) {
    console.log('INIT');
    updateDiagnostics(vscode.window.activeTextEditor.document, flowPath);
  }

  // Update diagnostics: when active text editor changes
  disposables.push(vscode.window.onDidChangeActiveTextEditor(editor => {
    console.log('CHANGE');
    updateDiagnostics(editor && editor.document, flowPath);
  }));

  // Update diagnostics when document is edited
  disposables.push(vscode.workspace.onDidSaveTextDocument(event => {
    console.log('UPDATE');
    if (vscode.window.activeTextEditor) {
      updateDiagnostics(vscode.window.activeTextEditor.document, flowPath);
    }
  }));
}

function updateDiagnostics(document, flowPath): void {
  flowCommand(
    flowPath,
    [
      '--json'
    ], function (output) {
      if (output.errors) {
        applyDiagnostics(output.errors);
      }
    });
}

function mapSeverity(sev: string) {
  switch (sev) {
    case "error": return vscode.DiagnosticSeverity.Error;
    case "warning": return vscode.DiagnosticSeverity.Warning;
    default: return vscode.DiagnosticSeverity.Error;
  }
}

function clean(diagnostics) {
  let cleaned = {};
  let targetResource;
  let desc = '';
  let cords = {
    path: '',
    line: 0,
    start: 0,
    endline: 0,
    end: 0
  };

  diagnostics.map(e => {
    desc = '';    
    return e.message.map((m) => {
      const path = m.path;
      if (cleaned[path] === undefined) {
        cleaned[path] = [];
      }
      if (m.descr) {
        desc += ` ${m.descr}`;
      }
      const range = new vscode.Range(m.line > 1 ? m.line - 1 : m.line, m.start > 1 ? m.start - 1 : m.start, m.endline > 1 ? m.endline - 1 : m.endline, m.end);
      const location = new vscode.Location(targetResource, range);
      cleaned[path].push(new vscode.Diagnostic(range, desc.trim(), mapSeverity(e.level)));
    });
  });
  return cleaned;

}

function applyDiagnostics(diagnostics) {
  const d = clean(diagnostics);
  if (lastDiagnostics) {
    lastDiagnostics.dispose(); // clear old collection
  }
  lastDiagnostics = vscode.languages.createDiagnosticCollection();
  for (let file in d) {
    let errors = d[file];
    var targetResource = vscode.Uri.file(file);
    lastDiagnostics.set(targetResource, errors);
  }
}


