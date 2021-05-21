import { Wizard } from './Wizard';
import { IWizard } from './IWizard';
import { IWizardPage } from './IWizardPage';
import * as vscode from 'vscode';
import { MesssageMapping, Template, HandlerResponse } from "./pageImpl";
import { createOrShowWizard, disposeWizard, sendInitialData} from "./pageImpl";
import { WebviewWizardPage } from './WebviewWizardPage';
import { IWizardWorkflowManager, PerformFinishResponse } from './IWizardWorkflowManager';
import { IWizardPageRenderer } from './IWizardPageRenderer';

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
    description: string;
    definition: WizardDefinition;
    initialData: Map<string, string>;

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
            return {
                returnObject: resp.returnObject,
                templates: resp.templates
            };
        }
    }

    close(): void {
        disposeWizard(this.id);
    }

    getShowCurrentPageTemplates(parameters: any) : Template[] {
        let ret: Template[] = [];
        ret.push({ id: "wizardTitle", content: this.title});
        ret.push({ id: "wizardDescription", content: this.description});
        ret.push({ id: "pageTitle", content: this.getCurrentPageName()});
        ret.push({ id: "pageDescription", content: this.getCurrentPageDescription()});
        ret.push({ id: "content", content: this.getCurrentPageContent(parameters)});
        ret.push({ id: "wizardControls", content: this.getUpdatedWizardControls(parameters, true)});
        if( this.imageString !== undefined ) {
            ret.push({id: "wizardBanner", content: this.imageString})
        }
        return ret;
    }

    generateValidationTemplates(parameters:any) {
        return this.getCurrentPage() !== null ? this.getCurrentPage()!.getValidationTemplates(parameters) : [];
    }
    getCurrentPageName(): string {
        return (this.currentPage === null ? "" : this.currentPage.getName()); 
    }
    getCurrentPageId(): string {
        return (this.currentPage === null ? "" : this.currentPage.getId()); 
    }

    getCurrentPageDescription(): string {
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
            page.validate({}, []);
            this.addPage(page);
        }
    }
    getUpdatedWizardControls(parameters: any, validate: boolean): string {
        if( validate ) {
            this.generateValidationTemplates(parameters);
        }
        let hasPrevious = (this.currentPage !== null && 
            this.getActualPreviousPage(this.currentPage) !== null);

        let hasNext = (this.currentPage !== null && this.currentPage.isPageComplete() && 
                        this.getActualNextPage(parameters) !== null);
        let canFinishNow = this.canFinishInternal(parameters);
        const ret: string = 
            this.createButton("buttonBack", "backPressed()", hasPrevious, "Back") + 
            this.createButton("buttonNext", "nextPressed()", hasNext, "Next") + 
            this.createButton("buttonFinish", "finishPressed()", canFinishNow, "Finish");
        return ret;
    }
    createButton(id: string, onclick: string, enabled: boolean, text: string): string {
        return "<button type=\"button\" class=\"btn btn-secondary button--big\" id=\"" + id + 
        "\" onclick=\"" + onclick + "\" " + (enabled ? "" : " disabled") + ">" + text + "</button>\n";
    }
}



export type WizardPageValidator = (parameters?: any) => ValidatorResponse;
export type WizardPageFieldOptionProvider = (parameters?: any) => string[];

export interface ValidatorResponse {
    errors?: Template[];
    warnings?: Template[];
    infos?: Template[];
    other?: Template[];
}

export interface WizardDefinition {
    title: string;
    description: string;
    bannerIconString?: string;
    pages: WizardPageDefinition[];
    workflowManager?: IWizardWorkflowManager;
    renderer?: IWizardPageRenderer;
  }
  

export interface WizardPageDefinition {
    id: string;
    title: string;
    description: string;
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