import * as vscode from 'vscode';
import { spawn } from 'child_process';

const environment = process.env;
const config = {
  cwd: `${vscode.workspace.rootPath}`,
  maxBuffer: 10000 * 1024,
  env: environment
};

export function flowCommand(flowPath, commandList:Array<string>, cb) {
  let flowOutput = '';
  let flowOutputError = '';
  try {
    const flow = spawn(`${flowPath}`, commandList, config)
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
      if (flowOutputError.length && (code === null || code)) {
        return vscode.window.showInformationMessage(flowOutputError);
      }
      return cb(o);
    })

    return flow;
  } catch (error) {
    vscode.window.showErrorMessage(error);
  }
}
