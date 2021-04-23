import * as vscode from 'vscode';
import { WebviewWizard, WizardDefinition } from './WebviewWizard';
import { IWizardPage } from './IWizardPage';
import { PerformFinishResponse } from './IWizardWorkflowManager';
import { Template } from './pageImpl';

export function getTwoPageLinearSampleWizardWithValidation(context: vscode.ExtensionContext) : WebviewWizard {
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
                let errors: Template[] = [];
                let info: Template[] = [];

                const username = parameters.addusername;
                if( username === 'Max') {
                    errors.push({ id: "addusernameValidation", 
                    content: "Max is not allowed to use this wizard. Sorry Max!"});
                }
                if( username === 'El Jefe') {
                    info.push({ id: "addusernameValidation", 
                    content: "I am overjoyed to see my overlord, El Jefe, long may he reign!"});
                }
                return {
                    errors: errors,
                    infos: info
                };
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
            validator: (parameters:any) => {
                let templates = [];
                const color = parameters.favcolor;
                if( color === null || color === undefined || color === "") {
                    templates.push({ id: "favcolorValidation", 
                    content: "Favorite Color must not be empty."});
                }
                return {errors: templates};
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
      title: "Control Demonstration Wizard", 
      description: "A wizard to demonstrate all the currently supported controls on one single page!",
      pages: [
        {
            id: 'page1',
            title: "Shiny Input Objects",
            description: "On this page, you can look at all the shiny input objects we support",
            fields: [
                {
                    id: "happyfuntimesection",
                    label: "Happy Fun Time",
                    description: "Happy Fun Time is where we go to pick the settings that spark joy for us!", 
                    childFields: [
                        {
                            id: "yourHappyTime",
                            label: "Your Happy Time",
                            description: "Where do you have your happy time?",
                            type: "textbox",
                            initialValue: "Cloud Kuku Land"
                        }
                    ]
                },
                {
                    id: "addusername",
                    label: "Username",
                    description: "Enter a valid username above",
                    type: "textbox",
                    initialValue: "Textbox initial value"
                },
                {
                    id: "addusernameNoDescNoInitialValue",
                    label: "Username No Desc No InitialValue",
                    type: "textbox",
                    placeholder: "Placeholder Text"
                },
                {
                    id: "over18",
                    label: "Over 18?",
                    type: "checkbox",
                    description: "Is the user of legal age? This is important.",
                    initialValue: "true"
                },
                {
                    id: "over18NoDesc",
                    label: "Over 18? No Desc",
                    type: "checkbox",
                    initialValue: "true"
                },
                {
                    id: "actualAge",
                    label: "Age",
                    description: "How old are you really?!",
                    type: "number",
                    initialValue: "15"
                },
                {
                    id: "bio",
                    label: "Biography",
                    type: "textarea",
                    description: "Tell us why you think you'd make a great lizard.",
                    initialValue: "I am a great lizard because I come from a family with a long history of being lizards.",
                    properties: {
                        rows: "4",
                        columns: "30"
                    }
                },
                {
                    id: "bioNoInitialValue",
                    label: "Biography",
                    type: "textarea",
                    description: "Tell us why you think you'd make a great lizard.",
                    placeholder: "List all your lizard qualities here",
                    properties: {
                        rows: "4",
                        columns: "30"
                    }
                },
                {
                    id: "gender",
                    label: "Gender",
                    type: "radio",
                    initialValue: "male",
                    description: "Tell us how you identify?",
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
                    description: "Who do you love more?",
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
                    description: "Which set of myths do you believe?",
                    properties: {
                        options: [
                           "Jedi", "Pastafarian"
                        ]
                    }
                },
                {
                    id: "favoriteLanguage",
                    label: "Favorite Programming Language",
                    description: "Which programming language sucks the least?",
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
                let errors: Template[] = [];
                let info: Template[] = [];

                const username = parameters.addusername;
                if( username === 'Max') {
                    errors.push({ id: "addusernameValidation", 
                    content: "Max is not allowed to use this wizard. Sorry Max!"});
                }
                if( username === 'El Jefe') {
                    info.push({ id: "addusernameValidation", 
                    content: "I am overjoyed to see my overlord, El Jefe, long may he reign!"});
                }
                return {
                    errors: errors,
                    infos: info
                };
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
        title: "Branch Workflow Wizard", 
        description: "This wizard demonstrates a branch workflow, with a different second page based on the answers on your first page!",
        pages: [
          {
              id: 'page1',
              title: "Age Guardian",
              description: "Tell us how old you are. If you're too young, you may get rejected. This is for YOUR protection (and to comply with record keeping laws for children)!",
              fields: [
                  {
                      id: "age",
                      label: "Age",
                      type: "textbox",
                      description: "Let us know how old you are!"
                  }
              ],
              validator: (parameters:any) => {
                  let templates = [];
                  const age : Number = Number(parameters.age);
                  if( age <= 3) {
                      templates.push({ id: "ageValidation", 
                      content: "No babies allowed"});
                  }
                  return {errors: templates};
              }
            }, 
            {
              id: 'page2adult',
              title: "Questions for Big Year Olds",
              description: "This is where all the big people get to answer big-year-old stuff.",
              fields: [
                  {
                      id: "cc",
                      label: "Credit Card Number",
                      type: "textbox"
                  }
              ]
            }, 
            {
              id: 'page2child',
              title: "Ask Kiddos Questions!",
              description: "Let's ask the kiddos some questions!",
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
            performFinish(wizard:WebviewWizard, data: any): Promise<PerformFinishResponse | null> {
                // Do something
                var age : Number = Number(data.age);
                if( age >= 18 ) {
                    vscode.window.showInformationMessage('Adult has cc number: ' + data.cc);
                } else {
                    vscode.window.showInformationMessage('Child has favorite color: ' + data.favcolor);
                }
                return new Promise<PerformFinishResponse | null>((res,rej) => {
                    res(null);
                });
            },
            getNextPage(page:IWizardPage, data: any): IWizardPage | null {
                if( page.getId() === 'page1') {
                    var age : Number = Number(data.age);
                    const tmp = page.getWizard();
                    if( age >= 18 ) {
                        return tmp === null ? null : tmp.getPage('page2adult');
                    }
                    return tmp === null ? null : tmp.getPage('page2child');
                }
                return null;
            },
            getPreviousPage(page:IWizardPage, data: any): IWizardPage | null {
                if( page.getDescription() === 'page1') {
                    return null;
                }
                const tmp = page.getWizard();
                return tmp === null ? null : tmp.getPage('page1');
            }
        }
    };
    const wiz: WebviewWizard = new WebviewWizard("sample1", "sample1", context, def, new Map<string,string>());
    return wiz;
}
