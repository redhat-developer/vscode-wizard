import { IWizard } from "./IWizard";

export interface IWizardPage {
    canFlipToNextPage(): boolean;
    getName(): string;
    getDescription(): string;
    getNextPage(): IWizardPage | null;
    getPreviousPage(): IWizardPage | null;
    getWizard(): IWizard | null;
    isPageComplete(): boolean;
    setPreviousPage(page: IWizardPage): void;
    setWizard(wizard: IWizard): void;
  }