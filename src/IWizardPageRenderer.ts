import { WizardPageDefinition, WizardPageFieldDefinition, WizardPageSectionDefinition } from "./WebviewWizard";

export interface IWizardPageRenderer {
  getContentAsHTML(definition:WizardPageDefinition, data: any): string;
  oneSectionAsString(oneSection:WizardPageSectionDefinition, data: any): string;
  oneFieldAsString(oneField: WizardPageFieldDefinition, data: any) : string
}