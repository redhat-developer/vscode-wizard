import { IWizardPage } from './IWizardPage';
import { WizardPage } from './WizardPage';
import { WizardPageDefinition, isWizardPageFieldDefinition, isWizardPageSectionDefinition, ValidatorResponse, SEVERITY } from './WebviewWizard';
import { Template } from './pageImpl';
import { StandardWizardPageRenderer } from './StandardWizardPageRenderer';
import { IWizardPageRenderer } from './IWizardPageRenderer';
import { WizardDefinition, WizardPageFieldDefinition } from '.';
export class WebviewWizardPage extends WizardPage implements IWizardPage {
    pageDefinition:WizardPageDefinition;
    wizardDefinition:WizardDefinition;
    constructor(pageDefinition: WizardPageDefinition, wizardDefinition: WizardDefinition) {
        super(pageDefinition.id, pageDefinition.title, pageDefinition.description);
        this.wizardDefinition = wizardDefinition;
        this.pageDefinition = pageDefinition;
        super.setFocusedField(this.findFocusedField());
    }

    private findFocusedField() : string | undefined{
      if (this.pageDefinition.fields.length > 0) {
        const field = this.pageDefinition.fields.find(field => isWizardPageFieldDefinition(field) && (<WizardPageFieldDefinition>field).focus === true);
        return field ? field.id : this.pageDefinition.fields[0].id;
      }
    }

    getPageDefinition(): WizardPageDefinition {
        return this.pageDefinition;
    }

    getValidationTemplates(parameters:any, previousParameters: any) : Template[] {
        this.setPageComplete(true);
        return this.validate(parameters, previousParameters);
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
    validate(parameters: any, previousParameters: any): Template[] {
        let templates: Template[] = [];
        if( this.pageDefinition.validator ) {
            let resp: ValidatorResponse = this.pageDefinition.validator.call(null, parameters, previousParameters);
            for( let oneItem of resp.items ) {
                // Allow users to just put the failed field id here. We add Validation
                if( !oneItem.template.id.endsWith("Validation")) {
                    oneItem.template.id = oneItem.template.id + "Validation";
                }
                if( oneItem.severity === SEVERITY.ERROR ) {
                    this.setPageComplete(false);
                }
                let img: string = this.severityToImage(oneItem.severity);
                let clazz = "";
                if( oneItem.severity == SEVERITY.ERROR) 
                    clazz = "error-message";
                else if( oneItem.severity == SEVERITY.WARN) 
                    clazz = "warn-message";
                else 
                    clazz = "info-message";

                let inner = img + (oneItem.template.content ? oneItem.template.content : "&nbsp;");
                oneItem.template.content = "<div class=\"" + clazz + "\">" + inner + "</div>";
                templates = templates.concat(oneItem.template);
            }

            // If validation has returned any widgets to refresh, we should do that now
            if( resp.fieldRefresh ) {
                for( let oneField of resp.fieldRefresh) {
                    let def : WizardPageFieldDefinition | null = this.findFieldDefinition(oneField);
                    if( def !== null ) {
                        let str : string = this.getRenderer().oneFieldAsString(def, parameters);
                        templates = templates.concat({id: oneField + "Field", content: str});
                    }
                }
            }
        }

        // All the official ones were added.
        // Now lets clear out all the empty ones
        for (let key of this.pageDefinition.fields) {
            if( isWizardPageSectionDefinition(key)) {
                for (let key2 of key.childFields) {
                    if( !this.containsTemplate(key2.id, templates)) {
                        templates.push({ id: key2.id + "Validation", content: "&nbsp;"});
                    }
                }
            } else if( isWizardPageFieldDefinition(key)) {
                if( !this.containsTemplate(key.id, templates)) {
                    templates.push({ id: key.id + "Validation", content: "&nbsp;"});
                }
            }
        }

        return templates;
    }

    findFieldDefinition(id: string) : WizardPageFieldDefinition | null {
        for( let i of this.pageDefinition.fields) {
            if( isWizardPageSectionDefinition(i)) {
                for (let j of i.childFields) {
                    if( j.id == id )
                    return j;
                }
            } else if( isWizardPageFieldDefinition(i)) {
                if( i.id == id )
                    return i;
            }
        }
        return null;
    }

    containsTemplate(id: string, templates: Template[]): boolean {
        for( let template of templates) {
            if( template.id === id || template.id === (id + 'Validation')) {
                return true;
            }
        }
        return false;
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
