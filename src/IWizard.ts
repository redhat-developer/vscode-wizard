import { IWizardPage } from "./IWizardPage";

export interface IWizard {
    addPages(): void;
    getStartingPage(): IWizardPage | null;
    getPage(pageId:String): IWizardPage | null;
    getPageCount(): number;
    getPages(): IWizardPage[];
    needsPreviousAndNextButtons(): boolean;
    open(): void;
    close(): void;

    canFinish(): boolean;
    getNextPage(page:IWizardPage): IWizardPage | null;
    getPreviousPage(page:IWizardPage): IWizardPage | null;
    performCancel(): void;
    performFinish(): void;
  }