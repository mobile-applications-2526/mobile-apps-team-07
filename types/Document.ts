/**
 * Document Types
 * 
 * Type definitions for document-related data structures.
 */

export interface Document {
  id: number,
  documentType: DocumentTypeCategory;
  documentNumber: string;
  documentDate: Date;
  fileUrl: string;
  remarks: string;
}

export type DocumentTypeCategory =   
  | 'Q88'
  | 'FormC'
  | 'ClassCert'
  | 'CharterParty'
  | 'BillOfLading'
  | 'CargoManifest'
  | 'CertificateOrigin'
  | 'PackingList'
  | 'CommercialInvoice'
  | 'StatementFacts'
  | 'NoticeReadiness'
  | 'LetterProtest'
  | 'SurveyorReport'
  | 'UllageReport'
  | 'TimeSheet'
  | 'BunkerDeliveryNote'
  | 'LoadingPlan'
  | 'StowagePlan'
  | 'DischargePlan'
  | 'PortClearance'
  | 'CustomsDeclaration'
  | 'CrewList';

