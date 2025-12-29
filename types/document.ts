/**
 * Document Types
 * 
 * Type definitions for document-related data structures.
 */

export interface Document {
  id: number,
  documentType: DocumentType;
  documentName: string;
  documentDate: Date;
  fileUrl: string;
  remarks: string;
}

export type DocumentCategory = 
  | 'vessels'
  | 'voyages'
  | 'cargoes';

export type DocumentType =
  | VesselDocumentType
  | VoyageDocumentType
  | CargoDocumentType;

export type VesselDocumentType =
  | 'Q88'
  | 'FormC'
  | 'CharterParty'
  | 'ClassCert'
  | 'CrewList'
  | 'InsuranceCert';

export type VoyageDocumentType =
  | 'NoonReport'
  | 'StatementOfFacts'
  | 'NoticeOfReadiness'
  | 'LetterOfProtest'
  | 'TimeSheet'
  | 'BunkerDeliveryNote'
  | 'LoadingPlan'
  | 'StowagePlan'
  | 'DischargePlan'
  | 'PortClearance'
  | 'CustomsDeclaration'
  | 'SurveyorReport';

export type CargoDocumentType =
  | 'BillOfLading'
  | 'CargoManifest'
  | 'CertificateOrigin'
  | 'PackingList'
  | 'UllageReport'
  | 'CommercialInvoice';
