import { WizardPageDefinition, WizardPageFieldDefinition, isWizardPageFieldDefinition, isWizardPageSectionDefinition, WizardPageSectionDefinition, ValidatorResponse } from './WebviewWizard';
import {IWizardPageRenderer} from './IWizardPageRenderer';

export class StandardWizardPageRenderer implements IWizardPageRenderer {

    getContentAsHTML(definition:WizardPageDefinition, data: any): string {
        let ret = "";
        for( let oneField of definition.fields ) {
            if( isWizardPageSectionDefinition(oneField)) {
                ret += this.oneSectionAsString(oneField, data);
            } else if( isWizardPageFieldDefinition(oneField)) {
                ret += this.oneFieldAsString(oneField, data);
            }
        }
        return ret;``
    }

    oneSectionAsString(oneSection:WizardPageSectionDefinition, data: any) {
        let ret = "";
        let onclick = " onclick=\"document.getElementById('" + oneSection.id + "').classList.toggle('collapsed');\"";

        ret += "<section id=\"" + oneSection.id + "\" class=\"section--settings section--collapsible\"" + ">\n";
        ret += "        <div class=\"section__header\" " + onclick + ">\n";
        ret += "                <h2>" + oneSection.label + "</h2>\n";
        if( oneSection.description ) {
            ret += "                <p class=\"section__header-hint\">" + oneSection.description + "</p>\n";
        }
        ret += "        </div>\n";
        ret += "        <div class=\"section__collapsible\">\n";
        ret += "           <div class=\"section__group\">\n";
        ret += "                <div class=\"section__content\">\n";

        for( let oneField of oneSection.childFields ) {
            ret += this.oneFieldAsString(oneField, data);
        }

        ret += "                </div>\n";
        ret += "           </div>\n";
        ret += "        </div>\n";
        ret += "</section>\n";
        return ret;
    }

    oneFieldAsString(oneField: WizardPageFieldDefinition, data: any) : string {
        let ret = "";
        if( oneField.type === "textbox") {
            ret = ret + this.textBoxAsHTML(oneField, data);
        } else if( oneField.type === "checkbox") {
            ret = ret + this.checkBoxAsHTML(oneField, data);
        } else if( oneField.type === "number") {
            ret = ret + this.numberAsHTML(oneField, data);
        } else if( oneField.type === "textarea") {
            ret = ret + this.textAreaAsHTML(oneField, data);
        } else if( oneField.type === "radio") {
            ret = ret + this.radioGroupAsHTML(oneField, data);
        } else if( oneField.type === "select") {
            ret = ret + this.selectAsHTML(oneField, data);
        } else if( oneField.type === "combo") {
            ret = ret + this.comboAsHTML(oneField, data);
        }
        return this.divClass("setting", 0, ret);
    }

    textBoxAsHTML(oneField: WizardPageFieldDefinition, data: any): string {
        let iv = this.getInitialValue(oneField, data);

        let lbl = this.labelFor(oneField.id, oneField.label,0);
        let initialValueSegment = oneField.initialValue ? " value=\"" + oneField.initialValue + "\"" : "";
        let placeholderSegment = !oneField.initialValue && oneField.placeholder ? " placeholder=\"" + oneField.placeholder + "\"" : "";
        let disabled = (!this.isFieldEnabled(oneField, data) ? " disabled" : "");
        
        
        let input = "<input id=\"" + oneField.id + "\" name=\"" + oneField.id + "\" type=\"text\"" 
                + (iv ? "value=\"" + iv + "\"" : "")
                + initialValueSegment + placeholderSegment + this.onInputFieldChanged(oneField.id) + 
                disabled + " data-setting data-setting-preview>";
        let validationDiv =  this.validationDiv(oneField.id, 0);

        let inner = lbl + input + validationDiv;
        let settingInput:string = this.divClass("setting__input",0, inner);

        let hint = "<p class=\"setting__hint\">" + 
                (oneField.description ? oneField.description : "") 
                + "</p>";

        return settingInput + hint;
    }


    numberAsHTML(oneField: WizardPageFieldDefinition, data: any): string {
        let iv = this.getInitialValue(oneField, data);

        let lbl = this.labelFor(oneField.id, oneField.label,0);
        let initialValueSegment = oneField.initialValue ? " value=\"" + oneField.initialValue + "\"" : "";
        let placeholderSegment = !oneField.initialValue && oneField.placeholder ? " placeholder=\"" + oneField.placeholder + "\"" : "";
        let disabled = (!this.isFieldEnabled(oneField, data) ? " disabled" : "");
        
        let input = "<input id=\"" + oneField.id + "\" name=\"" + oneField.id + "\" type=\"number\"" 
                + (iv ? "value=\"" + iv + "\"" : "")
                + initialValueSegment + placeholderSegment + this.onInputFieldChanged(oneField.id) + 
                disabled + " data-setting data-setting-preview>";
        let validationDiv =  this.validationDiv(oneField.id, 0);

        let inner = lbl + input + validationDiv;
        let settingInput:string = this.divClass("setting__input",0, inner);

        let hint = "<p class=\"setting__hint\">" + 
                (oneField.description ? oneField.description : "") 
                + "</p>";

        return settingInput + hint;
    }

    checkBoxAsHTML(oneField: WizardPageFieldDefinition, data: any): string {
        let iv = this.getInitialValue(oneField, data);
        let lbl = this.labelForNoStyle(oneField.id, oneField.label,0);
        let validationDiv =  this.validationDiv(oneField.id, 0);

        // create the input item
        let fieldChangedArg2 = " document.getElementById('" + oneField.id + "').checked";
        let oninput =  this.onInputFieldChangedWithValue(oneField.id, fieldChangedArg2);
        let disabled = (!this.isFieldEnabled(oneField, data) ? " disabled" : "");
        
        let checked = (iv ? " checked" : "");
        let input = "<input id=\"" + oneField.id + "\" name=\"" + oneField.id + "\" type=\"checkbox\"" 
                +oninput + " data-setting data-setting-preview" + checked + disabled + ">";

        let inner = input + lbl + validationDiv;
        let settingInput:string = this.divClass("setting__input",0, inner);

        let hint = "<p class=\"setting__hint\">" + (oneField.description ? oneField.description : "") + "</p>";

        return settingInput + hint;
    }

    textAreaAsHTML(oneField: WizardPageFieldDefinition, data: any): string {
        let cols = (oneField.properties && oneField.properties.columns ? " cols=\"" + oneField.properties.columns + "\"" : "");
        let rows = (oneField.properties && oneField.properties.rows ? " rows=\"" + oneField.properties.rows + "\"" : "");
        let iv = this.getInitialValue(oneField, data);
        let lbl = this.labelFor(oneField.id, oneField.label,0);
        let disabled = (!this.isFieldEnabled(oneField, data) ? " disabled" : "");
        


        let placeholder = (!oneField.initialValue && oneField.placeholder ? 
                " placeholder=\"" + oneField.placeholder + "\"" : "");


        let oninput = this.onInputFieldChanged(oneField.id);
        let textarea = "<textarea id=\"" + oneField.id + "\" name=\"" + oneField.id + "\" " 
            + cols + rows + oninput + placeholder + disabled + " data-setting data-setting-preview>";
        if( iv ) {
            textarea += iv;
        }
        textarea = textarea + "</textarea>\n";
        let validationDiv = this.validationDiv(oneField.id, 0);

        let inner =  lbl + textarea + validationDiv;
        let settingInput:string = this.divClass("setting__input",0, inner);

        let hint = "<p class=\"setting__hint\">" + (oneField.description ? oneField.description : "") + "</p>";
        return settingInput + hint;
    }


    radioGroupAsHTML(oneField: WizardPageFieldDefinition, data: any): string {
        let iv = this.getInitialValue(oneField, data);
        let label = this.labelFor(oneField.id, oneField.label,0);
        let disabled = (!this.isFieldEnabled(oneField, data) ? " disabled" : "");
        

        let inputs = "";
        if( oneField.properties && oneField.properties?.options) {
            for( let oneOpt of oneField.properties?.options ) {
                let selected: boolean = iv ? (iv === oneOpt) : false;
                let oninput = this.onInputFieldChangedWithValue(oneField.id, "'" + oneOpt + "'");
                inputs = inputs + "<input type=\"radio\" name=\"" + oneField.id + 
                                        "\" id=\"" + oneOpt + 
                                        oninput +
                                        (selected ? " checked" : "") +
                                        disabled + 
                                        ">\n";
                inputs += this.labelForNoStyle(oneOpt, oneOpt,0);
            }
        }

        let inputContainer = this.divClass("select-container", 0, inputs);

        let validationDiv = this.validationDiv(oneField.id, 0);
        let settingInput:string = this.divClass("setting__input",0, label + inputContainer + validationDiv);
        let hint = "<p class=\"setting__hint\">" + (oneField.description ? oneField.description : "") + "</p>";
        return settingInput + hint;
    }


    selectAsHTML(oneField: WizardPageFieldDefinition, data: any): string {
        let iv = this.getInitialValue(oneField, data);
        let label : string = this.labelFor(oneField.id, oneField.label,0);
        let oninput = this.onInputFieldChanged(oneField.id);
        let disabled = (!this.isFieldEnabled(oneField, data) ? " disabled" : "");
        
        // Create the select
        let select = "<select name=\"" + oneField.id + "\" id=\"" + oneField.id + "\""
            + oninput + disabled + " data-setting>\n";
        if( oneField.properties && oneField.properties?.options) {
            for( let oneOpt of oneField.properties?.options ) {
                let selected: boolean = iv ? (iv === oneOpt) : false;
                select = select + "   <option" + (selected ? " selected" : "") + ">" + oneOpt + "</option>\n";
            }
        }
        select += "</select>\n";

        let selectContainer = this.divClass("select-container", 0, select);

        let validationDiv = this.validationDiv(oneField.id, 0);
        let settingInput:string = this.divClass("setting__input",0, label + selectContainer + validationDiv);
        let hint = "<p class=\"setting__hint\">" + (oneField.description ? oneField.description : "") + "</p>";
        return settingInput + hint;
    }

    comboAsHTML(oneField: WizardPageFieldDefinition, data: any): string {
        if( !oneField.optionProvider && (!oneField.properties || !oneField.properties.options)) {
            return this.textBoxAsHTML(oneField, data);
        } 

        let iv = this.getInitialValue(oneField, data);
        let label : string = this.labelFor(oneField.id, oneField.label,0);
        let oninput = this.onInputFieldChanged(oneField.id);
        let disabled = (!this.isFieldEnabled(oneField, data) ? " disabled" : "");
        
        // actual combo here
        let text : string =  "<input type=\"text\" name=\"" + oneField.id + "\" " + 
                                "list=\"" + oneField.id + "InternalList\" " + 
                                "id=\"" + oneField.id + "\"" + 
                                (iv ? "value=\"" + iv + "\"" : "") + 
                                disabled +
                                oninput + "/>\n";
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


        let validationDiv = this.validationDiv(oneField.id, 0);
        let settingInput:string = this.divClass("setting__input",0, label + text + dataList + validationDiv);
        let hint = "<p class=\"setting__hint\">" + (oneField.description ? oneField.description : "") + "</p>";
        return settingInput + hint;
    }


    onInputFieldChanged(id:string):string {
        return  " oninput=\"fieldChanged('" + id + "')\" ";
    }
    onInputFieldChangedWithValue(id:string, val:string):string {
        return " oninput=\"fieldChangedWithVal('" + id + "', " + val + ")\"";
    }
    validationDiv(id:string, tabs:number):string {
        let tabss:string = this.numTabs(tabs);
        return  tabss + "<div style=\"display:block;text-align:left;width:180px;\" id=\"" + id + "Validation\">&nbsp;</div>\n";
    }
    labelFor(fieldId:string, labelVal:string, tabs:number): string {
        let tabss:string = this.numTabs(tabs);
        return tabss + "<label for=\"" + fieldId + "\" style=\"display:block;text-align:left;width:125px;\">" + labelVal + "</label>\n";
    }
    labelForNoStyle(fieldId:string, labelVal:string, tabs:number): string {
        let tabss:string = this.numTabs(tabs);
        return tabss + "<label for=\"" + fieldId + "\">" + labelVal + "</label>\n";
    }
    divClass(classname: string, tabs: number, inner: string): string {
        let tabss:string = this.numTabs(tabs);
        return tabss + "<div class=\"" + classname + "\">\n" + inner + tabss + "</div>\n";
    }
    numTabs(num: number): string {
        let ret: string = "";
        for( let i:number = 0; i < num; i++ ) {
            ret += "\t";
        }
        return ret;
    }
    isFieldEnabled(oneField: WizardPageFieldDefinition, data: any): boolean {
        return (oneField.properties && oneField.properties.disabled ? false : true);
    }
    getInitialValue(oneField: WizardPageFieldDefinition, data: any) : string { 
        if( data instanceof Map ) {
            return data && data.get(oneField.id) ? data.get(oneField.id) : oneField.initialValue;
        }
        return data && data[oneField.id] ? data[oneField.id] : oneField.initialValue;
    }

}
