import { IWizardPage } from './IWizardPage';
import { WizardPage } from './WizardPage';
import { WizardPageDefinition, WizardPageFieldDefinition, isWizardPageFieldDefinition, isWizardPageSectionDefinition, WizardPageSectionDefinition, ValidatorResponse, SEVERITY } from './WebviewWizard';
import { Template } from './pageImpl';
import { StandardWizardPageRenderer } from './StandardWizardPageRenderer';
import { IWizardPageRenderer } from './IWizardPageRenderer';
import { WebviewWizard, WizardDefinition } from '.';
export class WebviewWizardPage extends WizardPage implements IWizardPage {
    pageDefinition:WizardPageDefinition; 
    wizardDefinition:WizardDefinition;
    constructor(pageDefinition: WizardPageDefinition, wizardDefinition: WizardDefinition) {
        super(pageDefinition.id, pageDefinition.title, pageDefinition.description);
        this.wizardDefinition = wizardDefinition;
        this.pageDefinition = pageDefinition;
    }

    getPageDefinition(): WizardPageDefinition {
        return this.pageDefinition;
    }

    getValidationTemplates(parameters:any) : Template[] {
        let templates : Template[] = [];
        for (let key of this.pageDefinition.fields) {
            if( isWizardPageSectionDefinition(key)) {
                for (let key2 of key.childFields) {
                    templates.push({ id: key2.id + "Validation", content: "&nbsp;"});
                }
            } else if( isWizardPageFieldDefinition(key)) {
                templates.push({ id: key.id + "Validation", content: "&nbsp;"});
            }
        }
        this.setPageComplete(true);
        return this.validate(parameters, templates);
    }

    severityToImage(sev: SEVERITY): string {
        if( sev === SEVERITY.ERROR)
            return"<i class=\"icon icon__error\"></i>";
        if( sev === SEVERITY.WARN)
            return"<i class=\"icon icon__warn\"></i>";
        if( sev === SEVERITY.INFO)
            return"<i class=\"icon icon__info\"></i>";
        return "";
    }
    validate(parameters: any, templates:Template[]): Template[] {
        if( this.pageDefinition.validator ) {
            let resp: ValidatorResponse = this.pageDefinition.validator.call(null, parameters);
            for( let oneItem of resp.items ) {
                // Allow users to just put the failed field id here. We add Validation
                if( !oneItem.template.id.endsWith("Validation")) {
                    oneItem.template.id = oneItem.template.id + "Validation";
                }
                if( oneItem.severity === SEVERITY.ERROR ) {
                    this.setPageComplete(false);
                }
                let img: string = this.severityToImage(oneItem.severity);
                oneItem.template.content = img + (oneItem.template.content ? oneItem.template.content : "&nbsp;");
                templates = templates.concat(oneItem.template);
            }
        }
        return templates;
    }

    getRenderer(): IWizardPageRenderer {
        if( this.wizardDefinition && this.wizardDefinition.renderer) {
            return this.wizardDefinition.renderer;
        }
        return new StandardWizardPageRenderer();
    }
    
    getContentAsHTML(data: any): string {
        return this.getRenderer().getContentAsHTML(this.pageDefinition, data);
    }
}