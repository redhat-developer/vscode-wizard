import { Wizard } from './Wizard';
import { IWizard } from './IWizard';
import { IWizardPage } from './IWizardPage';
import * as vscode from 'vscode';
import { MesssageMapping, Template, HandlerResponse, AsyncMessageCallback } from "./pageImpl";
import { createOrShowWizard, disposeWizard, sendInitialData, updatePanelTitle } from "./pageImpl";
import { WebviewWizardPage } from './WebviewWizardPage';
import { IWizardWorkflowManager, PerformFinishResponse } from './IWizardWorkflowManager';
import { IWizardPageRenderer } from './IWizardPageRenderer';

export class WebviewWizard extends Wizard implements IWizard {
  context: vscode.ExtensionContext;
  readyMapping: MesssageMapping;
  backPressedMapping: MesssageMapping;
  nextPressedMapping: MesssageMapping;
  finishPressedMapping: MesssageMapping;
  openFileDialogMapping: MesssageMapping;
  validateMapping: MesssageMapping;
  currentPage: IWizardPage | null = null;
  previousParameters: any = {};
  id: string;
  type: string;
  title: string;
  imageString: string | undefined;
  description: string | undefined;
  definition: WizardDefinition;
  initialData: Map<string, string>;
  isDirty: boolean = false;

  constructor(id: string, type: string, context2: vscode.ExtensionContext,
    definition: WizardDefinition, initialData: Map<string, string>) {
    super();
    this.initialData = initialData;
    this.definition = definition;
    this.id = id;
    this.imageString = definition.bannerIconString;
    this.type = type;
    this.title = definition.title;
    this.description = definition.description;

    this.context = context2;
    this.readyMapping = {
      command: "ready",
      asyncHandler: async (callback: AsyncMessageCallback, parameters: any): Promise<void> => {
        // Get templates for the first page content and validation result
        const templates: Template[] = await this.getShowCurrentPageTemplates(parameters);
        callback.call(null, this.templatesToHandlerResponse(templates, true));

        const validationTemplates = await this.createValidationTemplates(parameters);
        callback.call(null, this.templatesToHandlerResponse(validationTemplates, false));
      }
    };

    this.nextPressedMapping = {
      command: "nextPressed",
      asyncHandler: async (callback: AsyncMessageCallback, parameters: any): Promise<void> => {
        this.nextImpl(callback, parameters);
      }
    };

    this.backPressedMapping = {
      command: "backPressed",
      asyncHandler: async (callback: AsyncMessageCallback, parameters: any): Promise<void> => {
        this.backImpl(callback, parameters);
      }
    };

    this.finishPressedMapping = {
      command: "finishPressed",
      asyncHandler: async (callback: AsyncMessageCallback, parameters: any): Promise<void> => {
        callback.call(null, await this.finishImpl(parameters));
      }
    };

    this.openFileDialogMapping = {
      command: "openFileDialog",
      asyncHandler: async (callback: AsyncMessageCallback, parameters: any): Promise<void> => {
        callback.call(null, await this.openFileDialogMappingImpl(parameters));
      }
    }

    this.validateMapping = {
      command: "validate",
      asyncHandler: async (callback: AsyncMessageCallback, parameters: any): Promise<void> => {
        if (!this.isDirty) {
          this.isDirty = true;
          this.updateWizardPanelTitle();
        }
        const validationTemplates = await this.createValidationTemplates(parameters);
        callback.call(null, this.templatesToHandlerResponse(validationTemplates, false));
      }
    };
  }

  private async createValidationTemplates(parameters: any): Promise<Template[]> {
    const validations: Template[] = await this.generateValidationTemplates(parameters);
    const content = await this.getUpdatedWizardControls(parameters, false);
    validations.push({ id: "wizardControls", content: content });
    this.previousParameters = parameters;
    return validations;
  }

  canFinishInternal(parameters: any): boolean {
    var ret: boolean;
    if (this.definition.workflowManager === undefined || this.definition.workflowManager.canFinish === undefined) {
      ret = super.canFinish();
    } else {
      ret = this.definition.workflowManager.canFinish(this, parameters !== undefined ? parameters : {});
    }
    return ret;
  }

  getActualPreviousPage(data: any): IWizardPage | null {
    let previousPage: IWizardPage | null = null;
    if (this.currentPage === null) {
      previousPage = this.getStartingPage();
    } else if (this.definition.workflowManager !== undefined
      && this.definition.workflowManager.getPreviousPage) {
      previousPage = this.definition.workflowManager.getPreviousPage(
        this.currentPage, data === undefined ? {} : data);
    } else {
      previousPage = this.getPreviousPage(this.currentPage);
    }
    return previousPage;
  }
  getActualNextPage(data: any): IWizardPage | null {
    let nextPage: IWizardPage | null = null;
    if (this.currentPage === null) {
      nextPage = this.getStartingPage();
    } else if (this.definition.workflowManager !== undefined
      && this.definition.workflowManager.getNextPage) {
      nextPage = this.definition.workflowManager.getNextPage(
        this.currentPage, data === undefined ? {} : data);
    } else {
      nextPage = this.getNextPage(this.currentPage);
    }
    return nextPage;
  }

  async backImpl(callback: AsyncMessageCallback, parameters: any): Promise<void> {
    this.currentPage = this.getActualPreviousPage(parameters);
    // Get templates for the previous page content and validation result
    const templates: Template[] = await this.getShowCurrentPageTemplates(parameters);
    callback.call(null, this.templatesToHandlerResponse(templates, true));

    const validationTemplates = await this.createValidationTemplates(parameters);
    callback.call(null, this.templatesToHandlerResponse(validationTemplates, false));
  }

  templatesToHandlerResponse(templates: Template[], focus: boolean): HandlerResponse {
    const retObj: any = {};
    if( focus ) {
      retObj["focusedField"] = this.currentPage?.getFocusedField();
    }
    const ret: HandlerResponse = {
      returnObject: retObj,
      templates: templates
    };
    return ret;
  }

  async nextImpl(callback: AsyncMessageCallback, parameters: any): Promise<void> {
    let nextPage: IWizardPage | null = this.getActualNextPage(parameters);
    this.currentPage = nextPage;
    // Get templates for the next page content and validation result
    const templates: Template[] = await this.getShowCurrentPageTemplates(parameters);
    callback.call(null, this.templatesToHandlerResponse(templates, true));

    const validationTemplates = await this.createValidationTemplates(parameters);
    callback.call(null, this.templatesToHandlerResponse(validationTemplates, false));
  }

  async finishImpl(data: any): Promise<HandlerResponse> {
    let resp: PerformFinishResponse | null = null;
    if (this.definition.workflowManager !== undefined) {
      resp = await this.definition.workflowManager.performFinish(this, data);
    }
    if (resp == null) {
      this.close();
      return {
        returnObject: {},
        templates: []
      };
    } else {
      if (resp.close) {
        this.close();
      }
      if (resp.success) {
        this.isDirty = false;
      }
      const templatesToReturn = [];
      for (const oneTemplate of resp.templates) {
        if (oneTemplate.id === UPDATE_TITLE && oneTemplate.content !== undefined) {
          this.title = oneTemplate.content;
        }
        templatesToReturn.push(oneTemplate);
      }

      // Handle title changes
      this.updateWizardPanelTitle();

      return {
        returnObject: resp.returnObject,
        templates: templatesToReturn
      };
    }
  }

  async openFileDialogMappingImpl(data: any): Promise<HandlerResponse> {
    const options = <vscode.OpenDialogOptions>data.options;
    const result = await vscode.window.showOpenDialog(options);
    return {
      returnObject: {
        fieldId: data.fieldId,
        fsPath: result && result[0]?.fsPath
      }
    }
  }

  updateWizardPanelTitle() {
    const dirty = this.showDirtyState(this.definition);
    updatePanelTitle(this.id, this.title + (dirty ? " ●" : ""));
  }
  close(): void {
    disposeWizard(this.id);
  }

  async getShowCurrentPageTemplates(parameters: any): Promise<Template[]> {
    let ret: Template[] = [];
    if (this.definition.hideWizardHeader === true) {
      ret.push({ id: "wizardHeader", content: "&nbsp;" });
    } else {
      ret.push({ id: "wizardHeader", content: this.getDefaultWizardHeader() });
      ret.push({ id: "wizardTitle", content: this.title });
      ret.push({ id: "wizardDescription", content: this.description === undefined ? "" : this.description });
      if (this.imageString !== undefined) {
        ret.push({ id: "wizardBanner", content: this.imageString })
      }
    }

    if (this.getCurrentPage() !== null) {
      let pageDef: WizardPageDefinition | undefined = this.getCurrentPage()?.getPageDefinition();
      if (pageDef?.hideWizardPageHeader === true) {
        ret.push({ id: "wizardPageHeader", content: "&nbsp;" });
      } else {
        ret.push({ id: "wizardPageHeader", content: this.getDefaultWizardPageHeader() });
        ret.push({ id: "pageTitle", content: this.getCurrentPageName() });
        ret.push({ id: "pageDescription", content: this.getCurrentPageDescription() === undefined ? "" : this.getCurrentPageDescription() });
      }
    }

    ret.push({ id: "content", content: this.getCurrentPageContent(parameters) });
    ret.push({ id: "wizardControls", content: await this.getUpdatedWizardControls(parameters, true) });
    return ret;
  }

  getDefaultWizardHeader(): string {
    return '<div id="wizardBanner"></div>\n' +
      '<h2 id="wizardTitle" class="section__title section__title--primary"></h2>\n' +
      '<p id="wizardDescription" class="blurb ml-0 mr-0"></p>\n';
  }
  getDefaultWizardPageHeader(): string {
    return '<h2 id="pageTitle" class="section__title section__title--primary"></h2>\n' +
      '<p id="pageDescription" class="blurb ml-0 mr-0"></p>\n' +
      '<hr />\n';
  }

  async generateValidationTemplates(parameters: any): Promise<Template[]> {
    return this.getCurrentPage() !== null ? this.getCurrentPage()!.getValidationTemplates(parameters, this.previousParameters) : [];
  }

  async validateAndUpdatePageComplete(parameters: any) {
    const cp = this.getCurrentPage();
    if( cp)
      cp.validateAndUpdatePageComplete(parameters, this.previousParameters);
  }

  getCurrentPageName(): string | undefined {
    return (this.currentPage === null ? "" : this.currentPage.getName());
  }
  getCurrentPageId(): string {
    return (this.currentPage === null ? "" : this.currentPage.getId());
  }

  getCurrentPageDescription(): string | undefined {
    return (this.currentPage === null ? "" : this.currentPage.getDescription());
  }

  getCurrentPageContent(parameters: any): string {
    const page: WebviewWizardPage | null = this.getCurrentPage();
    if (page === null) { return ""; }
    return page.getContentAsHTML(parameters);
  }

  getCurrentPage(): WebviewWizardPage | null {
    const cur: IWizardPage | null = super.getPage(this.getCurrentPageId());
    if (cur instanceof WebviewWizardPage) { return cur; }
    return null;
  }

  open(): void {
    super.open();
    this.currentPage = this.getStartingPage();
    createOrShowWizard(
      this.id,
      this.type,
      this.title,
      this.context,
      [this.readyMapping, this.validateMapping, this.backPressedMapping,
      this.nextPressedMapping, this.finishPressedMapping, this.openFileDialogMapping]
    );

    // organize initial data
    const fieldsData = new Map<string, string>();
    for (const page of this.definition.pages) {
      page.fields.forEach(definition => {
        if (isWizardPageSectionDefinition(definition)) {
          for (const child of definition.childFields) {
            if (child.initialValue != undefined) {
              fieldsData.set(child.id, child.initialValue);
            }
          }
        } else if (isWizardPageFieldDefinition(definition)) {
          if (definition.initialValue != undefined) {
            fieldsData.set(definition.id, definition.initialValue);
          }
        }
      });
    }
    sendInitialData(this.id, new Map([...fieldsData, ...this.initialData]));
  }
  addPages(): void {
    for (let d of this.definition.pages) {
      let page: WebviewWizardPage = new WebviewWizardPage(d, this.definition);
      page.setWizard(this);
      this.addPage(page);
    }
  }

  async getUpdatedWizardControls(parameters: any, validate: boolean): Promise<string> {
    if (validate) {
      // Don't care about return value here, just want pageComplete to be set
      await this.validateAndUpdatePageComplete(parameters);
    }
    return this.getUpdatedWizardControlsSynchronous(parameters);
  }

  getUpdatedWizardControlsSynchronous(parameters: any): string {
    let hasPrevious = (this.currentPage !== null &&
      this.getActualPreviousPage(this.currentPage) !== null);

    let hasNext = (this.currentPage !== null && this.currentPage.isPageComplete() &&
      this.getActualNextPage(parameters) !== null);
    let canFinishNow: boolean = this.currentPage !== null && this.currentPage.isPageComplete() && this.canFinishInternal(parameters);

    let ret: string = "";
    if (this.definition.buttons) {
      for (let button of this.definition.buttons) {
        if (button.id == BUTTONS.PREVIOUS) {
          ret = ret + createButton("buttonBack", "backPressed()", hasPrevious, button.label);
        }
        if (button.id == BUTTONS.NEXT) {
          ret = ret + createButton("buttonNext", "nextPressed()", hasNext, button.label)
        }
        if (button.id == BUTTONS.FINISH) {
          ret = ret + createButton("buttonFinish", "finishPressed()", canFinishNow, button.label);
        }
      }
    } else {
      ret = createButton("buttonBack", "backPressed()", hasPrevious, "Back") +
        createButton("buttonNext", "nextPressed()", hasNext, "Next") +
        createButton("buttonFinish", "finishPressed()", canFinishNow, "Finish");
    }
    return ret;
  }


  showDirtyState(def: WizardDefinition): boolean {
    return def.showDirtyState !== undefined && def.showDirtyState && this.isDirty;
  }
}

export function createButton(id: string | undefined, onclick: string | undefined, enabled: boolean, text: string): string {
  return `<button type="button"
                  class="vscode-button"
                  ${id ? `id="${id}"` : ""}
                  ${onclick ? `onclick="${onclick}"` : ""}
                  ${enabled ? "" : " disabled"}>${text}</button>
          `
}
export type WizardPageValidator = (parameters: any, previousParameters?: any) => ValidatorResponse;
export type AsyncWizardPageValidator = (parameters: any, previousParameters: any) => Promise<ValidatorResponse>[];
export type WizardPageFieldOptionProvider = (parameters?: any) => string[];

export interface WizardPageFieldOptionLabelProvider {
  getItems(parameters?: any): any;
  getValueItem?(item: any): string;
  getLabelItem(item: any): string;
};

export const UPDATE_TITLE: string = "vscode-wizard/updateWizardTitle";

export enum SEVERITY {
  OTHER = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4
}

export enum BUTTONS {
  PREVIOUS = 1,
  NEXT = 2,
  FINISH = 3,
}

export interface ButtonItem {
  id: BUTTONS,
  label: string
}

export interface ValidatorResponseItem {
  template: Template;
  severity: SEVERITY
}

export interface ValidatorResponse {
  items: ValidatorResponseItem[],
  fieldRefresh?: Map<string, FieldDefinitionState>;
}

export interface CompoundValidatorResponse {
  syncResponse: ValidatorResponse,
  asyncResponses: Promise<ValidatorResponse>[];
}

export interface WizardDefinition {
  title: string;
  description?: string;
  bannerIconString?: string;
  hideWizardHeader?: boolean;
  pages: WizardPageDefinition[];
  workflowManager?: IWizardWorkflowManager;
  renderer?: IWizardPageRenderer;
  buttons?: ButtonItem[],
  showDirtyState?: boolean
}

export interface WizardPageDefinition {
  id: string;
  title?: string;
  description?: string;
  hideWizardPageHeader?: boolean;
  fields: (WizardPageFieldDefinition | WizardPageSectionDefinition)[];
  validator?: WizardPageValidator;
  asyncValidator?: AsyncWizardPageValidator;
}

export interface WizardPageSectionDefinition {
  id: string;
  label: string;
  description?: string;
  childFields: WizardPageFieldDefinition[]
}

export function isWizardPageSectionDefinition(def: WizardPageFieldDefinition | WizardPageSectionDefinition): def is WizardPageSectionDefinition {
  return (def as any).childFields !== undefined
}

export function isWizardPageFieldDefinition(def: WizardPageFieldDefinition | WizardPageSectionDefinition): def is WizardPageFieldDefinition {
  return (def as any).type !== undefined
}

export interface WizardPageFieldDefinition {
  id: string;
  type: string;
  label: string;
  description?: string;
  initialValue?: string;
  placeholder?: string,
  // focus:  true if the field must got the focus and false otherwise.
  focus?: boolean,
  // executableJavascriptOnModification:  this name is intentionally long so as to avoid confusion
  executableJavascriptOnModification?: string;
  properties?: any;
  optionProvider?: WizardPageFieldOptionProvider | WizardPageFieldOptionLabelProvider;
  dialogOptions?: vscode.OpenDialogOptions;
  initialState?: FieldDefinitionState;
}

export interface FieldDefinitionState {
  enabled?: boolean,
  visible?: boolean
}
