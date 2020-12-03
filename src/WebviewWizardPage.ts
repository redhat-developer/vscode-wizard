import { IWizardPage } from './IWizardPage';
import { WizardPage } from './WizardPage';
import { WizardPageDefinition, WizardPageFieldDefinition } from './WebviewWizard';
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
                ret = ret + this.textBoxAsHTML(oneField);
            } else if( oneField.type === "checkbox") {
                ret = ret + this.checkBoxAsHTML(oneField);
            } else if( oneField.type === "textarea") {
                ret = ret + this.textAreaAsHTML(oneField);
            } else if( oneField.type === "radio") {
                ret = ret + this.radioGroupAsHTML(oneField);
            } else if( oneField.type === "select") {
                ret = ret + this.selectAsHTML(oneField);
            } else if( oneField.type === "combo") {
                ret = ret + this.comboAsHTML(oneField);
            }
        }
        return ret;
    }

    selectAsHTML(oneField: WizardPageFieldDefinition): string {
        let ret : string = "<label for=\"" + oneField.id + "\">" + oneField.label + "</label>\n" + 
        "<select name=\"" + oneField.id + "\" id=\"" + oneField.id + "\" onchange=\"fieldChanged('" + oneField.id + "')\">\n";
        if( oneField.properties && oneField.properties?.options) {
            for( let oneOpt of oneField.properties?.options ) {
                let selected: boolean = oneField.initialValue ? (oneField.initialValue === oneOpt) : false;
                ret = ret + "   <option" + (selected ? " selected" : "") + ">" + oneOpt + "</option>\n";
            }
        }
        ret = ret +  "</select>\n<div id=\"" + oneField.id + "Validation\">&nbsp;</div>\n\n";
        return ret;
    }

    comboAsHTML(oneField: WizardPageFieldDefinition): string {
        if( !oneField.properties || !oneField.properties.options) {
            return this.textBoxAsHTML(oneField);
        } 
        // actual combo here
        let label : string =  "<label for=\"" + oneField.id + "\">" + oneField.label + "</label>\n";
        let text : string =  "<input type=\"text\" name=\"" + oneField.id + "\" " + 
                                "list=\"" + oneField.id + "InternalList\" " + 
                                "id=\"" + oneField.id + "\" onchange=\"fieldChanged('" + oneField.id + "')\"/>\n";
        let dataList : string = "<datalist id=\"" + oneField.id + "InternalList\">";
        for( let oneOpt of oneField.properties?.options ) {
            let selected: boolean = oneField.initialValue ? (oneField.initialValue === oneOpt) : false;
            dataList = dataList + "   <option value=\"" + oneOpt + "\"" + (selected ? " selected" : "") + ">\n";
        }
        dataList = dataList + "</datalist>\n";
        let ret = label + text + dataList;
        ret = ret +  "<div id=\"" + oneField.id + "Validation\">&nbsp;</div>\n\n";
        return ret;
    }

    textBoxAsHTML(oneField: WizardPageFieldDefinition): string {
        return "<label for=\"" + oneField.id + "\">" + oneField.label + "</label>\n" + 
        "<input type=text id=\"" + oneField.id + "\" " +
        (oneField.initialValue ? "value=\"" + oneField.initialValue + "\" " : "") +
        "oninput=\"fieldChanged('" + oneField.id + "')\"><br>\n" + 
        "<div id=\"" + oneField.id + "Validation\">&nbsp;</div>\n\n";
    }

    checkBoxAsHTML(oneField: WizardPageFieldDefinition): string {
        return "<input type=\"checkbox\" id=\"" 
            + oneField.id + "\" name=\"" + oneField.id + "\" oninput=\"fieldChangedWithVal('" + 
            oneField.id + "', document.getElementById('" + oneField.id + "').checked)\">" + 
            "<label for=\"" + oneField.id + "\">" + oneField.label + "</label>\n" + 
        "<div id=\"" + oneField.id + "Validation\">&nbsp;</div>\n\n";
    }

    textAreaAsHTML(oneField: WizardPageFieldDefinition): string {
//        let ret: string =  "<label for=\"" + oneField.id + "\">" + oneField.label + "</label>\n" + 
        let ret: string =  oneField.label + 

        "<textarea id=\"" + oneField.id + "\" name=\"" + oneField.id + "\" ";
        if( oneField.properties ) {
            if( oneField.properties.rows ) {
                ret = ret + "rows=\"" + oneField.properties.rows + "\" ";
            }
            if( oneField.properties.columns ) {
                ret = ret + "cols=\"" + oneField.properties.columns + "\" ";
            }
        }
        ret = ret + "oninput=\"fieldChanged('" + oneField.id + "')\" ";
        ret = ret + ">\n";
        if( oneField.initialValue ) {
            ret += oneField.initialValue;
        }
        ret = ret + "\n</textarea>\n";
        ret = ret + "<div id=\"" + oneField.id + "Validation\">&nbsp;</div>\n\n";
        return ret;
    }


    radioGroupAsHTML(oneField: WizardPageFieldDefinition): string {
        let ret = "<label for=\"" + oneField.id + "\">" + oneField.label + "</label><br/>\n";
        if( oneField.properties && oneField.properties?.options) {
            for( let oneOpt of oneField.properties?.options ) {
                let selected: boolean = oneField.initialValue ? (oneField.initialValue === oneOpt) : false;
                ret = ret + "<input type=\"radio\" name=\"" + oneField.id + "\" id=\"" 
                    + oneOpt + "\" oninput=\"fieldChangedWithVal('" + 
                    oneField.id + "', '" + oneOpt + "')\"" + (selected ? " checked" : "") + ">\n";
                ret = ret + "<label for=\"" + oneOpt + "\">" + oneOpt + "</label><br>\n";
            }
        }
        ret = ret +  "<div id=\"" + oneField.id + "Validation\">&nbsp;</div>\n\n";
        return ret;
    }

}