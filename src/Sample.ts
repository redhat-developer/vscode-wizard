import * as vscode from 'vscode';
import { WebviewWizard, WizardDefinition, ValidatorResponseItem, SEVERITY, PerformFinishResponse, IWizardPage, FieldDefinitionState, BUTTONS, UPDATE_TITLE, StandardWizardPageRenderer, WizardPageFieldDefinition } from '.';
import { createButton } from './WebviewWizard';
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
            validator: (parameters:any) => {
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

  export function createValidationItem(sev: SEVERITY, id: string, content: string): ValidatorResponseItem {
    return {
        severity: sev,
        template: {
            id: id,
            content: content
        }
    };
  }

export function getSinglePageAllControlsDefinition(context: vscode.ExtensionContext) : WizardDefinition {
    let def : WizardDefinition = {
      title: "Control Demonstration Wizard", 
      description: "A wizard to demonstrate all the currently supported controls on one single page!",
      workflowManager: {
        canFinish(wizard:WebviewWizard, data: any): boolean {
            return true;
        },
        performFinish(wizard:WebviewWizard, data: any): Promise<PerformFinishResponse | null> {
            vscode.window.showInformationMessage(JSON.stringify(data));
            return new Promise<PerformFinishResponse | null>((res,rej) => {
                res(null);
            });
        },
        getNextPage(page:IWizardPage, data: any): IWizardPage | null {
            return null;
        },
        getPreviousPage(page:IWizardPage, data: any): IWizardPage | null {
            return null;
        }
      },
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
                    id: "addPassword",
                    label: "Password",
                    description: "Passwords should be easy to guess.",
                    type: "password",
                    initialValue: "hunter2"
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
                },
                {
                    id: "bestCryptos",
                    label: "Best Cryptocurrencies",
                    description: "Select the best cryptocurrencies out there right now",
                    type: "multiselect",
                    initialValue: "Sushi\nPickle",
                    optionProvider: (parameters:any) => {
                        let ret = [];
                        // pull from a model
                        ret.push("Pickle");
                        ret.push("BTC");
                        ret.push("Ethereum");
                        ret.push("Sushi");
                        ret.push("Alchemix");
                        ret.push("Popsicle");
                        ret.push("CRV");
                        return ret;
                    }
                },
                {
                    id: "someFilePicker",
                    label: "A File Picker:",
                    initialValue: "",
                    type: "file-picker",
                    placeholder: "Select file in PEM format.",
                    dialogOptions: {
                        canSelectMany: false,
                        filters: {
                            'All': ['*'],
                            'PEM': ['pem', 'crt', 'cer', 'key']
                        }
                    }
                },
            ],
            validator: (parameters:any) => {
                let items : ValidatorResponseItem[] = [];
                const username = parameters.addusername;
                const religion = parameters.religion;
                if( religion && typeof religion === 'string' && (religion as string).startsWith("satan")) {
                    items.push(createValidationItem(SEVERITY.ERROR, "religion", 
                    "No Satanists allowed!"));
                }
                if( username === 'Max') {
                    items.push(createValidationItem(SEVERITY.ERROR, "addusername", 
                    "Max is not allowed to use this wizard. Sorry Max!"));
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
          }
        ]
    };
    return def;
  }


  export function getSinglePageDependentControls(context: vscode.ExtensionContext) : WizardDefinition {
    let def : WizardDefinition = {
      title: "Dependent Controls Demonstration Wizard", 
      description: "A wizard to demonstrate dependent enablement / values",
      pages: [
        {
            id: 'page1',
            title: "Shiny Input Objects",
            description: "On this page, you can look at all the shiny input objects we support",
            fields: [
                {
                    id: "over18",
                    label: "Over 18?",
                    type: "checkbox",
                    description: "Is the user of legal age? This is important.",
                    initialValue: "true",
                    executableJavascriptOnModification: "if(!this.checked) {wizardMap.set('actualAge', 0);wizardMap.set('awesome', false);}; fieldChanged(this, this.checked)"
                },
                {
                    id: "actualAge",
                    label: "Age",
                    description: "How old are you really?!",
                    type: "number",
                    initialValue: "15"
                },
                {
                    id: "awesome",
                    label: "Are you awesome??",
                    type: "checkbox",
                    description: "Are you awesome?",
                    initialValue: "true",
                }
            ],
            validator: (parameters:any, previousParams: any) => {
                console.log("validating");
                if( parameters.over18 !== previousParams.over18) {
                    const m : Map<string,FieldDefinitionState> = new Map();
                    m.set("actualAge", {enabled: parameters.over18});
                    m.set("awesome", {enabled: parameters.over18});
                    return { items: [], fieldRefresh: m};
                }
                return { items: [], fieldRefresh: new Map() };
            },
          }
        ],
    };
    return def;
  }

  export function demonstrateSinglePageDependentControls(context: vscode.ExtensionContext) : WebviewWizard {
    let def : WizardDefinition = getSinglePageDependentControls(context);
    const wiz: WebviewWizard = new WebviewWizard("sample8", "sample8", context, def, 
            new Map<string,string>());
    return wiz;
  }


  export function demonstrateSinglePageAllControls(context: vscode.ExtensionContext) : WebviewWizard {
    let def : WizardDefinition = getSinglePageAllControlsDefinition(context);
    const wiz: WebviewWizard = new WebviewWizard("sample3", "sample3", context, def, 
            new Map<string,string>());
    return wiz;
  }

  export function getSinglePageFormCustomSaveDefinition(context: vscode.ExtensionContext) : WizardDefinition {
    let existingName : string = 'Bob';
    let def : WizardDefinition = {
        title: "Edit " + existingName + " cluster", 
        description: "A wizard to demonstrate a form page as envisioned by a user",
        pages: [
          {
              id: 'page1',
              hideWizardPageHeader: true,
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
              ],
              validator: (parameters:any) => {
                  let items : ValidatorResponseItem[] = [];
                  const username = parameters.addusername;
                  if( username === 'Max') {
                      items.push(createValidationItem(SEVERITY.ERROR, "addusername", 
                      "Max is not allowed to use this wizard. Sorry Max!"));
                  }
                  return { items: items };
              }
            }
          ],
          buttons: [{
            id: BUTTONS.FINISH,
            label: "Save"
          }],
          workflowManager: {
            canFinish(wizard:WebviewWizard, data: any): boolean {
                return data.addusername !== 'Max';
            },
            performFinish(wizard:WebviewWizard, data: any): Promise<PerformFinishResponse | null> {
                vscode.window.showInformationMessage('User ' + data.addusername + ' has been saved');
                let newTitle : string = "Edit " + data.addusername + " Cluster";
                return new Promise<PerformFinishResponse | null>((res,rej) => {
                    res({
                        close: false,
                        success: true,
                        returnObject: null,
                        templates: [
                            {id: UPDATE_TITLE, content: newTitle},
                        ]
                    });
                });
            },
            getNextPage(page:IWizardPage, data: any): IWizardPage | null {
                return null;
            },
            getPreviousPage(page:IWizardPage, data: any): IWizardPage | null {
                return null;
            }
          }
      };
      return def;
    }
    export function demonstrateSinglePageFormCustomSave(context: vscode.ExtensionContext) : WebviewWizard {
        let def: WizardDefinition = getSinglePageFormCustomSaveDefinition(context);
        def.showDirtyState = true;
        let data : Map<string,string> = new Map<string,string>();
        data.set("addusername", 'Bob');
        const wiz: WebviewWizard = new WebviewWizard("sample1", "sample1", context, def, data);
        return wiz;
    }

  export function demonstrateHiddenHeaders(context: vscode.ExtensionContext) : WebviewWizard {

    let def : WizardDefinition = {
        title: "Hidden Headers", 
        description: "This wizard demonstrates a branch workflow, with a different second page based on the answers on your first page!",
        hideWizardHeader: true,
        bannerIconString: "<img style=\"float: right;\" src=\"data:image/png;base64,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\">",
        pages: [
          {
              id: 'page1',
              title: "do not show",
              description: "do not show",
              hideWizardPageHeader: true,
              fields: [
                  {
                      id: "age",
                      label: "Age",
                      type: "textbox",
                      description: "Let us know how old you are!"
                  }
              ],
              validator: (parameters:any) => {
                  let items : ValidatorResponseItem[] = [];
                  const age : Number = Number(parameters.age);
                  if( !parameters.age || isNaN(parameters.age)) {
                    items.push(createValidationItem(SEVERITY.ERROR, "age", "Age must not be blank"));
                  } else if( age <= 3) {
                    items.push(createValidationItem(SEVERITY.ERROR, "age", "No babies allowed"));
                  }
                  return {items: items};
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
              title: "do not show",
              description: "do not show",
              hideWizardPageHeader: true,
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
                if( page.getId() === 'page1') {
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

  export function getThreePageBranchWorkflowSampleWizardWithValidation(context: vscode.ExtensionContext) : WebviewWizard {

    let def : WizardDefinition = {
        title: "Branch Workflow Wizard", 
        description: "This wizard demonstrates a branch workflow, with a different second page based on the answers on your first page!",
        bannerIconString: "<img style=\"float: right;\" src=\"data:image/png;base64,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\">",
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
                  let items: ValidatorResponseItem[] = [];
                  const age : Number = Number(parameters.age);
                  if( !parameters.age || isNaN(parameters.age)) {
                    items.push(createValidationItem(SEVERITY.ERROR, "age", "Age must not be blank"));
                  } else if( age <= 3) {
                    items.push(createValidationItem(SEVERITY.ERROR, "age", "No babies allowed"));
                  }
                  return {items: items};
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
                if( page.getId() === 'page1') {
                    return null;
                }
                const tmp = page.getWizard();
                return tmp === null ? null : tmp.getPage('page1');
            }
        }, 
        buttons: [
            //{id: BUTTONS.PREVIOUS, label: "Go back!"},
            {id: BUTTONS.NEXT, label: "Go forward!"},
            {id: BUTTONS.FINISH, label: "We done here"},
        ]
    };
    const wiz: WebviewWizard = new WebviewWizard("sample1", "sample1", context, def, new Map<string,string>());
    return wiz;
}



export function demonstrateCustomRenderer(context: vscode.ExtensionContext) : WebviewWizard {

    let def : WizardDefinition = {
        title: "Custom Renderer", 
        description: "Example of a custom widget",
        hideWizardHeader: true,
        pages: [
          {
              id: 'page1',
              hideWizardPageHeader: true,
              fields: [
                {
                    id: "age",
                    label: "Age",
                    type: "textbox",
                    description: "Let us know how old you are!"
                },
                {
                    id: "weird",
                    label: "Weird Widget",
                    type: "weirdwidget",
                    description: "Draw a weird widget!"
                },
              
              ],
              validator: (parameters:any) => {
                  let items : ValidatorResponseItem[] = [];
                  const age : Number = Number(parameters.age);
                  if( !parameters.age || isNaN(parameters.age)) {
                    items.push(createValidationItem(SEVERITY.ERROR, "age", "Age must not be blank"));
                  } else if( age <= 3) {
                    items.push(createValidationItem(SEVERITY.ERROR, "age", "No babies allowed"));
                  }
                  return {items: items};
              }
            }
          ],
          renderer: new class extends StandardWizardPageRenderer {
              constructor() {
                super(new Map<string,FieldDefinitionState>());
              }
              createHTMLField(field: WizardPageFieldDefinition, data: any): string {
                  if( field.type === 'weirdwidget') {
                    return this.wrapHTMLField(field, false, createButton(undefined, `this.innerHTML=(this.innerHTML === 'Press Me' ? 'Stop poking me!' : 'Press Me');`, true, "Press Me"));
                  } else {
                      return super.createHTMLField(field, data);
                  }
              }
          }(),
          workflowManager: {
            canFinish(wizard:WebviewWizard, data: any): boolean {
                return data.age !== undefined;
            },
            performFinish(wizard:WebviewWizard, data: any): Promise<PerformFinishResponse | null> {
                // Do something
                var age : Number = Number(data.age);
                if( age >= 18 ) {
                    vscode.window.showInformationMessage('Adult');
                } else {
                    vscode.window.showInformationMessage('Child');
                }
                return new Promise<PerformFinishResponse | null>((res,rej) => {
                    res(null);
                });
            },
            getNextPage(page:IWizardPage, data: any): IWizardPage | null {
                return null;
            },
            getPreviousPage(page:IWizardPage, data: any): IWizardPage | null {
                return null;
            }
        }
    };
    const wiz: WebviewWizard = new WebviewWizard("sample1", "sample1", context, def, new Map<string,string>());
    return wiz;
  }
