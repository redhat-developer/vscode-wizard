import { IWizardPage } from './IWizardPage';
import { WizardPage } from './WizardPage';
import { WizardPageDefinition } from './WebviewWizard';
import { Template } from './pageImpl';
export class WebviewWizardPage extends WizardPage implements IWizardPage {
    definition:WizardPageDefinition; 
    constructor(definition: WizardPageDefinition) {
        super(definition.title, definition.description);
        this.definition = definition;
    }
    getValidationTemplates(parameters:any) {
        let templates : Template[] = [];
        for (let key of this.definition.fields) {
            templates.push({ id: key.id + "Validation", content: "&nbsp;"});
        }
        this.setPageComplete(true);
        return this.validate(parameters, templates);
    }

    validate(parameters: any, templates:Template[]): Template[] {
        if( this.definition.validator ) {
            let ret: Template[] = this.definition.validator.call(null, parameters);
            if( ret !== null && ret.length > 0 ) {
                this.setPageComplete(false);
            }
            return templates.concat(ret);
        }
        return templates;
    }

    getContentAsHTML(): string {
        let ret = "";
        for( let oneField of this.definition.fields ) {
            if( oneField.type === "textbox") {
                ret = ret + oneField.label + ": " + "<input type=text id=\"" 
                + oneField.id + "\" oninput=\"fieldChanged('" + 
                oneField.id + "')\"><br>\n" + 
                "<div id=\"" + oneField.id + "Validation\">&nbsp;</div>\n\n";
            }
        }
        return ret;
    }
}