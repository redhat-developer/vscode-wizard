import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { MesssageMapping } from "./wizardpage";
import { createOrShowWizard } from "./wizardpage";


export function activate(context: vscode.ExtensionContext) {
  registerCommands(context);
}

export function deactivate() {}

const messageMappings: MesssageMapping[] = [
];

function registerCommands(context: vscode.ExtensionContext) {
  let homePage = vscode.commands.registerCommand("ext.home", async () => {
    createOrShowWizard(
      "name",
      "ext.home",
      "Sample Page",
      "pages",
      "stub.html",
      context,
      messageMappings
    );
  });

  context.subscriptions.push(homePage);
}