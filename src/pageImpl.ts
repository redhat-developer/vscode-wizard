import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

export type MessageHandler = (parameters?: any) => Promise<HandlerResponse>;

export interface Template {
  id: string;
  content?: string;
  contentUrl?: string;
}

export interface MesssageMapping {
  command: string;
  handler: MessageHandler;
  defaultTemplates?: Template[];
  defaultForward?: string;
}

export interface HandlerResponse {
  returnObject: any;
  templates?: Template[];
  forward?: string;
}

interface Content {
  id: string;
  body: string;
}

interface CommandResponse {
  command: string;
  contents?: Content[];
  result?: any;
}

export const currentPanels: Map<string, vscode.WebviewPanel> = new Map();

// data should be an object literal
export function sendInitialData(wizardName: string, data: Map<string, string>) {
  let panel = currentPanels.get(wizardName);
  if (panel) {
    const response: CommandResponse = {
      command: `InitializeData`,
    };
    let obj = Array.from(data).reduce((obj, [key, value]) => (
      Object.assign(obj, { [key]: value }) // Be careful! Maps can have non-String keys; object literals can't.
    ), {});
    response.result = obj;
    panel.webview.postMessage(response);
  }
}

export function disposeWizard(id: string) {
  let panel = currentPanels.get(id);
  if (panel) {
    currentPanels.delete(id);
    panel.dispose();
  }
}

export function asVSCodeResource(resource: string): vscode.Uri {
  return vscode.Uri.file(path.join(resource, '/')).with(
    {
      scheme: 'vscode-resource',
    }
  );
}

export function createOrShowWizard(
  id: string,
  viewType: string,
  title: string,
  context: vscode.ExtensionContext,
  messageMappings: MesssageMapping[]) {

  const pages: string = path.join(__dirname, "../", "pages").normalize();
  const html: string = path.join(pages, "stub.html");

  createOrShowWizardWithPaths(id, viewType, title, context, messageMappings, pages, html);
}

export function updatePanelTitle(
  name: string,
  title: string
) {
  let panel = currentPanels.get(name);
  if (panel) {
    panel.title = title;
  }
}

export function createOrShowWizardWithPaths(
  id: string,
  viewType: string,
  title: string,
  context: vscode.ExtensionContext,
  messageMappings: MesssageMapping[],
  rootPath: string,
  pagePath: string
) {
  let panel = currentPanels.get(id);
  if (panel) {
    panel.reveal();
  } else {
    const rootStringAsVSCodeUri: vscode.Uri = asVSCodeResource(rootPath);
    panel = vscode.window.createWebviewPanel(
      viewType,
      title,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [rootStringAsVSCodeUri],
      }
    );
    const contents: string = fs
      .readFileSync(pagePath, 'utf-8')
      .replace('{{base}}', rootStringAsVSCodeUri.toString());
    panel.webview.html = contents;
    panel.webview.onDidReceiveMessage(
      createDispatch(messageMappings, id, rootPath)
    );
    panel.onDidDispose(
      () => currentPanels.delete(id),
      undefined,
      context.subscriptions
    );
    currentPanels.set(id, panel);
  }
}

function createDispatch(
  messageMappings: MesssageMapping[],
  currentPanelName: string,
  resourceRoot: string
) {
  const handler = (message: any) => {
    const mapping = messageMappings.find(
      mapping => mapping.command === message.command
    );
    if (mapping) {
      const response: CommandResponse = {
        command: `${message.command}Response`,
      };
      mapping.handler.call(null, message.parameters).then(result => {
        if (!result) {
          return;
        }
        const templates: Template[] | undefined = (result.templates === null ? mapping.defaultTemplates : result.templates);
        const forward: string | undefined = (result.forward === null ? mapping.defaultForward : result.forward);

        if (templates) {
          response.contents = [];
          templates.forEach(template => {
            if (template.content) {
              response.contents?.push({
                id: template.id,
                body: handlebars.compile(template.content)(result.returnObject),
              });
            } else if (template.contentUrl) {
              response.contents?.push({
                id: template.id,
                body: handlebars.compile(
                  fs
                    .readFileSync(
                      path.join(resourceRoot, template.contentUrl)
                    )
                    .toString()
                )(result),
              });
            }
          });
        } else if (forward) {
          return handler.call(null, {
            command: forward,
            parameters: result,
          });
        } else {
          response.result = result;
        }
        const panel: vscode.WebviewPanel | undefined = currentPanels.get(currentPanelName);
        if (panel && panel !== undefined) {
          panel.webview.postMessage(response);
        }
      });
    } else {
      vscode.window.showErrorMessage(
        `Can not find a handler for ${message.command}.`
      );
    }
  };
  return handler;
}
