import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

// Deprecated
export type MessageHandler = (parameters?: any) => Promise<HandlerResponse>;

export type AsyncMessageCallback = (response: HandlerResponse) => Promise<void>;
export type AsyncMessageHandler = (callback: AsyncMessageCallback, parameters?: any) => Promise<void>;

export interface Template {
  id: string;
  content?: string;
  contentUrl?: string;
}

export interface MessageMapping {
  command: string;
  asyncHandler: AsyncMessageHandler;
  defaultTemplates?: Template[];
  defaultForward?: string;
}

export interface HandlerResponse {
  returnObject: any;
  templates?: Template[];
  delayedTemplates?: Promise<Template[]>[];
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
  focusedField?: string;
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

export function createOrShowWizard(
  id: string,
  viewType: string,
  title: string,
  context: vscode.ExtensionContext,
  messageMappings: MessageMapping[]) {

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
  messageMappings: MessageMapping[],
  rootPath: string,
  pagePath: string
) {
  const rootPathUri : vscode.Uri = vscode.Uri.file(rootPath);
  let panel = currentPanels.get(id);
  if (panel) {
    panel.reveal();
  } else {
    panel = vscode.window.createWebviewPanel(
      viewType,
      title,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          context.extensionUri,
          rootPathUri
        ],
      }
    );
    const pagesWebviewUri : vscode.Uri = panel.webview.asWebviewUri(rootPathUri);
    const contents: string = fs.readFileSync(pagePath, 'utf-8');
    const contentsReplaced = contents.split("{{base}}").join(pagesWebviewUri.toString());
    panel.webview.html = contentsReplaced;
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
  messageMappings: MessageMapping[],
  currentPanelName: string,
  resourceRoot: string
) {
  const handler = (message: any) => {
    const mapping = messageMappings.find(
      mapping => mapping.command === message.command
    );
    if (mapping) {
      const callback: AsyncMessageCallback = async (result: HandlerResponse): Promise<void> => {
        if (!result) {
          return;
        }
        const forward: string | undefined = (result.forward === null ? mapping.defaultForward : result.forward);
        if( forward ) {
          return handler.call(null, {
            command: forward,
            parameters: result,
          });
        } else {
          postMessageHandlerResponse(mapping, result, currentPanelName, resourceRoot);
        }
      };
      mapping.asyncHandler.call(null, callback, message.parameters);
    } else {
      vscode.window.showErrorMessage(
        `Can not find a handler for ${message.command}.`
      );
    }
  };
  return handler;
}

const postMessageHandlerResponse = async (mapping: MessageMapping, 
  result: HandlerResponse,
  currentPanelName: string,
  resourceRoot: string
) => { 
  const resp: CommandResponse = generatePostResponseFromHandlerResponse(mapping, result, resourceRoot);
  sendMessageToWebview(resp, currentPanelName);
}

const sendMessageToWebview = (resp: CommandResponse, currentPanelName: string): void => {
  const panel: vscode.WebviewPanel | undefined = currentPanels.get(currentPanelName);
  if (panel && panel !== undefined) {
    panel.webview.postMessage(resp);
  }
}

const generatePostResponseFromHandlerResponse = (
  mapping: MessageMapping, 
  result: HandlerResponse,
  resourceRoot: string
): CommandResponse => {

  const response: CommandResponse = {
    command: `${mapping.command}Response`,
  };
  const templates: Template[] | undefined = (result.templates === null ? mapping.defaultTemplates : result.templates);
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
  } else {
    response.result = result;
  }
  response.focusedField = result?.returnObject?.focusedField;
  return response;
}
