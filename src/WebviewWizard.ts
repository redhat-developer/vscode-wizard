import { Wizard } from './Wizard';
import { IWizard } from './IWizard';
import { IWizardPage } from './IWizardPage';
import * as vscode from 'vscode';
import { MesssageMapping, Template, HandlerResponse } from "./pageImpl";
import { createOrShowWizard, disposeWizard, sendInitialData, updatePanelTitle} from "./pageImpl";
import { WebviewWizardPage } from './WebviewWizardPage';
import { IWizardWorkflowManager, PerformFinishResponse } from './IWizardWorkflowManager';
import { IWizardPageRenderer } from './IWizardPageRenderer';
import { templates } from 'handlebars';

export class WebviewWizard extends Wizard implements IWizard {
    context:  vscode.ExtensionContext;
    readyMapping : MesssageMapping;
    backPressedMapping : MesssageMapping;
    nextPressedMapping : MesssageMapping;
    finishPressedMapping : MesssageMapping;

    validateMapping : MesssageMapping;
    currentPage: IWizardPage | null = null;
    id: string;
    type: string;
    title: string;
    imageString: string | undefined;
    description: string | undefined;
    definition: WizardDefinition;
    initialData: Map<string, string>;
    isDirty: boolean = false;

    constructor(id: string, type: string, context2:  vscode.ExtensionContext,
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
            handler: async (parameters:any) => {
                return {
                    returnObject: {
                    },
                    templates: this.getShowCurrentPageTemplates(initialData)
                };
            }
        };

        this.nextPressedMapping = {
            command: "nextPressed",
            handler: async (parameters:any) => {
                return this.nextImpl(parameters);
            }
        };

        this.backPressedMapping = {
            command: "backPressed",
            handler: async (parameters:any) => {
                return this.backImpl(parameters);
            }
        };

        this.finishPressedMapping = {
            command: "finishPressed",
            handler: async (parameters:any) => {
                console.log(parameters);
                return this.finishImpl(parameters);
            }
        };

        this.validateMapping = {
            command: "validate",
            handler: async (parameters:any) => {
                if( !this.isDirty ) {
                    this.isDirty = true;
                    this.updateWizardPanelTitle(this.id, this.title, this.isDirty);
                }

                const validations = this.generateValidationTemplates(parameters);
                validations.push(
                    { id: "wizardControls", content: this.getUpdatedWizardControls(parameters, false)});
                return {
                    returnObject: {},
                    templates: validations
                };
            }
        };
    }

    canFinishInternal(parameters: any): boolean {
        var ret : boolean;
        if( this.definition.workflowManager === undefined || this.definition.workflowManager.canFinish === undefined) {
            ret = super.canFinish();
        } else {
            ret = this.definition.workflowManager.canFinish(this, parameters !== undefined ? parameters : {});
        }
        return ret;
    }

    getActualPreviousPage(data: any) : IWizardPage | null {
        let previousPage : IWizardPage | null = null;
        if( this.currentPage === null ) {
            previousPage = this.getStartingPage();
        } else if( this.definition.workflowManager !== undefined 
            && this.definition.workflowManager.getPreviousPage) {
                previousPage = this.definition.workflowManager.getPreviousPage(
                    this.currentPage, data === undefined ? {} : data);
        } else {
            previousPage = this.getPreviousPage(this.currentPage);
        }
        return previousPage;
    }
    getActualNextPage(data: any) : IWizardPage | null {
        let nextPage : IWizardPage | null = null;
        if( this.currentPage === null ) {
            nextPage = this.getStartingPage();
        } else if( this.definition.workflowManager !== undefined 
            && this.definition.workflowManager.getNextPage) {
                nextPage = this.definition.workflowManager.getNextPage(
                    this.currentPage, data === undefined ? {} : data);
        } else {
            nextPage = this.getNextPage(this.currentPage);
        }
        return nextPage;
    }

    backImpl(data: any) : HandlerResponse {
        this.currentPage = this.getActualPreviousPage(data);
        return {
            returnObject: {},
            templates: this.getShowCurrentPageTemplates(data)
        };
    }

    nextImpl(data: any) : HandlerResponse {
        let nextPage : IWizardPage | null = this.getActualNextPage(data);
        this.currentPage = nextPage;
        return {
            returnObject: {},
            templates: this.getShowCurrentPageTemplates(data)
        };
    }

    async finishImpl(data: any) : Promise<HandlerResponse> {
        let resp : PerformFinishResponse | null = null;
        if( this.definition.workflowManager !== undefined ) {
            resp = await this.definition.workflowManager.performFinish(this, data);
        }
        if( resp == null ) {
            this.close();
            return {
                returnObject: {},
                templates: []
            };
        } else {
            if( resp.close ) {
                this.close();
            }
            if( resp.success ) {
                this.isDirty = false;
            }
            let templatesToReturn = [];
            for( let oneTemplate of resp.templates ) {
                if( oneTemplate.id === UPDATE_TITLE && oneTemplate.content !== undefined) {
                    templatesToReturn.push({id: 'wizardTitle', content: this.title});
                } else {
                    templatesToReturn.push(oneTemplate);
                }
            }

            // Handle title changes
            this.updateWizardPanelTitle(this.id, this.title, this.isDirty);

            return {
                returnObject: resp.returnObject,
                templates: templatesToReturn
            };
        }
    }

    updateWizardPanelTitle(id: string, title: string, dirty: boolean) {
        updatePanelTitle(this.id, this.title + (dirty ? " ●" : ""));
    }
    close(): void {
        disposeWizard(this.id);
    }

    getShowCurrentPageTemplates(parameters: any) : Template[] {
        let ret: Template[] = [];
        if( this.definition.hideWizardHeader === true ) {
            ret.push({ id: "wizardHeader", content: ""});
        } else {
            ret.push({ id: "wizardHeader", content: this.getDefaultWizardHeader()});
            ret.push({ id: "wizardTitle", content: this.title});
            ret.push({ id: "wizardDescription", content: this.description === undefined ? "" : this.description});
            if( this.imageString !== undefined ) {
                ret.push({id: "wizardBanner", content: this.imageString})
            }
        }

        if( this.getCurrentPage() !== null ) {
            let pageDef : WizardPageDefinition | undefined = this.getCurrentPage()?.getPageDefinition();
            if( pageDef?.hideWizardPageHeader === true ) {
                ret.push({ id: "wizardPageHeader", content: "&nbsp;"});
            } else {
                ret.push({ id: "wizardPageHeader", content: this.getDefaultWizardPageHeader()});
                ret.push({ id: "pageTitle", content: this.getCurrentPageName()});
                ret.push({ id: "pageDescription", content: this.getCurrentPageDescription() === undefined ? "" : this.getCurrentPageDescription()});
            }
        }

        ret.push({ id: "content", content: this.getCurrentPageContent(parameters)});
        ret.push({ id: "wizardControls", content: this.getUpdatedWizardControls(parameters, true)});
        return ret;
    }

    getDefaultWizardHeader() : string {
        return '<div id="wizardBanner"></div>\n' + 
                '<h2 id="wizardTitle" class="section__title section__title--primary"></h2>\n' + 
                '<p id="wizardDescription" class="blurb ml-0 mr-0"></p>\n';
    }
    getDefaultWizardPageHeader(): string {
        return '<h2 id="pageTitle" class="section__title section__title--primary"></h2>\n' + 
                '<p id="pageDescription" class="blurb ml-0 mr-0"></p>\n' + 
                '<hr />\n';
    }
    generateValidationTemplates(parameters:any) : Template[] {
        return this.getCurrentPage() !== null ? this.getCurrentPage()!.getValidationTemplates(parameters) : [];
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
        const page : WebviewWizardPage | null = this.getCurrentPage();
        if( page === null )
            {return "";}
        return page.getContentAsHTML(parameters);
    }

    getCurrentPage(): WebviewWizardPage | null {
        const cur : IWizardPage | null = super.getPage(this.getCurrentPageId());
        if(cur instanceof WebviewWizardPage ) 
            {return cur;}
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
                this.nextPressedMapping, this.finishPressedMapping]
          );

        // organize initial data
        let m = new Map<string, string>();
        for( let p of this.definition.pages) {
            p.fields.forEach(element => {
                if( isWizardPageSectionDefinition(element)) {
                    for( let p2 of element.childFields ) {
                        if( p2.initialValue ) {
                            m.set(p2.id, p2.initialValue);
                        }
                    }
                } else if( isWizardPageFieldDefinition(element) ) {
                    if( element.initialValue ) {
                        m.set(element.id, element.initialValue);
                    }
                }
            });
        }
        sendInitialData(this.id, new Map([...m, ...this.initialData]));
    }
    addPages(): void {
        for( let d of this.definition.pages) {
            let page: WebviewWizardPage = new WebviewWizardPage(d, this.definition);
            page.setWizard(this);
            page.validate({});
            this.addPage(page);
        }
    }
    getUpdatedWizardControls(parameters: any, validate: boolean): string {
        if( validate ) {
            // Don't care about return value here, just want pageComplete to be set
            this.generateValidationTemplates(parameters);
        }
        let hasPrevious = (this.currentPage !== null && 
            this.getActualPreviousPage(this.currentPage) !== null);

        let hasNext = (this.currentPage !== null && this.currentPage.isPageComplete() && 
                        this.getActualNextPage(parameters) !== null);
        let canFinishNow = this.canFinishInternal(parameters);

        let ret: string = "";
        if( this.definition.buttons) {
            for( let button of this.definition.buttons) {
                if( button.id == BUTTONS.PREVIOUS ) {
                    ret = ret + this.createButton("buttonBack", "backPressed()", hasPrevious, button.label);
                }
                if( button.id == BUTTONS.NEXT ) {
                    ret = ret + this.createButton("buttonNext", "nextPressed()", hasNext, button.label) 
                }
                if( button.id == BUTTONS.FINISH ) {
                    ret = ret + this.createButton("buttonFinish", "finishPressed()", canFinishNow, button.label);
                }
            }
        } else {
            ret = this.createButton("buttonBack", "backPressed()", hasPrevious, "Back") + 
                this.createButton("buttonNext", "nextPressed()", hasNext, "Next") + 
                this.createButton("buttonFinish", "finishPressed()", canFinishNow, "Finish");
        }
        return ret;
    }

    createButton(id: string, onclick: string, enabled: boolean, text: string): string {
        return "<button type=\"button\" class=\"btn btn-secondary button--big\" id=\"" + id + 
        "\" onclick=\"" + onclick + "\" " + (enabled ? "" : " disabled") + ">" + text + "</button>\n";
    }


    showDirtyState(def: WizardDefinition) : boolean {
        return def.showDirtyState !== undefined && def.showDirtyState && this.isDirty;
    }
}



export type WizardPageValidator = (parameters?: any) => ValidatorResponse;
export type WizardPageFieldOptionProvider = (parameters?: any) => string[];

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
    items: ValidatorResponseItem[]
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
    properties?: any;
    optionProvider?: WizardPageFieldOptionProvider;
}
