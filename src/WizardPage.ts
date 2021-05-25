import { IWizard } from './IWizard';
import { IWizardPage } from './IWizardPage';
export class WizardPage implements IWizardPage {
    id: string;
    name: string | undefined;
    description: string | undefined;
    isPageCompleteVar: boolean;
    wizard: IWizard | null;
    previousPage: IWizardPage | null;
    constructor(pageId: string, pageName: string | undefined, description: string | undefined) {
        this.id = pageId;
        this.name = pageName;
        this.description = description;
        this.wizard = null;
        this.isPageCompleteVar = false;
        this.previousPage = null;
    }
    canFlipToNextPage(): boolean {
        return this.isPageComplete() && this.getNextPage() !== null;
    }
    getId(): string {
        return this.id;
    }
    getName(): string | undefined {
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
    getDescription(): string | undefined {
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