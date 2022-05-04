import { FieldDefinitionState, WizardPageDefinition, WizardPageFieldDefinition, WizardPageSectionDefinition } from "./WebviewWizard";

export interface IWizardPageRenderer {
  initialize(state: Map<string,FieldDefinitionState>): void;
  getContentAsHTML(definition:WizardPageDefinition, data: any): string;
  oneSectionAsString(oneSection:WizardPageSectionDefinition, data: any): string;
  oneFieldAsString(oneField: WizardPageFieldDefinition, data: any) : string
}