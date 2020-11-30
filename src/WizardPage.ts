import { IWizard } from './IWizard';
import { IWizardPage } from './IWizardPage';
export class WizardPage implements IWizardPage {
    name: string;
    description: string;
    isPageCompleteVar: boolean;
    wizard: IWizard | null;
    previousPage: IWizardPage | null;
    constructor(pageName: string, description: string) {
        this.name = pageName;
        this.description = description;
        this.wizard = null;
        this.isPageCompleteVar = false;
        this.previousPage = null;
    }
    canFlipToNextPage(): boolean {
        return this.isPageComplete() && this.getNextPage() !== null;
    }
    getName(): string {
        return this.name;
    }
    getNextPage(): IWizardPage | null {
        if (this.wizard === null) {
			return null;
		}
		return this.wizard.getNextPage(this);
    }
    getPreviousPage(): IWizardPage | null {
        return this.previousPage;
    }
    getWizard(): IWizard | null {
        return this.wizard;
    }
    getDescription(): string {
        return this.description;
    }
    isPageComplete(): boolean {
        return this.isPageCompleteVar;
    }
    setPageComplete(val: boolean): void {
        this.isPageCompleteVar = val;
    }

    setPreviousPage(page: IWizardPage): void {
        this.previousPage = page;
    }
    setWizard(wizard: IWizard): void {
        this.wizard = wizard;
    }
}