import * as vscode from 'vscode';
import { WebviewWizard, WizardPageDefinition, WizardDefinition } from './WebviewWizard';


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

    let page1 : WizardPageDefinition = {
      title: "Page 1",
      description: "Example description",
      fields: [
          {
              id: "addusername",
              label: "Username",
              type: "textbox"
          }
      ],
      validator: (parameters:any) => {
          let templates = [];
          const username = parameters.addusername;
          if( username === 'b') {
              templates.push({ id: "addusernameValidation", 
              content: "Username must not be 'b'"});
          }
          return templates;
      }
    };

    let page2 : WizardPageDefinition = {
      title: "Page 2",
      description: "Example description",
      fields: [
          {
              id: "favcolor",
              label: "Favorite Color",
              type: "textbox"
          }
      ]
    };
    let def : WizardDefinition = {
      title: "Sample Wizard", 
      description: "A wizard to sample - description",
      pages: [page1, page2]
    };
    const wiz: WebviewWizard = new WebviewWizard("sample1", "sample1", context, def);
    wiz.open();
  }
}