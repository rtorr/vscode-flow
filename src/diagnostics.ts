import * as vscode from 'vscode';
import * as path from 'path';
import { flowCommand } from './helpers';

let lastDiagnostics: vscode.DiagnosticCollection = null;

export function setup(disposables) {

  // Do an initial call to get diagnostics from the active editor if any
  if (vscode.window.activeTextEditor) {
    console.log('INIT');
    updateDiagnostics(vscode.window.activeTextEditor.document);
  }

  // Update diagnostics: when active text editor changes
  disposables.push(vscode.window.onDidChangeActiveTextEditor(editor => {
    console.log('CHANGE');
    updateDiagnostics(editor && editor.document);
  }));

  // Update diagnostics when document is edited
  disposables.push(vscode.workspace.onDidSaveTextDocument(event => {
    console.log('UPDATE');
    if (vscode.window.activeTextEditor) {
      updateDiagnostics(vscode.window.activeTextEditor.document);
    }
  }));
}

function updateDiagnostics(document): void {
  flowCommand([
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
  let i = 0;

  diagnostics.map(e => {
    return e.message.map(m => {
      if (cleaned[m.path] === undefined) {
        cleaned[m.path] = [];
      }
      desc += ' ' + m.descr;
      if (i === 0) {
        cords = m;
      }
      if (i === 2) {
        targetResource = vscode.Uri.file(cords.path);
        const range = new vscode.Range(cords.line - 1, cords.start - 1, cords.endline - 1, cords.end);
        const location = new vscode.Location(targetResource, range);
        cleaned[cords.path].push(new vscode.Diagnostic(range, desc.trim(), mapSeverity(e.level)));
        desc = '';
        i = 0;
      } else {
        i++;
      }
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



