import { WebviewWizard } from "./WebviewWizard";
import { IWizardPage } from "./IWizardPage";
import { Template } from "./pageImpl";

export interface IWizardWorkflowManager {
    canFinish(wizard:WebviewWizard, data: any): boolean;
    performFinish(wizard:WebviewWizard, data: any): PerformFinishResponse | null;
    getNextPage?(page:IWizardPage, data: any): IWizardPage | null;
    getPreviousPage?(page:IWizardPage, data: any): IWizardPage | null;
    performCancel?(): void;
}

export interface PerformFinishResponse {
    close: boolean;
    returnObject: any;
    templates: Template[];
}
