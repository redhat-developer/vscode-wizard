import { IWizard } from "./IWizard";
import { IWizardPage } from "./IWizardPage";

export interface IWizardWorkflowManager {
    canFinish(page:IWizard, data: any): boolean;
    performFinish(page:IWizard, data: any): void;
    getNextPage?(page:IWizardPage, data: any): IWizardPage | null;
    getPreviousPage?(page:IWizardPage, data: any): IWizardPage | null;
    performCancel?(): void;
}