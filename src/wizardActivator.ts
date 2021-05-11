import * as vscode from 'vscode';
import { WebviewWizard } from './WebviewWizard';
import * as sample from "./Sample";


export function activate(context: vscode.ExtensionContext) {
  registerCommands(context);
}

export function deactivate() {}

function registerCommands(context: vscode.ExtensionContext) {
  let homePage = vscode.commands.registerCommand("ext.home", async () => {
    openSampleWizard(context);
  });

  context.subscriptions.push(homePage);

  function openSampleWizard(context: vscode.ExtensionContext) {
    sample.getThreePageBranchWorkflowSampleWizardWithValidation(context).open();
  }
}