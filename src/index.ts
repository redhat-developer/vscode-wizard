import * as vscode from 'vscode';
import { IWizard } from "./IWizard";
import { IWizardPage } from "./IWizardPage";
import { IWizardWorkflowManager, PerformFinishResponse } from "./IWizardWorkflowManager";
import { Template } from "./pageImpl";
import { BUTTONS, SEVERITY, ValidatorResponseItem, WebviewWizard, UPDATE_TITLE, AsyncWizardPageValidator } from "./WebviewWizard";
import { WizardPageValidator, WizardPageFieldOptionProvider, WizardDefinition, 
    WizardPageDefinition, WizardPageFieldDefinition, FieldDefinitionState, WizardPageSectionDefinition, ValidatorResponse} from "./WebviewWizard";
import { StandardWizardPageRenderer } from "./StandardWizardPageRenderer";

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
      const wiz: WebviewWizard = getTwoPageLinearSampleWizardWithValidation(context);
      wiz.open();
    }


    function getTwoPageLinearSampleWizardWithValidation(context: vscode.ExtensionContext) : WebviewWizard {
    let def : WizardDefinition = {
      title: "Two Page Linear Wizard", 
      description: "This is a two page wizard with a linear workflow",
      pages: [
        {
            id: 'page1',
            title: "Who Are You?",
            description: "Before we can proceed, tell me who you are!",
            fields: [
                {
                    id: "addusername",
                    label: "Username",
                    type: "textbox"
                }
            ],
            validator: (parameters:any) => {
                let items : ValidatorResponseItem[] = [];
                const username = parameters.addusername;
                if( username === 'Max') {
                    items.push(createValidationItem(SEVERITY.ERROR, "addusername", "Max is not allowed to use this wizard. Sorry Max!"));
                }
                if( username === 'Fred') {
                    items.push(createValidationItem(SEVERITY.WARN, "addusername", 
                    "Fred may cause you to have to do more work"));
                }
                if( username === 'El Jefe') {
                    items.push(createValidationItem(SEVERITY.INFO, "addusername", 
                    "I am overjoyed to see my overlord, El Jefe, long may he reign!"));
                }
                return { items: items };
            }
          }, 
          {
            id: 'page2',
            title: "Stuff You Like",
            description: "Tell us more about yourself!",
            fields: [
                {
                    id: "favcolor",
                    label: "Favorite Color",
                    type: "textbox"
                }
            ],
            validator: (parameters:any) : ValidatorResponse => {
                let items : ValidatorResponseItem[] = [];
                const color = parameters.favcolor;
                if( color === null || color === undefined || color === "") {
                    items.push(createValidationItem(SEVERITY.ERROR, "favcolor", 
                    "Favorite Color must not be empty."));
                }
                return { items: items };
            }
          }
        ]
    };
    let data = new Map<string,string>();
    data.set("addusername", "bob");
    const wiz: WebviewWizard = new WebviewWizard("sample1", "sample1", context, def, data);
    return wiz;
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