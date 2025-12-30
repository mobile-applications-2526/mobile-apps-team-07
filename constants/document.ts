import { CargoDocumentType, VesselDocumentType, VoyageDocumentType } from "@/types";

const MB = 1024 * 1024;

export const MAX_FILE_SIZE = {
    bytes: 25 * MB,
    string: '25 MB'
} as const; 

export const SUPPORTED_FORMATS = [
  'application/pdf',
  'image/png',
  'image/jpeg'
] as const;

export const SUPPORTED_EXTENSIONS = [
  '.pdf',
  '.png',
  '.jpeg',
  '.jpg'
] as const;

export const VESSEL_DOC_TYPES: { value: VesselDocumentType; label: string }[] = [
  { value: 'Q88', label: 'Q88' },
  { value: 'FormC', label: 'Form C' },
  { value: 'CharterParty', label: 'Charter Party' },
  { value: 'ClassCert', label: 'Class Certificate' },
  { value: 'CrewList', label: 'Crew List' },
  { value: 'InsuranceCert', label: 'Insurance Certificate' },
];

export const VOYAGE_DOC_TYPES: { value: VoyageDocumentType; label: string }[] = [
  { value: 'NoonReport', label: 'Noon Report' },
  { value: 'StatementOfFacts', label: 'Statement of Facts' },
  { value: 'NoticeOfReadiness', label: 'Notice of Readiness' },
  { value: 'LetterOfProtest', label: 'Letter of Protest' },
  { value: 'TimeSheet', label: 'Time Sheet' },
  { value: 'BunkerDeliveryNote', label: 'Bunker Delivery Note' },
  { value: 'LoadingPlan', label: 'Loading Plan' },
  { value: 'StowagePlan', label: 'Stowage Plan' },
  { value: 'DischargePlan', label: 'Discharge Plan' },
  { value: 'PortClearance', label: 'Port Clearance' },
  { value: 'CustomsDeclaration', label: 'Customs Declaration' },
  { value: 'SurveyorReport', label: 'Surveyor Report' },
];

export const CARGO_DOC_TYPES: { value: CargoDocumentType; label: string }[] = [
  { value: 'BillOfLading', label: 'Bill of Lading' },
  { value: 'CargoManifest', label: 'Cargo Manifest' },
  { value: 'CertificateOrigin', label: 'Certificate of Origin' },
  { value: 'PackingList', label: 'Packing List' },
  { value: 'UllageReport', label: 'Ullage Report' },
  { value: 'CommercialInvoice', label: 'Commercial Invoice' },
];
