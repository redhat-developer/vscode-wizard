import * as vscode from 'vscode';
import { WebviewWizard } from './WebviewWizard';
import { demonstrateSinglePageAllControls, demonstrateSinglePageAllControlsOverrideButtons,
  getThreePageBranchWorkflowSampleWizardWithValidation, getTwoPageLinearSampleWizardWithValidation } from "./Sample";


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
    const allcontrols: WebviewWizard = demonstrateSinglePageAllControls(context);
    const twopage: WebviewWizard = getTwoPageLinearSampleWizardWithValidation(context);
    const branch: WebviewWizard = getThreePageBranchWorkflowSampleWizardWithValidation(context);
    const overrideButtons = demonstrateSinglePageAllControlsOverrideButtons(context);
    if( allcontrols && twopage && branch) {

    }
    overrideButtons.open();
  }
}