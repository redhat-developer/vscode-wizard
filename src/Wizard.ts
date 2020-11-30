import { IWizard } from './IWizard';
import { IWizardPage } from './IWizardPage';
export class Wizard implements IWizard {
    pages: Array<IWizardPage> = new Array();

    addPages(): void {
    }
    addPage(page: IWizardPage): void {
        this.pages.push(page);
        page.setWizard(this);
    }
    canFinish(): boolean {
        for( let entry of this.pages ) {
            if( !entry.isPageComplete())
            {return false;}
        }
        return true;
    }
    getStartingPage(): IWizardPage | null{
        if( this.pages.length > 0 )
            {return this.pages[0];}
        return null;
    }
    getNextPage(page: IWizardPage): IWizardPage | null{
        let index = this.pages.indexOf(page);
		if (index === this.pages.length - 1 || index === -1) {
			// last page or page not found
			return null;
		}
		return this.pages[index + 1];
    }
    getPreviousPage(page: IWizardPage): IWizardPage | null{
        let index = this.pages.indexOf(page);
		if (index === 0 || index === -1) {
			// first page or page not found
			return null;
		}
		return this.pages[index - 1];
    }
    getPage(name: String): IWizardPage | null{
        for (let page of this.pages) {
			let pageName: String = page.getName();
			if (pageName === name) {
				return page;
			}
		}
		return null;
    }
    getPageCount(): number {
        return this.pages.length;
    }
    getPages(): IWizardPage[] {
        return this.pages;
    }
    needsPreviousAndNextButtons(): boolean {
        throw new Error("Method not implemented.");
    }
    performCancel(): void {
    }
    performFinish(): void {
    }
    open(): void {
        this.addPages();
    }
    close(): void {
        throw new Error("Method not implemented.");
    }
}