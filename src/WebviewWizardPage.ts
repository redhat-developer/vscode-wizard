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

    getContentAsHTML(data: any): string {
        let ret = "";
        for( let oneField of this.definition.fields ) {
            if( oneField.type === "textbox") {
                ret = ret + this.textBoxAsHTML(oneField, data);
            } else if( oneField.type === "checkbox") {
                ret = ret + this.checkBoxAsHTML(oneField, data);
            } else if( oneField.type === "textarea") {
                ret = ret + this.textAreaAsHTML(oneField, data);
            } else if( oneField.type === "radio") {
                ret = ret + this.radioGroupAsHTML(oneField, data);
            } else if( oneField.type === "select") {
                ret = ret + this.selectAsHTML(oneField, data);
            } else if( oneField.type === "combo") {
                ret = ret + this.comboAsHTML(oneField, data);
            }
        }
        return ret;
    }

    selectAsHTML(oneField: WizardPageFieldDefinition, data: any): string {
        let iv = this.getInitialValue(oneField, data);
        let ret : string = "<label for=\"" + oneField.id + "\">" + oneField.label + "</label>\n" + 
        "<select name=\"" + oneField.id + "\" id=\"" + oneField.id + "\" onchange=\"fieldChanged('" + oneField.id + "')\">\n";
        if( oneField.properties && oneField.properties?.options) {
            for( let oneOpt of oneField.properties?.options ) {
                let selected: boolean = iv ? (iv === oneOpt) : false;
                ret = ret + "   <option" + (selected ? " selected" : "") + ">" + oneOpt + "</option>\n";
            }
        }
        ret = ret +  "</select>\n<div id=\"" + oneField.id + "Validation\">&nbsp;</div>\n\n";
        return ret;
    }

    comboAsHTML(oneField: WizardPageFieldDefinition, data: any): string {
        let iv = this.getInitialValue(oneField, data);

        if( !oneField.optionProvider && (!oneField.properties || !oneField.properties.options)) {
            return this.textBoxAsHTML(oneField, data);
        } 
        // actual combo here
        let label : string =  "<label for=\"" + oneField.id + "\">" + oneField.label + "</label>\n";
        let text : string =  "<input type=\"text\" name=\"" + oneField.id + "\" " + 
                                "list=\"" + oneField.id + "InternalList\" " + 
                                "id=\"" + oneField.id + "\"" + (iv ? "value=\"" + iv + "\"" : "") + " onchange=\"fieldChanged('" + oneField.id + "')\"/>\n";
        let dataList : string = "<datalist id=\"" + oneField.id + "InternalList\">";
        let optList = null;
        if( oneField.optionProvider ) {
            optList = oneField.optionProvider(data);
        }
        if( optList === null && oneField.properties && oneField.properties.options) {
            optList = oneField.properties?.options;
        }

        for( let oneOpt of optList ) {
            let selected: boolean = iv ? (iv === oneOpt) : false;
            dataList = dataList + "   <option value=\"" + oneOpt + "\"" + (selected ? " selected" : "") + ">\n";
        }
        dataList = dataList + "</datalist>\n";
        let ret = label + text + dataList;
        ret = ret +  "<div id=\"" + oneField.id + "Validation\">&nbsp;</div>\n\n";
        return ret;
    }

    textBoxAsHTML(oneField: WizardPageFieldDefinition, data: any): string {
        let iv = this.getInitialValue(oneField, data);
        let ret = "<label for=\"" + oneField.id + "\">" + oneField.label + "</label>\n" + 
        "<input type=text id=\"" + oneField.id + "\" " +
        (iv ? "value=\"" + iv + "\" " : "") +
        "oninput=\"fieldChanged('" + oneField.id + "')\"><br>\n" + 
        "<div id=\"" + oneField.id + "Validation\">&nbsp;</div>\n\n";
        return ret;
    }

    checkBoxAsHTML(oneField: WizardPageFieldDefinition, data: any): string {
        let iv = this.getInitialValue(oneField, data);
        let ret = "<input type=\"checkbox\" id=\"" + oneField.id + "\" name=\"" + oneField.id + "\"" +
        " oninput=\"fieldChangedWithVal('" + oneField.id + "', document.getElementById('" + oneField.id + "').checked)\"" +
            (iv ? " checked" : "") + ">" + 
            "<label for=\"" + oneField.id + "\">" + oneField.label + "</label>\n" + 
        "<div id=\"" + oneField.id + "Validation\">&nbsp;</div>\n\n";
        return ret;
    }

    textAreaAsHTML(oneField: WizardPageFieldDefinition, data: any): string {
        let iv = this.getInitialValue(oneField, data);
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
        if( iv ) {
            ret += iv;
        }
        ret = ret + "\n</textarea>\n";
        ret = ret + "<div id=\"" + oneField.id + "Validation\">&nbsp;</div>\n\n";
        return ret;
    }


    radioGroupAsHTML(oneField: WizardPageFieldDefinition, data: any): string {
        let iv = this.getInitialValue(oneField, data);
        let ret = "<label for=\"" + oneField.id + "\">" + oneField.label + "</label><br/>\n";
        if( oneField.properties && oneField.properties?.options) {
            for( let oneOpt of oneField.properties?.options ) {
                let selected: boolean = iv ? (iv === oneOpt) : false;
                ret = ret + "<input type=\"radio\" name=\"" + oneField.id + "\" id=\"" 
                    + oneOpt + "\" oninput=\"fieldChangedWithVal('" + 
                    oneField.id + "', '" + oneOpt + "')\"" + (selected ? " checked" : "") + ">\n";
                ret = ret + "<label for=\"" + oneOpt + "\">" + oneOpt + "</label><br>\n";
            }
        }
        ret = ret +  "<div id=\"" + oneField.id + "Validation\">&nbsp;</div>\n\n";
        return ret;
    }

    getInitialValue(oneField: WizardPageFieldDefinition, data: any) : string { 
        if( data instanceof Map ) {
            return data && data.get(oneField.id) ? data.get(oneField.id) : oneField.initialValue;
        }
        return data && data[oneField.id] ? data[oneField.id] : oneField.initialValue;
    }

}