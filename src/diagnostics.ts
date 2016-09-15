import * as vscode from 'vscode';
import * as path from 'path';
import { flowCommand } from './helpers';

let lastDiagnostics: vscode.DiagnosticCollection = null;

export function setup(disposables, flowPath) {

  lastDiagnostics = vscode.languages.createDiagnosticCollection();

  // Do an initial call to get diagnostics from the active editor if any
  if (vscode.window.activeTextEditor) {
    console.log('INIT');
    fullDiagnostics(flowPath);
  }

  // Update diagnostics: when active text editor changes
  disposables.push(vscode.window.onDidChangeActiveTextEditor(editor => {
    console.log('CHANGE');
    fileDiagnostics(editor && editor.document, flowPath);
  }));

  // Update diagnostics when document is edited
  disposables.push(vscode.workspace.onDidChangeTextDocument(event => {
    console.log('EDIT');
    if (vscode.window.activeTextEditor) {
      fileDiagnostics(vscode.window.activeTextEditor.document, flowPath);
    }
  }));

  // Update diagnostics when document is saved
  disposables.push(vscode.workspace.onDidSaveTextDocument(event => {
    console.log('SAVE');
    if (vscode.window.activeTextEditor) {
      fullDiagnostics(flowPath);
    }
  }));

}

function fullDiagnostics(flowPath): void {
  flowCommand(
    flowPath,
    [
      'status',
      '--json'
    ], function (output) {
      if (output.errors) {
        applyDiagnostics(output.errors, true);
        fileDiagnostics(vscode.window.activeTextEditor.document, flowPath);
      }
    });
}

function fileDiagnostics(document, flowPath): void {
  const flow = flowCommand(
    flowPath,
    [
      'check-contents',
      '--respect-pragma',
      '--json',
      document.uri.fsPath,
    ],
    function (output) {
      if (output.errors) {
        applyDiagnostics(output.errors, false);
      }
    }
  );
  flow.stdin.end(document.getText());
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
      let diagnostic = new vscode.Diagnostic(range, desc.trim(), mapSeverity(e.level))
      diagnostic.source = 'flow';
      cleaned[path].push(diagnostic);
    });
  });
  return cleaned;

}

function applyDiagnostics(diagnostics, fullDiagnostic) {
  const d = clean(diagnostics);

  if (fullDiagnostic) {
    lastDiagnostics.clear(); // clear old collection
    for (let file in d) {
      if(file != '')
      {
        let errors = d[file];
        var targetResource = vscode.Uri.file(file);
        lastDiagnostics.set(targetResource, errors);
      }
    }
  }
  else
  {
    const file = vscode.window.activeTextEditor.document.uri.fsPath;
    const errors = d[file];
    var targetResource = vscode.Uri.file(file);
    lastDiagnostics.set(targetResource, errors);
  }
}


