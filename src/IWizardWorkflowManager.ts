import { WebviewWizard } from "./WebviewWizard";
import { IWizardPage } from "./IWizardPage";

export interface IWizardWorkflowManager {
    canFinish(wizard:WebviewWizard, data: any): boolean;
    performFinish(wizard:WebviewWizard, data: any): void;
    getNextPage?(page:IWizardPage, data: any): IWizardPage | null;
    getPreviousPage?(page:IWizardPage, data: any): IWizardPage | null;
    performCancel?(): void;
}