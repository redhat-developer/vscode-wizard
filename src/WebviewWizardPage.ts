import { IWizardPage } from './IWizardPage';
import { WizardPage } from './WizardPage';
import { WizardPageDefinition, WizardPageFieldDefinition, isWizardPageFieldDefinition, isWizardPageSectionDefinition, WizardPageSectionDefinition, ValidatorResponse } from './WebviewWizard';
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

    validate(parameters: any, templates:Template[]): Template[] {
        if( this.pageDefinition.validator ) {
            let resp: ValidatorResponse = this.pageDefinition.validator.call(null, parameters);
            if( resp && resp.errors && resp.errors.length > 0 ) {
                this.setPageComplete(false);
                for( let oneTemplate of resp.errors) {
                    oneTemplate.content = "<i class=\"icon icon__error\"></i>" + (oneTemplate.content ? oneTemplate.content : "");
                }
                templates = templates.concat(resp.errors);
            }
            if( resp && resp.warnings && resp.warnings.length > 0 ) {
                for( let oneTemplate of resp.warnings) {
                    oneTemplate.content = "<i class=\"icon icon__warn\"></i>" + (oneTemplate.content ? oneTemplate.content : "");
                }
                templates = templates.concat(resp.warnings);
            }
            if( resp && resp.infos && resp.infos.length > 0 ) {
                for( let oneTemplate of resp.infos) {
                    oneTemplate.content = "<i class=\"icon icon__info\"></i>" + (oneTemplate.content ? oneTemplate.content : "");
                }
                templates = templates.concat(resp.infos);
            }
            if( resp && resp.other && resp.other.length > 0 ) {
                templates = templates.concat(resp.other);
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