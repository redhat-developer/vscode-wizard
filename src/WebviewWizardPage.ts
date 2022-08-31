import { IWizardPage } from './IWizardPage';
import { WizardPage } from './WizardPage';
import { WizardPageDefinition, isWizardPageFieldDefinition, isWizardPageSectionDefinition, ValidatorResponse, SEVERITY, FieldDefinitionState, CompoundValidatorResponse } from './WebviewWizard';
import { AsyncMessageCallback, HandlerResponse, Template } from './pageImpl';
import { StandardWizardPageRenderer } from './StandardWizardPageRenderer';
import { IWizardPageRenderer } from './IWizardPageRenderer';
import { AsyncWizardPageValidator, ValidatorResponseItem, WizardDefinition, WizardPageFieldDefinition, WizardPageSectionDefinition, WizardPageValidator } from '.';
export class WebviewWizardPage extends WizardPage implements IWizardPage {

    initializedRenderer: IWizardPageRenderer;
    pageDefinition:WizardPageDefinition;
    wizardDefinition:WizardDefinition;
    fieldStateCache: Map<string,FieldDefinitionState> = new Map<string,FieldDefinitionState>();
    mostRecentValidationCall: number = Date.now();

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

    private getValidationCompoundResponse(parameters: any, previousParameters: any) : CompoundValidatorResponse {
      const compoundResponse: CompoundValidatorResponse = {
        syncResponse: {items: []},
        asyncResponses: [],
      };
      if( this.pageDefinition.asyncValidator) {
        const v: AsyncWizardPageValidator = this.pageDefinition.asyncValidator;
        const ret: Promise<ValidatorResponse>[] = v.call(null, parameters, previousParameters);
        compoundResponse.asyncResponses = ret;
      }
      if (this.pageDefinition.validator) {
        const v: WizardPageValidator = this.pageDefinition.validator;
        const ret: ValidatorResponse = v.call(null, parameters, previousParameters);
        compoundResponse.syncResponse = ret;
      }
      return compoundResponse;
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
    async firePageValidationTemplates(callback: AsyncMessageCallback, parameters:any, previousParameters: any) : Promise<void> {
        this.setPageComplete(false);
        await this.validatePageAndFire(callback, parameters, previousParameters);
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

    validatorResponseHasError(resp: ValidatorResponse): boolean {
      return resp && resp.items ? resp.items.filter((x) => x.severity === SEVERITY.ERROR).length > 0 : false;
    }
    private async validatePageAndFire(callback: AsyncMessageCallback, parameters: any, previousParameters: any): Promise<void> {
      const currentTime = Date.now();
      this.mostRecentValidationCall = currentTime;
      const toHandlerResponse = (x: Template[]): HandlerResponse => { return {returnObject: {}, templates: x }};
      const username = parameters.addusername;
      // TODO this.setPageComplete(false);
      // await callback.call(null, this.templatesToHandlerResponse(validations, false));
      const resp: CompoundValidatorResponse = this.getValidationCompoundResponse(parameters, previousParameters);
      // TODO to make this truly async, we would try to make sure that as different 
      // validations resolve, we can fire off those changes to the UI.
      // For now, we'll just wait for them here and send the update. 
      const collector: Template[] = [];
      let complete = true;
      if( resp.syncResponse) {
        complete = complete && !this.validatorResponseHasError(resp.syncResponse);
        this.setPageComplete(complete);
        const syncTemplates: Template[] = this.validatorResponseToTemplates(resp.syncResponse, parameters);
        collector.push(...syncTemplates);
        //console.log("Calling sync templates: username=" + username + ";  " + JSON.stringify(syncTemplates));
        if( this.mostRecentValidationCall === currentTime)
          await callback.call(null, toHandlerResponse(syncTemplates));
      }

      // TODO handle these consecutively
      for( let i = 0; resp.asyncResponses && i < resp.asyncResponses.length; i++ ) {
        const oneAsync: Promise<ValidatorResponse> = resp.asyncResponses[i];
        oneAsync.then(async (x: ValidatorResponse) => {
          complete = complete && !this.validatorResponseHasError(x);
          this.setPageComplete(complete);
          const xTemplates: Template[] = this.validatorResponseToTemplates(x, parameters);
          collector.push(...xTemplates);
          //console.log("Calling async templates: username=" + username + ";  " + JSON.stringify(xTemplates));
          if( this.mostRecentValidationCall === currentTime)
            await callback.call(null, toHandlerResponse(xTemplates));
        });
      }
      await Promise.all(resp.asyncResponses);
      //console.log("Done waiting");
      const clearOld: Template[] = this.getClearAllEmptyFieldValidationsTemplates(parameters, collector);
      //console.log("Calling clear templates: username=" + username + ";  " + JSON.stringify(clearOld));
      if( this.mostRecentValidationCall === currentTime)
        await callback.call(null, toHandlerResponse(clearOld));
    }

    private getClearAllEmptyFieldValidationsTemplates(parameters: any, existing: Template[]): Template[] {
      const templates: Template[] = [];

        // All the official ones were added.
        // Now lets clear out all the empty ones
        for (let key of this.pageDefinition.fields) {
          if( isWizardPageSectionDefinition(key)) {
              for (let key2 of key.childFields) {
                if( !this.containsTemplate(key2.id, existing)) {
                  templates.push({ id: key2.id + "Validation", content: "&nbsp;"});
                }
              }
          } else if( isWizardPageFieldDefinition(key)) {
            if( !this.containsTemplate(key.id, existing)) {
              templates.push({ id: key.id + "Validation", content: "&nbsp;"});
            }
          }
      }
      return templates;
    }

    private validatorResponseToTemplates(resp:ValidatorResponse|undefined, parameters: any): Template[] {
      let templates: Template[] = [];
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
                  if (value.hasOwnProperty("forceRefresh")) {
                    stateChanged = true;
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
