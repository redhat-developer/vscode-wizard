import { IWizardPage } from './IWizardPage';
import { WizardPage } from './WizardPage';
import { WizardPageDefinition, isWizardPageFieldDefinition, isWizardPageSectionDefinition, ValidatorResponse, SEVERITY, FieldDefinitionState } from './WebviewWizard';
import { Template } from './pageImpl';
import { StandardWizardPageRenderer } from './StandardWizardPageRenderer';
import { IWizardPageRenderer } from './IWizardPageRenderer';
import { WizardDefinition, WizardPageFieldDefinition, WizardPageSectionDefinition } from '.';
export class WebviewWizardPage extends WizardPage implements IWizardPage {

    initializedRenderer: IWizardPageRenderer;
    pageDefinition:WizardPageDefinition;
    wizardDefinition:WizardDefinition;
    fieldStateCache: Map<string,FieldDefinitionState> = new Map<string,FieldDefinitionState>();

    constructor(pageDefinition: WizardPageDefinition, wizardDefinition: WizardDefinition) {
        super(pageDefinition.id, pageDefinition.title, pageDefinition.description);
        this.wizardDefinition = wizardDefinition;
        this.pageDefinition = pageDefinition;
        super.setFocusedField(this.findFocusedField());
        this.initializeStateCache();
        this.initializedRenderer = this.createRenderer();
    }

    private initializeStateCache() {
        for( let field of this.pageDefinition.fields) {
            if( this.isWizardPageSectionDefinition(field)) {
                for( let childField of field.childFields) {
                    if( childField.initialState ) {
                        this.fieldStateCache.set(childField.id, childField.initialState);
                    }
                }
            } else if( field.initialState ) {
                this.fieldStateCache.set(field.id, field.initialState);
            }
        }
    }

    private isWizardPageSectionDefinition(def: WizardPageFieldDefinition | WizardPageSectionDefinition): def is WizardPageSectionDefinition {
        return (def as any).childFields !== undefined
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

    /**
     * Validate the wizard page by updating the page complete flag only.
     *
     * @param parameters the current parameters.
     * @param previousParameters the previous parameters.
     */
    validateAndUpdatePageComplete(parameters: any, previousParameters: any): void {
      const hasError = this.getValidationStatus(parameters, previousParameters);
      this.setPageComplete(!hasError);
    }

    private async getValidationStatus(parameters: any, previousParameters: any) : Promise<boolean> {
      const resp = await this.doValidate(parameters, previousParameters);
      return (resp && resp.items && resp.items.some(item => item.severity === SEVERITY.ERROR)) || false;
    }

    private async doValidate(parameters: any, previousParameters: any) : Promise<ValidatorResponse | undefined> {
      if (this.pageDefinition.validator) {
        return this.pageDefinition.validator.call(null, parameters, previousParameters);
      }
    }

    /**
     * Validate the wizard page by updating the page complete flag and collect HTML content to update (as Template) for :
     *  - validation messages.
     *  - widget to redraw according a state (not enabled, not visible, etc)
     *
     * @param parameters the current parameters.
     * @param previousParameters the previous parameters.
     *
     * @returns Template collection
     */
    async getValidationTemplates(parameters:any, previousParameters: any) : Promise<Template[]> {
        this.setPageComplete(true);
        return await this.validate(parameters, previousParameters);
    }

    private severityToImage(severity: SEVERITY): string {
      switch (severity) {
        case SEVERITY.ERROR:
          return '<i class="icon icon__error"></i>';
        case SEVERITY.WARN:
          return '<i class="icon icon__warn"></i>';
        case SEVERITY.INFO:
          return '<i class="icon icon__info"></i>';
        default:
          return "";
      }
    }

    private severityToCSSClass(severity: SEVERITY): string {
      switch (severity) {
        case SEVERITY.ERROR:
          return 'error-message';
        case SEVERITY.WARN:
          return 'warn-message';
        case SEVERITY.INFO:
          return 'info-message';
        default:
          return "";
      }
    }

    private async validate(parameters: any, previousParameters: any): Promise<Template[]> {
        let templates: Template[] = [];
        const resp = await this.doValidate(parameters, previousParameters);
        if (resp) {

            // If validation has returned any widgets to refresh, we should do that now
            if( resp.fieldRefresh ) {
              for (let [key, value] of resp.fieldRefresh) {
                  let def : WizardPageFieldDefinition | null = this.findFieldDefinition(key);
                  let currentState: FieldDefinitionState | undefined = this.fieldStateCache.get(key);
                  if( currentState === undefined || currentState === null ) {
                      currentState = {};
                      this.fieldStateCache.set(key,currentState);
                  }
                  let stateChanged = false;
                  if (value.hasOwnProperty("enabled")) {
                    stateChanged = currentState.enabled !== value.enabled;
                    currentState.enabled = value.enabled;
                  }
                  if (value.hasOwnProperty("visible")) {
                    stateChanged = stateChanged || currentState.visible !== value.visible;
                    currentState.visible = value.visible;
                  }
                  if (def !== null && stateChanged) {
                    let str: string = this.getRenderer().oneFieldAsString(def, parameters);
                    templates = templates.concat({ id: key + "Field", content: str });
                  }
              }
            }

            for( let item of resp.items ) {
              const {severity, template} = item;
              // Allow users to just put the failed field id here. We add Validation
              if (!template.id.endsWith("Validation")) {
                template.id = template.id + "Validation";
              }
              if (severity === SEVERITY.ERROR) {
                this.setPageComplete(false);
              }
              const img: string = this.severityToImage(severity);
              const cssClass = this.severityToCSSClass(severity);
              template.content = `<div class="${cssClass}">${img}${template.content || "&nbsp;"}</div>`;
              templates = templates.concat(template);
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
      if( this.initializedRenderer !== undefined ) 
        this.initializedRenderer = this.createRenderer();
      return this.initializedRenderer;
    }
    createRenderer(): IWizardPageRenderer {
      let r : IWizardPageRenderer;
        if( this.wizardDefinition && this.wizardDefinition.renderer) {
            r = this.wizardDefinition.renderer;
        } else {
          r = new StandardWizardPageRenderer();
        }
        r.initialize(this.fieldStateCache);
        return r;
    }

    getContentAsHTML(data: any): string {
        return this.getRenderer().getContentAsHTML(this.pageDefinition, data);
    }
}
