# vscode-wizard
[![npm](https://img.shields.io/npm/v/@redhat-developer/vscode-wizard?color=brightgreen)](https://www.npmjs.com/package/@redhat-developer/vscode-wizard)
[![Code Style: Google](https://img.shields.io/badge/code%20style-google-blueviolet.svg)](https://github.com/google/gts)

vscode-wizard is an npm module to display wizards in webviews inside VS Code.  It is a fork and large expansion in the API of vscode-page, aiming to create wizards out of a javascript object definition that includes pages, fields, validators, and option providers for combos. See vscode-wizard for more information. 

This library provides an API to display wizards via Webviews in VSCode.

# How to use from a VS Code extension
See https://github.com/redhat-developer/vscode-wizard

# How it works
To open a webview wizard, you pass a WizardDefinition into a WebviewWizard constructor as follows:

```
    const wiz: WebviewWizard = new WebviewWizard(webviewTitle, webviewType, yourExtensionContext, definition, new Map<string,string>());
    wiz.open();
```

Behind the scenes, the stub html used in the webview sets up the message communication with the extension so the webview and your extension can communicate with each other. Each field that is displayed is given an invisible error / validation label beneath it in case errors must be displayed. When a field is modified, the new value to the field is stored in a map local to the webview, and then the entire data map of all current values is sent to the extension. The extension will investigate the map, validate the data, and update the button bar (back, next, finish) as appropriate. 

# The definition
A webview wizard definition includes a title, a description, an array of pages, and a workflow manager. 
```
    let def : WizardDefinition = {
        title: "Sample Wizard", 
        description: "A wizard to sample - description",
        pages: [etc], 
	workflowManager: { etc }
```
## Pages

A webview definition's page consists of a title, a description, an array of fields, and an optional validator. 

```
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
            }
         ]
```

### Page fields
A field consists of an id, a label, a type, an initial value, and some properties depending on the field type. Some field types (like types `combo` and `select`) allow for an optionsProvider callback function in case the options must be dynamically calculated. Currently supported types are `textbox`, `checkbox`, `textarea`, `radio`, `select`,  and `combo`. 

A `textarea` supports two properties: `rows` and `columns`. Types `radio`, `select`, and `combo` supports a property named `options` for including specific options that users can choose. 

### Page Validators

A page validator is a callback function that will return an array of error responses. Each error response includes an `id` and a `content`, where the `id` should be the name of the failing field with the `Validation` suffix, as shown below, and the `content` is the error message for display to the user. 

```
              validator: (parameters:any) => {
                  let templates = [];
                  const age : Number = Number(parameters.age);
                  if( age <= 3) {
                      templates.push({ id: "ageValidation", 
                      content: "No babies allowed"});
                  }
                  return templates;
              }

```

## Workflow manager

The optional workflow manager must be a javascript object implementing the `IWizardWorkflowManager` interface, which has the following list of functions:

```
    canFinish(wizard: WebviewWizard, data: any): boolean;
    performFinish(wizard: WebviewWizard, data: any): void;
    getNextPage?(page: IWizardPage, data: any): IWizardPage | null;
    getPreviousPage?(page: IWizardPage, data: any): IWizardPage | null;
    performCancel?(): void;
```

In this object, you can check the data currently in the webview map for completeness or errors in order to determine if the page is complete, if the wizard is complete, or what pages should be next based on the current selections.  Below is an example of a workflow manager in a three-page wizard, where the first page asks how old the user is, and, depending on the answer, either page 2 (favorite color) or page 3 (credit card number) is displayed. 

```
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
```
