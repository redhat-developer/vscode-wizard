import * as vscode from 'vscode';
import { IWizard } from "./IWizard";
import { IWizardPage } from "./IWizardPage";
import { IWizardWorkflowManager, PerformFinishResponse } from "./IWizardWorkflowManager";
import { Template } from "./pageImpl";
import { BUTTONS, SEVERITY, ValidatorResponseItem, WebviewWizard, UPDATE_TITLE, AsyncWizardPageValidator } from "./WebviewWizard";
import { WizardPageValidator, WizardPageFieldOptionProvider, WizardDefinition, 
    WizardPageDefinition, WizardPageFieldDefinition, FieldDefinitionState, WizardPageSectionDefinition, ValidatorResponse} from "./WebviewWizard";
import { StandardWizardPageRenderer } from "./StandardWizardPageRenderer";
import { demonstrateSinglePageAllControls } from './Sample';

export { IWizard, IWizardPage, IWizardWorkflowManager, WebviewWizard,
    WizardPageValidator, AsyncWizardPageValidator, WizardPageFieldOptionProvider, 
    WizardDefinition, WizardPageDefinition, WizardPageFieldDefinition, FieldDefinitionState,
    StandardWizardPageRenderer,
    WizardPageSectionDefinition, ValidatorResponse, Template,
    UPDATE_TITLE, BUTTONS, SEVERITY, ValidatorResponseItem, PerformFinishResponse};



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
      const wiz: WebviewWizard = demonstrateSinglePageAllControls(context);
      wiz.open();
    }

  function createValidationItem(sev: SEVERITY, id: string, content: string): ValidatorResponseItem {
    return {
        severity: sev,
        template: {
            id: id,
            content: content
        }
    };
  }

}