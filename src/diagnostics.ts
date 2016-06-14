import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';

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

var environment = process.env;

var config = {
  cwd: `${vscode.workspace.rootPath}`,
  maxBuffer: 10000 * 1024,
  env: environment
}

function updateDiagnostics(document): void {
  let flowOutput = '';
  let flowOutputError = '';
  try {
    const flow = spawn(`flow`, ['--json'], config)
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
      if (o.errors) {
        applyDiagnostics(o.errors);
      }
    })
  } catch (error) {
    vscode.window.showErrorMessage(error);
  }
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
  let diags = diagnostics.map(e => {
    return e.message.map(m => {
      if (m.line) {
        if (cleaned[m.path] === undefined) {
          cleaned[m.path] = [];
        }
        targetResource = vscode.Uri.file(m.path);
        const range = new vscode.Range(m.line - 1, m.start - 1, m.endline - 1, m.end);
        const location = new vscode.Location(targetResource, range);
        cleaned[m.path].push(new vscode.Diagnostic(range, m.descr, mapSeverity(e.level)));
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



