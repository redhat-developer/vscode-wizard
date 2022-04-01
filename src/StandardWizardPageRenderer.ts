import { WizardPageDefinition, WizardPageFieldDefinition, isWizardPageFieldDefinition, isWizardPageSectionDefinition, WizardPageSectionDefinition, ValidatorResponse, createButton, WizardPageFieldOptionLabelProvider, FieldDefinitionState } from './WebviewWizard';
import { IWizardPageRenderer } from './IWizardPageRenderer';
import { WizardPageFieldOptionProvider } from '.';

interface ListComboGenerationCallback {
  generate(listId: string, value: string, label: string, selected: boolean): string;
}
class SelectComboCallback implements ListComboGenerationCallback {
  generate(_listId: string, value: string, label: string, selected: boolean): string {
    return `<option${value ? ` value="${value}"` : ""}${selected ? " selected" : ""}>${label}</option>`;
  }
}
class ListComboCallback implements ListComboGenerationCallback {
  generate(listId: string, value: string, label: string, selected: boolean): string {
    const valueStr = value ? ` data-value="${value}"` : "";
    const onClick = `selectComboElement('${listId}', this)`;
    const onmouseover=`onmouseover="highlightComboElement('${listId}', this)" `;
    return `<li class="li-style" data-display="false" onclick="${onClick}" ${onmouseover} ${valueStr}>${label}</li>`;
  }
}
export class StandardWizardPageRenderer implements IWizardPageRenderer {
  private stateMap: Map<string,FieldDefinitionState>;
  constructor(state: Map<string,FieldDefinitionState>) {
    this.stateMap = state;
  }
  getContentAsHTML(definition: WizardPageDefinition, data: any): string {
    let htmlContent = "";
    for (let field of definition.fields) {
      if (isWizardPageSectionDefinition(field)) {
        htmlContent += this.oneSectionAsString(field, data);
      } else if (isWizardPageFieldDefinition(field)) {
        htmlContent += this.wrapOneFieldAsString(field, data, this.oneFieldAsString(field, data));
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
        return renderer.wrapOneFieldAsString(field, data, renderer.oneFieldAsString(field, data));
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
    return this.createHTMLField(field, data);
  }

  wrapOneFieldAsString(field: WizardPageFieldDefinition, data: any, contents: string): string {
    const fieldId = field.id;
    if (this.isFieldVisible(field, data)) {
      return this.divClassId("setting", fieldId + "Field", contents);
    }
    return this.divClassId("setting", fieldId + "Field", "");
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
      case "multiselect":
        return this.multiSelectAsHTML(field, data);
      case "combo":
        return this.comboAsHTML(field, data);
      case "file-picker":
        return this.filePickerAsHTML(field, data);
      default:
        return "";
    }
  }

  textBoxAsHTML(field: WizardPageFieldDefinition, data: any): string {
    const id = field.id;
    const value = this.getInitialValue(field, data);
    const disabled = !this.isFieldEnabled(field, data);
    const placeholder = this.getFieldPlaceHolder(field);
    const jsFunction = this.getOnModificationJavascript(field, "fieldChanged(this)");
    const htmlInput =
      `<input id="${id}"
              name="${id}"
              type="text"
              ${value !== undefined ? `value="${value}"` : ""}
              ${disabled ? "disabled" : ""}
              ${placeholder ? `placeholder="${placeholder}"` : ""}
              oninput="${jsFunction}"
              data-setting data-setting-preview >`;

    return this.wrapHTMLField(field, disabled, htmlInput);
  }

  numberAsHTML(field: WizardPageFieldDefinition, data: any): string {
    const id = field.id;
    const value = this.getInitialValue(field, data);
    const disabled = !this.isFieldEnabled(field, data);
    const placeholder = this.getFieldPlaceHolder(field);
    const jsFunction = this.getOnModificationJavascript(field, "fieldChanged(this)");

    const htmlInput =
      `<input id="${id}"
              name="${id}"
              type="number"
              ${value !== undefined ? `value="${value}"` : ""}
              ${disabled ? "disabled" : ""}
              ${placeholder ? `placeholder="${placeholder}"` : ""}
              oninput="${jsFunction}"
              data-setting data-setting-preview >`;

    return this.wrapHTMLField(field, disabled, htmlInput);
  }

  passwordAsHTML(field: WizardPageFieldDefinition, data: any): string {
    const id = field.id;
    const value = this.getInitialValue(field, data);
    const disabled = !this.isFieldEnabled(field, data);
    const placeholder = this.getFieldPlaceHolder(field);
    const jsFunction = this.getOnModificationJavascript(field, "fieldChanged(this)");

    const htmlInput =
      `<input id="${id}"
              name="${id}"
              type="password"
              ${value !== undefined ? `value="${value}"` : ""}
              ${disabled ? "disabled" : ""}
              ${placeholder ? `placeholder="${placeholder}"` : ""}
              oninput="${jsFunction}"
              data-setting data-setting-preview >`;

    return this.wrapHTMLField(field, disabled, htmlInput);
  }

  checkBoxAsHTML(field: WizardPageFieldDefinition, data: any): string {
    const id = field.id;
    const value = this.getInitialValue(field, data);
    const checked = value && value !== '' && value !== undefined;
    const disabled = !this.isFieldEnabled(field, data);
    const placeholder = this.getFieldPlaceHolder(field);
    const jsFunction = this.getOnModificationJavascript(field, "fieldChanged(this, this.checked)");

    const htmlInput =
      `<input id="${id}"
              name="${id}"
              type="checkbox"
              ${value !== undefined ? `value="${value}"` : ""}
              ${disabled ? "disabled" : ""}
              ${placeholder ? `placeholder="${placeholder}"` : ""}
              oninput="${jsFunction}"
              ${checked ? "checked" : ""}
              data-setting data-setting-preview >`;

    return this.wrapHTMLField(field, disabled, htmlInput, true, true);
  }

  textAreaAsHTML(field: WizardPageFieldDefinition, data: any): string {
    const id = field.id;
    const value = this.getInitialValue(field, data);
    const disabled = !this.isFieldEnabled(field, data);
    const placeholder = this.getFieldPlaceHolder(field);
    const cols = field.properties?.columns;
    const rows = field.properties?.rows;
    const jsFunction = this.getOnModificationJavascript(field, "fieldChanged(this)");

    const htmlTextarea =
      `<textarea id="${id}"
                 name="${id}"
                 ${cols ? `cols="${cols}"` : ""}
                 ${rows ? `rows="${rows}"` : ""}
                 ${disabled ? "disabled" : ""}
                 ${placeholder ? `placeholder="${placeholder}"` : ""}
                 oninput="${jsFunction}"
                 data-setting data-setting-preview >${value || ""}</textarea>`;

    return this.wrapHTMLField(field, disabled, htmlTextarea);
  }

  radioGroupAsHTML(field: WizardPageFieldDefinition, data: any): string {
    const id = field.id;
    const value = this.getInitialValue(field, data);
    const disabled = !this.isFieldEnabled(field, data);
    const options = this.getFieldOptions(field, data);
    // TODO um... how to handle radio group for overriding javascript??
    const renderer = this;
    const htmlInputs = options?.map(
      function (option: any) {
        const checked: boolean = value !== undefined ? (value === option) : false;
        const r = `<input id="${option}"
                       name="${id}"
                       type="radio"
                       ${disabled ? "disabled" : ""}
                       oninput="fieldChangedKeyVal('${id}', '${option}')"
                       ${checked ? "checked" : ""} >
                       ${renderer.labelForInlineStyle(option, "padding-right: 10px;", option)}`;
        return r;
      }).join("\n");
    const htmlInputsContainer = this.divClass("radio-container", htmlInputs);
    return this.wrapHTMLField(field, disabled, htmlInputsContainer);
  }

  selectAsHTML(field: WizardPageFieldDefinition, data: any): string {
    const id = field.id;
    const value = this.getInitialValue(field, data);
    const disabled = !this.isFieldEnabled(field, data);
    const htmlOptions = this.generateHTMLOptions(field, data, new SelectComboCallback());
    const jsFunction = this.getOnModificationJavascript(field, "fieldChanged(this)");

    const htmlSelect =
      `<select id="${id}"
               name="${id}"
               ${disabled ? "disabled" : ""}
               oninput="${jsFunction}"
               data-setting >
               ${htmlOptions}
       </select>`;

    const selectContainer = this.divClass("select-container", htmlSelect);
    return this.wrapHTMLField(field, disabled, selectContainer);
  }


  multiSelectAsHTML(field: WizardPageFieldDefinition, data: any): string {
    const id = field.id;
    const disabled = !this.isFieldEnabled(field, data);
    const htmlOptions = this.generateHTMLMultiOptions(field, data);
    const jsFunction = this.getOnModificationJavascript(field, 'fieldChanged(this,Array.apply(null, this.options).filter(o => o.selected).map(o => o.value).join(`\n`))');

    const htmlSelect =
      `<select id="${id}"
               name="${id}"
               ${disabled ? "disabled" : ""}
               oninput="${jsFunction}"
               data-setting multiple>
               ${htmlOptions}
       </select>`;

    const selectContainer = this.divClass("select-container", htmlSelect);
    return this.wrapHTMLField(field, disabled, selectContainer);
  }

  comboAsHTML(field: WizardPageFieldDefinition, data: any): string {
    if (!field.optionProvider && (!field.properties || !field.properties.options)) {
      return this.textBoxAsHTML(field, data);
    }

    const id = field.id;
    const value = this.getInitialValue(field, data);
    const disabled = !this.isFieldEnabled(field, data);
    const placeholder = this.getFieldPlaceHolder(field);
    const htmlOptions = this.generateHTMLOptions(field, data, new ListComboCallback());
    const jsFunction = this.getOnModificationJavascript(field, `comboFieldChanged('${id}')`);
    const onload = `initComboField('${id}')`;
    const htmlcombo =`<ul class="ul-color ul-size select-list-group" id="${id}_listgroup">
    <li class="li-style">
        <input type="text" 
                id="${id}" 
                name="${id}"
                ${value !== undefined ? `value="${value}"` : ""}
                ${disabled ? "disabled" : ""}
                data-onload="${onload}"
                placeholder="${placeholder || ""}" 
                onfocusout="hideComboList('${id}')"
                oninput="${jsFunction}"/>
        <ul class="ul-color ul-position" data-toggle="false" id="${id}_innerUL">
          ${htmlOptions}
        </ul>
     </li>
</ul>`;
    return this.wrapHTMLField(field, disabled, htmlcombo);
  }

  filePickerAsHTML(field: WizardPageFieldDefinition, data: any): string {
    const id = field.id;
    const value = this.getInitialValue(field, data);
    const disabled = !this.isFieldEnabled(field, data);
    const placeholder = this.getFieldPlaceHolder(field);
    const options = field.dialogOptions ? JSON.stringify(field.dialogOptions).replace(/"/g, "'") : undefined;
    const jsFunction = this.getOnModificationJavascript(field, "fieldChanged(this)");

    const htmlInput =
      `<input id="${id}"
              name="${id}"
              type="text"
              ${value !== undefined ? `value="${value}"` : ""}
              ${disabled ? "disabled" : ""}
              ${placeholder ? `placeholder="${placeholder}"` : ""}
              oninput="${jsFunction}"
              data-setting data-setting-preview >
       ${createButton(undefined, `openFileDialog('${id}'${options ? `, ${options}` : ""})`, !disabled, "Browse...")}`;

    return this.wrapHTMLField(field, disabled, htmlInput);
  }

  validationDiv(id: string): string {
    return `<div id="${id}Validation">&nbsp;</div>`;
  }

  labelFor(fieldId: string, labelVal: string): string {
    return `<label for="${fieldId}" style="display:block;text-align:left;min-width:125px;max-width:125px;overflow-wrap:anywhere">${labelVal}</label>`
  }

  labelForNoStyle(fieldId: string, labelVal: string): string {
    return `<label for="${fieldId}">${labelVal}</label>`;
  }

  labelForInlineStyle(fieldId: string, style: string, labelVal: string): string {
    return `<label for="${fieldId}" style="${style}">${labelVal}</label>`;
  }

  divClass(classname: string, inner: string, disabled = false): string {
    return `<div class="${classname}"${disabled ? " disabled" : ""}>${inner}</div>`;
  }

  divClassId(classname: string, id: string, inner: string): string {
    return `<div class="${classname}" id="${id}">${inner}</div>`;
  }

  isFieldEnabled(oneField: WizardPageFieldDefinition, data: any): boolean {
    let state: FieldDefinitionState | undefined = this.stateMap.get(oneField.id);
    if( state !== undefined && state.hasOwnProperty("enabled")) {
      return state.enabled == undefined ? true : state.enabled;
    }
    return (oneField.properties && oneField.properties.disabled ? false : true);
  }

  isFieldVisible(field: WizardPageFieldDefinition, data: any): boolean {
    let state: FieldDefinitionState | undefined = this.stateMap.get(field.id);
    return state === undefined ? true : state.visible === undefined ? true : state.visible;
  }

  getInitialValue(oneField: WizardPageFieldDefinition, data: any): string | undefined {
    if (data instanceof Map) {
      return data && data.has(oneField.id) ? data.get(oneField.id) : oneField.initialValue;
    }
    return data && data.hasOwnProperty(oneField.id) ? data[oneField.id] : oneField.initialValue;
  }

  getOnModificationJavascript(oneField: WizardPageFieldDefinition, defaultScript: string): string | undefined {
    if( oneField.executableJavascriptOnModification ) {
      return oneField.executableJavascriptOnModification;
    }
    return defaultScript;
  }

  getFieldPlaceHolder(field: WizardPageFieldDefinition) {
    return field.placeholder;
  }

  getFieldOptions(field: WizardPageFieldDefinition, data: any) {
    if (field.optionProvider) {
      const optionProvider = this.getFieldOptionLabelProvider(field);
      return optionProvider ? optionProvider.getItems(data) : (<WizardPageFieldOptionProvider>field.optionProvider)(data);
    }
    return field.properties?.options;
  }

  getFieldOptionLabelProvider(field: WizardPageFieldDefinition): WizardPageFieldOptionLabelProvider | undefined {
    if (field.optionProvider) {
      const optionProvider = field.optionProvider;
      if ((optionProvider as any).getItems) {
        return (<WizardPageFieldOptionLabelProvider>optionProvider);
      }
    }
  }

  wrapHTMLField(oneField: WizardPageFieldDefinition, disabled : boolean, fieldContent: string, labelAfterField = false, labelForNoStyle = false): string {
    // Generate label
    const label = labelForNoStyle ? this.labelForNoStyle(oneField.id, oneField.label) : this.labelFor(oneField.id, oneField.label);

    // Generate validation result area
    const id = oneField.id;
    const validationDiv = this.validationDiv(id);

    // Generate the div class which embedds the label, input and validation result
    const inner = (labelAfterField ? fieldContent + label : label + fieldContent) + validationDiv;
    const settingInput = this.divClass("setting__input", inner, disabled);

    // Generate the description hint area
    const description = oneField.description;
    const hint =
      `<p class="setting__hint">
        ${description || ""}
       </p>`;

    return settingInput + hint;
  }

  generateHTMLOptions(field: WizardPageFieldDefinition, data: any, callback: ListComboGenerationCallback): string {
    const value = this.getInitialValue(field, data);
    const optionLabelProvider = this.getFieldOptionLabelProvider(field);
    const options = this.getFieldOptions(field, data);

    const htmlOptions = options?.map(
      function (option: any) {
        const optionValue = optionLabelProvider && optionLabelProvider.getValueItem ? optionLabelProvider.getValueItem(option) : undefined;
        const optionLabel = optionLabelProvider ? optionLabelProvider.getLabelItem(option) : option;
        const selected: boolean = value !== undefined ? (optionValue ? value === optionValue : value === optionLabel) : false;
        return callback.generate(field.id, optionValue || "", optionLabel, selected);
      }).join("");

    return htmlOptions;
  }

  generateHTMLMultiOptions(field: WizardPageFieldDefinition, data: any): string {
    const v1 = this.getInitialValue(field, data);
    let values : string[] = [];
    if( v1 !== undefined ) {
      values = v1.split("\n");
    }

    const optionLabelProvider = this.getFieldOptionLabelProvider(field);
    const options = this.getFieldOptions(field, data);

    const htmlOptions = options?.map(
      function (option: any) {
        const optionValue = optionLabelProvider && optionLabelProvider.getValueItem ? optionLabelProvider.getValueItem(option) : undefined;
        const optionLabel = optionLabelProvider ? optionLabelProvider.getLabelItem(option) : option;
        const selected: boolean = optionValue ? values?.includes(optionValue) : values?.includes(optionLabel);
        return `<option${optionValue ? ` value="${optionValue}"` : ""}${selected ? " selected" : ""}>${optionLabel}</option>`;
      }).join("");

    return htmlOptions;
  }
}
