import { WizardPageDefinition, WizardPageFieldDefinition, isWizardPageFieldDefinition, isWizardPageSectionDefinition, WizardPageSectionDefinition, ValidatorResponse } from './WebviewWizard';
import { IWizardPageRenderer } from './IWizardPageRenderer';

export class StandardWizardPageRenderer implements IWizardPageRenderer {

  getContentAsHTML(definition: WizardPageDefinition, data: any): string {
    let htmlContent = "";
    for (let field of definition.fields) {
      if (isWizardPageSectionDefinition(field)) {
        htmlContent += this.oneSectionAsString(field, data);
      } else if (isWizardPageFieldDefinition(field)) {
        htmlContent += this.oneFieldAsString(field, data);
      }
    }
    return htmlContent;
  }

  oneSectionAsString(section: WizardPageSectionDefinition, data: any) {
    const id = section.id;
    const label = section.label;
    const description = section.description;
    const childFields = section.childFields;
    const renderer = this;

    const htmlSectionContent = childFields.map(
      function (field) {
        return renderer.oneFieldAsString(field, data);
      }
    ).join("");

    const htmlSection =
      `<section id="${id}" class="section--settings section--collapsible" >
        <div class="section__header" onclick="document.getElementById('${id}').classList.toggle('collapsed');" >
          <h2>${label}</h2>
          ${description ? `<p class="section__header-hint">${description}</p>` : ''}
        </div>
        <div class="section__collapsible">
          <div class="section__group">
            <div class="section__content">
              ${htmlSectionContent}
            </div>
          </div>
        </div>
      </section>
      `;
    return htmlSection;
  }

  oneFieldAsString(field: WizardPageFieldDefinition, data: any): string {
    const htmlField = this.createHTMLField(field, data);
    return this.divClass("setting", 0, htmlField);
  }

  createHTMLField(field: WizardPageFieldDefinition, data: any): string {
    const type = field.type;
    switch (type) {
      case "textbox":
        return this.textBoxAsHTML(field, data);
      case "number":
        return this.numberAsHTML(field, data);
      case "password":
        return this.passwordAsHTML(field, data);
      case "textarea":
        return this.textAreaAsHTML(field, data);
      case "checkbox":
        return this.checkBoxAsHTML(field, data);
      case "radio":
        return this.radioGroupAsHTML(field, data);
      case "select":
        return this.selectAsHTML(field, data);
      case "combo":
        return this.comboAsHTML(field, data);
      default:
        return "";
    }
  }

  textBoxAsHTML(field: WizardPageFieldDefinition, data: any): string {
    const id = field.id;
    const value = this.getInitialValue(field, data);
    const disabled = !this.isFieldEnabled(field, data);
    const placeholder = this.getFieldPlaceHolder(field);

    const htmlInput =
      `<input id="${id}"
              name="${id}"
              ${value ? `value="${value}"` : ""}
              ${disabled ? "disabled" : ""}
              ${placeholder ? `placeholder="${placeholder}"` : ""}
              oninput="fieldChanged('${id}')"
              type="text"
              data-setting data-setting-preview >`;

    return this.wrapHTMLField(field, htmlInput);
  }

  numberAsHTML(field: WizardPageFieldDefinition, data: any): string {
    const id = field.id;
    const value = this.getInitialValue(field, data);
    const disabled = !this.isFieldEnabled(field, data);
    const placeholder = this.getFieldPlaceHolder(field);

    const htmlInput =
      `<input id="${id}"
              name="${id}"
              ${value ? `value="${value}"` : ""}
              ${disabled ? "disabled" : ""}
              ${placeholder ? `placeholder="${placeholder}"` : ""}
              oninput="fieldChanged('${id}')"
              type="number"
              data-setting data-setting-preview >`;

    return this.wrapHTMLField(field, htmlInput);
  }

  passwordAsHTML(field: WizardPageFieldDefinition, data: any): string {
    const id = field.id;
    const value = this.getInitialValue(field, data);
    const disabled = !this.isFieldEnabled(field, data);
    const placeholder = this.getFieldPlaceHolder(field);

    const htmlInput =
      `<input id="${id}"
              name="${id}"
              ${value ? `value="${value}"` : ""}
              ${disabled ? "disabled" : ""}
              ${placeholder ? `placeholder="${placeholder}"` : ""}
              oninput="fieldChanged('${id}')"
              type="password"
              data-setting data-setting-preview >`;

    return this.wrapHTMLField(field, htmlInput);
  }

  checkBoxAsHTML(field: WizardPageFieldDefinition, data: any): string {
    const id = field.id;
    const value = this.getInitialValue(field, data);
    const checked = value !== '' && value !== undefined;
    const disabled = !this.isFieldEnabled(field, data);
    const placeholder = this.getFieldPlaceHolder(field);

    const htmlInput =
      `<input id="${id}"
              name="${id}"
              ${value ? `value="${value}"` : ""}
              ${disabled ? "disabled" : ""}
              ${placeholder ? `placeholder="${placeholder}"` : ""}
              ${this.onInputFieldChangedWithValue(id, 'this.checked')}
              type="checkbox"
              ${checked ? "checked" : ""}
              data-setting data-setting-preview >`;

    return this.wrapHTMLField(field, htmlInput, true, true);
  }

  textAreaAsHTML(field: WizardPageFieldDefinition, data: any): string {
    const id = field.id;
    const value = this.getInitialValue(field, data);
    const disabled = !this.isFieldEnabled(field, data);
    const placeholder = this.getFieldPlaceHolder(field);
    const cols = field.properties?.columns;
    const rows = field.properties?.rows;

    const htmlTextarea =
      `<textarea id="${id}"
                 name="${id}"
                 ${cols ? `cols="${cols}"` : ""}
                 ${rows ? `rows="${rows}"` : ""}
                 ${disabled ? "disabled" : ""}
                 ${placeholder ? `placeholder="${placeholder}"` : ""}
                 oninput="fieldChanged('${id}')"
                 data-setting data-setting-preview >${value || ""}</textarea>`;

    return this.wrapHTMLField(field, htmlTextarea);
  }

  radioGroupAsHTML(oneField: WizardPageFieldDefinition, data: any): string {
    let iv = this.getInitialValue(oneField, data);
    let label = this.labelFor(oneField.id, oneField.label);
    let disabled = (!this.isFieldEnabled(oneField, data) ? " disabled" : "");

    let inputs = "";
    if (oneField.properties && oneField.properties?.options) {
      for (let oneOpt of oneField.properties?.options) {
        let selected: boolean = iv ? (iv === oneOpt) : false;
        let oninput = this.onInputFieldChangedWithValue(oneField.id, "'" + oneOpt + "'");
        inputs = inputs + "<input type=\"radio\" name=\"" + oneField.id +
          "\" id=\"" + oneOpt +
          oninput +
          (selected ? " checked" : "") +
          disabled +
          ">\n";
        inputs += this.labelForNoStyle(oneOpt, oneOpt);
      }
    }

    let inputContainer = this.divClass("select-container", 0, inputs);

    let validationDiv = this.validationDiv(oneField.id, 0);
    let settingInput: string = this.divClass("setting__input", 0, label + inputContainer + validationDiv);
    let hint = "<p class=\"setting__hint\">" + (oneField.description ? oneField.description : "") + "</p>";
    return settingInput + hint;
  }


  selectAsHTML(field: WizardPageFieldDefinition, data: any): string {
    const id = field.id;
    const value = this.getInitialValue(field, data);
    const disabled = !this.isFieldEnabled(field, data);

    const htmlOptions = field.properties?.options?.map(
      function (option: any) {
        const selected: boolean = value ? (value === option) : false;
        return `<option${selected ? " selected" : ""}>${option}</option>`;
      }).join("");

    const htmlSelect =
      `<select id="${id}"
               name="${id}"
               ${disabled ? "disabled" : ""}
               oninput="fieldChanged('${id}')"
               data-setting >
               ${htmlOptions}
       </select>`;

    const selectContainer = this.divClass("select-container", 0, htmlSelect);
    return this.wrapHTMLField(field, selectContainer);
  }

  comboAsHTML(oneField: WizardPageFieldDefinition, data: any): string {
    if (!oneField.optionProvider && (!oneField.properties || !oneField.properties.options)) {
      return this.textBoxAsHTML(oneField, data);
    }

    let iv = this.getInitialValue(oneField, data);
    let label: string = this.labelFor(oneField.id, oneField.label);
    let oninput = this.onInputFieldChanged(oneField.id);
    let disabled = (!this.isFieldEnabled(oneField, data) ? " disabled" : "");

    // actual combo here
    let text: string = "<input type=\"text\" name=\"" + oneField.id + "\" " +
      "list=\"" + oneField.id + "InternalList\" " +
      "id=\"" + oneField.id + "\"" +
      (iv ? "value=\"" + iv + "\"" : "") +
      disabled +
      oninput + "/>\n";
    let dataList: string = "<datalist id=\"" + oneField.id + "InternalList\">";
    let optList = null;
    if (oneField.optionProvider) {
      optList = oneField.optionProvider(data);
    }
    if (optList === null && oneField.properties && oneField.properties.options) {
      optList = oneField.properties?.options;
    }

    for (let oneOpt of optList) {
      let selected: boolean = iv ? (iv === oneOpt) : false;
      dataList = dataList + "   <option value=\"" + oneOpt + "\"" + (selected ? " selected" : "") + ">\n";
    }
    dataList = dataList + "</datalist>\n";


    let validationDiv = this.validationDiv(oneField.id, 0);
    let settingInput: string = this.divClass("setting__input", 0, label + text + dataList + validationDiv);
    let hint = "<p class=\"setting__hint\">" + (oneField.description ? oneField.description : "") + "</p>";
    return settingInput + hint;
  }

  onInputFieldChanged(id: string): string {
    return ` oninput="fieldChanged('${id}')" `;
  }

  onInputFieldChangedWithValue(id: string, val: string): string {
    return ` oninput="fieldChangedWithVal('${id}', ${val})"`;
  }

  validationDiv(id: string, tabs: number): string {
    const tabss = this.numTabs(tabs);
    return `${tabss}<div style="display:block;text-align:left;width:180px;" id="${id}Validation">&nbsp;</div>`;
  }

  labelFor(fieldId: string, labelVal: string): string {
    return `<label for="${fieldId}" style="display:block;text-align:left;width:125px;">${labelVal}</label>`
  }

  labelForNoStyle(fieldId: string, labelVal: string): string {
    return `<label for="${fieldId}">${labelVal}</label>`;
  }

  divClass(classname: string, tabs: number, inner: string): string {
    const tabss = this.numTabs(tabs);
    return `${tabss}<div class="${classname}">${inner}${tabss}</div>`;
  }

  numTabs(num: number): string {
    let ret: string = "";
    for (let i: number = 0; i < num; i++) {
      ret += "\t";
    }
    return ret;
  }

  isFieldEnabled(oneField: WizardPageFieldDefinition, data: any): boolean {
    return (oneField.properties && oneField.properties.disabled ? false : true);
  }

  getInitialValue(oneField: WizardPageFieldDefinition, data: any): string | undefined {
    if (data instanceof Map) {
      return data && data.get(oneField.id) ? data.get(oneField.id) : oneField.initialValue;
    }
    return data && data[oneField.id] ? data[oneField.id] : oneField.initialValue;
  }

  getFieldPlaceHolder(field: WizardPageFieldDefinition) {
    return !field.initialValue && field.placeholder ? field.placeholder : undefined;
  }

  wrapHTMLField(oneField: WizardPageFieldDefinition, fieldContent: string, labelAfterField = false, labelForNoStyle = false): string {
    // Generate label
    const label = labelForNoStyle ? this.labelForNoStyle(oneField.id, oneField.label) : this.labelFor(oneField.id, oneField.label);

    // Generate validation result area
    const id = oneField.id;
    const validationDiv = this.validationDiv(id, 0);

    // Generate the div class which embedds the label, input and validation result
    const inner = (labelAfterField ? fieldContent + label : label + fieldContent) + validationDiv;
    const settingInput = this.divClass("setting__input", 0, inner);

    // Generate the description hint area
    const description = oneField.description;
    const hint =
      `<p class="setting__hint">
        ${description || ""}
       </p>`;

    return settingInput + hint;
  }
}
