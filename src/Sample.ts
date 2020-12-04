import * as vscode from 'vscode';
import { WebviewWizard, WizardDefinition } from './WebviewWizard';
import { IWizardPage } from './IWizardPage';

export function getTwoPageLinearSampleWizardWithValidation(context: vscode.ExtensionContext) : WebviewWizard {
    let def : WizardDefinition = {
      title: "Sample Wizard", 
      description: "A wizard to sample - description",
      pages: [
        {
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
          }, 
          {
            title: "Page 2",
            description: "Example description",
            fields: [
                {
                    id: "favcolor",
                    label: "Favorite Color",
                    type: "textbox"
                }
            ],
            validator: (parameters:any) => {
                let templates = [];
                const color = parameters.favcolor;
                if( color === null || color === undefined || color === "") {
                    templates.push({ id: "favcolorValidation", 
                    content: "Favorite Color must not be empty."});
                }
                return templates;
            }
          }
        ]
    };
    let data = new Map<string,string>();
    data.set("addusername", "bob");
    const wiz: WebviewWizard = new WebviewWizard("sample1", "sample1", context, def, data);
    return wiz;
  }


export function demonstrateSinglePageAllControls(context: vscode.ExtensionContext) : WebviewWizard {
    let def : WizardDefinition = {
      title: "Sample Wizard", 
      description: "A wizard to sample - description",
      pages: [
        {
            title: "Page 1",
            description: "Example description",
            fields: [
                {
                    id: "addusername",
                    label: "Username",
                    type: "textbox",
                    initialValue: "Textbox initial value"
                },
                {
                    id: "over18",
                    label: "Over 18?",
                    type: "checkbox",
                    initialValue: "true"
                },
                {
                    id: "bio",
                    label: "Biography",
                    type: "textarea",
                    initialValue: "this is weird\nblahblah",
                    properties: {
                        rows: "4",
                        columns: "10"
                    }
                },
                {
                    id: "gender",
                    label: "Gender",
                    type: "radio",
                    initialValue: "male",
                    properties: {
                        options: [
                            "male", "female", "other"
                        ]
                    }
                },
                {
                    id: "favparent",
                    label: "Favorite Parent",
                    type: "select",
                    initialValue: "mom",
                    properties: {
                        options: [
                           "mom", "dad"
                        ]
                    }
                },
                {
                    id: "religion",
                    label: "Religion",
                    type: "combo",
                    initialValue: "Pastafarian",
                    properties: {
                        options: [
                           "Jedi", "Pastafarian"
                        ]
                    }
                },
                {
                    id: "favoriteLanguage",
                    label: "Favorite Programming Language",
                    type: "combo",
                    initialValue: "Java",
                    optionProvider: (parameters:any) => {
                        let ret = [];
                        // pull from a model
                        ret.push("Perl");
                        ret.push("Java");
                        ret.push("Brainfuck");
                        return ret;
                    }
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
          }
        ]
    };
    const wiz: WebviewWizard = new WebviewWizard("sample3", "sample3", context, def, 
            new Map<string,string>());
    return wiz;
  }


  export function getThreePageBranchWorkflowSampleWizardWithValidation(context: vscode.ExtensionContext) : WebviewWizard {

    let def : WizardDefinition = {
        title: "Sample Wizard", 
        description: "A wizard to sample - description",
        pages: [
          {
              title: "Page 1",
              description: "Age Page",
              fields: [
                  {
                      id: "age",
                      label: "Age",
                      type: "textbox"
                  }
              ],
              validator: (parameters:any) => {
                  let templates = [];
                  const age : Number = Number(parameters.age);
                  if( age <= 3) {
                      templates.push({ id: "ageValidation", 
                      content: "No babies allowed"});
                  }
                  return templates;
              }
            }, 
            {
              title: "Page 2",
              description: "Adult Page",
              fields: [
                  {
                      id: "cc",
                      label: "Credit Card Number",
                      type: "textbox"
                  }
              ]
            }, 
            {
              title: "Page 3",
              description: "Child Page",
              fields: [
                  {
                      id: "favcolor",
                      label: "Favorite Color",
                      type: "textbox"
                  }
              ]
            }
          ],
          workflowManager: {
            canFinish(wizard:WebviewWizard, data: any): boolean {
                return data.age !== undefined && 
                (data.cc !== undefined || data.favcolor !== undefined);
            },
            performFinish(wizard:WebviewWizard, data: any): void {
                // Do something
                var age : Number = Number(data.age);
                if( age >= 18 ) {
                    vscode.window.showInformationMessage('Adult has cc number: ' + data.cc);
                } else {
                    vscode.window.showInformationMessage('Child has favorite color: ' + data.favcolor);
                }
            },
            getNextPage(page:IWizardPage, data: any): IWizardPage | null {
                if( page.getDescription() === 'Age Page') {
                    var age : Number = Number(data.age);
                    if( age >= 18 ) {
                        return page.getWizard().getPage('Page 2');
                    }
                    return page.getWizard().getPage('Page 3');
                }
                return null;
            },
            getPreviousPage(page:IWizardPage, data: any): IWizardPage | null {
                if( page.getDescription() === 'Age Page') {
                    return null;
                }
                return page.getWizard().getPage('Page 1');
            }
        }
    };
    const wiz: WebviewWizard = new WebviewWizard("sample1", "sample1", context, def, new Map<string,string>());
    return wiz;
}
