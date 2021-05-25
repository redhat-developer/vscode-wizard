import { IWizard } from "./IWizard";

export interface IWizardPage {
    canFlipToNextPage(): boolean;
    getId(): string;
    getName(): string | undefined;
    getDescription(): string | undefined;
    getNextPage(): IWizardPage | null;
    getPreviousPage(): IWizardPage | null;
    getWizard(): IWizard | null;
    isPageComplete(): boolean;
    setPreviousPage(page: IWizardPage): void;
    setWizard(wizard: IWizard): void;
  }