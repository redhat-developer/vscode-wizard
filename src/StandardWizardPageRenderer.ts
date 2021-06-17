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
    return this.divClass("setting", htmlField);
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
              type="text"
              ${value ? `value="${value}"` : ""}
              ${disabled ? "disabled" : ""}
              ${placeholder ? `placeholder="${placeholder}"` : ""}
              oninput="fieldChanged(this)"
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
              type="number"
              ${value ? `value="${value}"` : ""}
              ${disabled ? "disabled" : ""}
              ${placeholder ? `placeholder="${placeholder}"` : ""}
              oninput="fieldChanged(this)"
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
              type="password"
              ${value ? `value="${value}"` : ""}
              ${disabled ? "disabled" : ""}
              ${placeholder ? `placeholder="${placeholder}"` : ""}
              oninput="fieldChanged(this)"
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
              type="checkbox"
              ${value ? `value="${value}"` : ""}
              ${disabled ? "disabled" : ""}
              ${placeholder ? `placeholder="${placeholder}"` : ""}
              oninput="fieldChanged(this, this.checked)"
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
                 oninput="fieldChanged(this)"
                 data-setting data-setting-preview >${value || ""}</textarea>`;

    return this.wrapHTMLField(field, htmlTextarea);
  }

  radioGroupAsHTML(field: WizardPageFieldDefinition, data: any): string {
    const id = field.id;
    const value = this.getInitialValue(field, data);
    const disabled = !this.isFieldEnabled(field, data);
    const options = this.getFieldOptions(field, data);

    const renderer = this;
    const htmlInputs = options?.map(
      function (option: any) {
        const checked: boolean = value ? (value === option) : false;
        return `<input id="${option}"
                       name="${id}"
                       type="radio"
                       ${disabled ? "disabled" : ""}
                       oninput="fieldChanged(this, '${option}')"
                       ${checked ? "checked" : ""}>
                       ${renderer.labelForNoStyle(option, option)} >`;
      }).join("");

    const htmlInputsContainer = this.divClass("select-container", htmlInputs);
    return this.wrapHTMLField(field, htmlInputsContainer);
  }

  selectAsHTML(field: WizardPageFieldDefinition, data: any): string {
    const id = field.id;
    const value = this.getInitialValue(field, data);
    const disabled = !this.isFieldEnabled(field, data);

    const options = this.getFieldOptions(field, data);
    const htmlOptions = options?.map(
      function (option: any) {
        const selected: boolean = value ? (value === option) : false;
        return `<option${selected ? " selected" : ""}>${option}</option>`;
      }).join("");

    const htmlSelect =
      `<select id="${id}"
               name="${id}"
               ${disabled ? "disabled" : ""}
               oninput="fieldChanged(this)"
               data-setting >
               ${htmlOptions}
       </select>`;

    const selectContainer = this.divClass("select-container", htmlSelect);
    return this.wrapHTMLField(field, selectContainer);
  }

  comboAsHTML(field: WizardPageFieldDefinition, data: any): string {
    if (!field.optionProvider && (!field.properties || !field.properties.options)) {
      return this.textBoxAsHTML(field, data);
    }

    const id = field.id;
    const value = this.getInitialValue(field, data);
    const disabled = !this.isFieldEnabled(field, data);
    const placeholder = this.getFieldPlaceHolder(field);

    const options = this.getFieldOptions(field, data);
    const htmlOptions = options?.map(
      function (option: any) {
        const selected: boolean = value ? (value === option) : false;
        return `<option value="${option}"${selected ? " selected" : ""}>`;
      }).join("");

    const listId = `${id}InternalList`;
    const htmlcombo =
      `<input id="${id}"
              name="${id}"
              type="text"
              list="${listId}"
              ${value ? `value="${value}"` : ""}
              ${disabled ? "disabled" : ""}
              ${placeholder ? `placeholder="${placeholder}"` : ""}
              oninput="fieldChanged(this)" >
       <datalist id="${listId}">
        ${htmlOptions}
       </datalist>`;

    return this.wrapHTMLField(field, htmlcombo);
  }

  validationDiv(id: string): string {
    return `<div style="display:block;text-align:left;width:180px;" id="${id}Validation">&nbsp;</div>`;
  }

  labelFor(fieldId: string, labelVal: string): string {
    return `<label for="${fieldId}" style="display:block;text-align:left;width:125px;">${labelVal}</label>`
  }

  labelForNoStyle(fieldId: string, labelVal: string): string {
    return `<label for="${fieldId}">${labelVal}</label>`;
  }

  divClass(classname: string, inner: string): string {
    return `<div class="${classname}">${inner}</div>`;
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

  getFieldOptions(field: WizardPageFieldDefinition, data: any) {
    if (field.optionProvider) {
      return field.optionProvider(data);
    }
    return field.properties?.options;
  }

  wrapHTMLField(oneField: WizardPageFieldDefinition, fieldContent: string, labelAfterField = false, labelForNoStyle = false): string {
    // Generate label
    const label = labelForNoStyle ? this.labelForNoStyle(oneField.id, oneField.label) : this.labelFor(oneField.id, oneField.label);

    // Generate validation result area
    const id = oneField.id;
    const validationDiv = this.validationDiv(id);

    // Generate the div class which embedds the label, input and validation result
    const inner = (labelAfterField ? fieldContent + label : label + fieldContent) + validationDiv;
    const settingInput = this.divClass("setting__input", inner);

    // Generate the description hint area
    const description = oneField.description;
    const hint =
      `<p class="setting__hint">
        ${description || ""}
       </p>`;

    return settingInput + hint;
  }
}
