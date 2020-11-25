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

const currentPanels: Map<string, vscode.WebviewPanel> = new Map();

const initJS = `
function initEventListener(fn) {
  window.addEventListener('message', event => {
    const message = event.data;
    if (message.command.match(/Response$/) && message.contents) {
      message.contents.forEach(content => {
        let element = document.getElementById(content.id);
        element.innerHTML = content.body;
      });
    } else {
      if (fn) {
        fn(message);
      }
    }
  });
}
`;

export function createOrShowWizard(
  name: string,
  viewType: string,
  title: string,
  base: string,
  page: string,
  context: vscode.ExtensionContext,
  messageMappings: MesssageMapping[]
) {
  let panel = currentPanels.get(name);
  if (panel) {
    panel.reveal();
  } else {
    const rootString = path.join(context.extensionPath, base);
    const localResourceRoots = vscode.Uri.file(path.join(rootString, '/')).with(
      {
        scheme: 'vscode-resource',
      }
    );
    panel = vscode.window.createWebviewPanel(
      viewType,
      title,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [localResourceRoots],
      }
    );

    const pagePath = path.join(rootString, page);
    panel.webview.html = fs
      .readFileSync(pagePath, 'utf-8')
      .replace('{{base}}', localResourceRoots.toString())
      .replace('"{{init}}"', initJS);
    panel.webview.onDidReceiveMessage(
      createDispatch(messageMappings, panel, context)
    );
    panel.onDidDispose(
      () => currentPanels.delete(name),
      undefined,
      context.subscriptions
    );
    currentPanels.set(name, panel);
  }
}

function createDispatch(
  messageMappings: MesssageMapping[],
  currentPanel: vscode.WebviewPanel,
  context: vscode.ExtensionContext
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
        const templates: Template[] | undefined = (result.templates == null ? mapping.defaultTemplates : result.templates);
        const forward: string | undefined = (result.forward == null ? mapping.defaultForward : result.forward);

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
                      path.join(context.extensionPath, template.contentUrl)
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
        currentPanel.webview.postMessage(response);
      });
    } else {
      vscode.window.showErrorMessage(
        `Can not find a handler for ${message.command}.`
      );
    }
  };
  return handler;
}
