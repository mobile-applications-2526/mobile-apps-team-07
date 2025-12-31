/**
 * Document Processing Types
 *
 * Type definitions for document OCR processing and data extraction.
 * Must match the backend DocumentType, ExtractionMethod, and ProcessingStatus enums.
 */

// Document types supported by the OCR processing backend
export type ProcessingDocumentType =
  | 'Q88'            // INTERTANKO Vessel questionnaire
  | 'FormC'          // Gas Form-C - LPG carriers only
  | 'NoonReport'     // Daily vessel status reports
  | 'NOR'            // Notice of Readiness
  | 'CharterParty'   // TC or VC charter agreements
  | 'PortClearance'  // Port departure documents
  | 'BL'             // Bill of Lading
  | 'CargoManifest'  // Cargo manifest
  | 'SOF'            // Statement of Facts
  | 'Other';         // Unclassified documents

// Extraction method used by the backend
export type ExtractionMethod =
  | 'OCR'             // PaddleOCR for scanned documents
  | 'TEXT_EXTRACTION' // Direct text extraction from PDF/Word
  | 'REGEX'           // Pattern-based extraction
  | 'ML_MODEL'        // Machine learning model
  | 'TEMPLATE'        // Template-based extraction
  | 'MANUAL';         // Manual entry

// Supported file formats for upload
export type FileFormat = 'PDF' | 'XLSX' | 'XLS' | 'DOCX' | 'PNG' | 'JPEG' | 'TIFF';

// Processing status from backend
export type ProcessingStatus =
  | 'PENDING'         // Queued for processing
  | 'PROCESSING'      // Currently being processed
  | 'COMPLETED'       // Successfully processed
  | 'FAILED'          // Processing failed
  | 'REVIEW_REQUIRED';// Needs human review (low confidence)

// ============================================
// Request Types
// ============================================

export interface DocumentUploadRequest {
  file: {
    uri: string;
    type: string;
    name: string;
  };
  documentType?: ProcessingDocumentType;
  vesselId?: number;
  voyageId?: number;
  charterBaseId?: number;
  /** If false, wait for processing to complete before returning. Default: false */
  asyncProcessing?: boolean;
  /** If true, auto-commit extracted data to DB after successful extraction. Default: true */
  autoCommit?: boolean;
}

export interface ValidationRequest {
  correctedValue?: string;
  approved: boolean;
  notes?: string;
}

export interface CommitRequest {
  targetEntityId?: number; // Existing vessel/voyage ID to update
  createNewEntity?: boolean; // Create new vessel/voyage if not found
  fieldMappingOverrides?: Record<string, string>; // Override field mappings
  onlyValidated?: boolean; // Only commit validated fields
  minimumConfidence?: number; // Only commit fields with >= this confidence (0-100)
}

// ============================================
// Response Types
// ============================================

export interface DocumentUploadResponse {
  id: number;
  documentId?: number; // Backend may return documentId instead of id
  documentName: string;
  documentType: ProcessingDocumentType;
  documentDate: string;
  processingStatus: ProcessingStatus;
  createdAt: string;
  updatedAt: string;
  fileUrl: string;
  extractionConfidence?: number | null;
  processingStartedAt?: string | null;
  processingCompletedAt?: string | null;
  processingError?: string | null;
  remarks?: string | null;
}

export interface ProcessingStatusResponse {
  documentId: number;
  status: ProcessingStatus;
  progress: number; // 0-100
  extractedFieldsCount: number;
  averageConfidence: number;
  ocrCompleted: boolean;
  extractionCompleted: boolean;
  errorMessage?: string;
}

export interface ExtractionResponse {
  documentId: number;
  documentType: ProcessingDocumentType;
  documentName: string;
  status: ProcessingStatus;
  averageConfidence: number;
  pageCount: number;
  extractedFields: ExtractedField[];
  ocrText?: string; // Full OCR text if available
}

// Matches backend ExtractedField entity
export interface ExtractedField {
  id: number;
  fieldName: string;
  fieldValue: string;
  rawValue?: string; // Original OCR value before normalization
  confidenceScore: number; // 0-100 (backend stores as BigDecimal)
  targetTable: string; // e.g., 'vessel', 'voyage', 'charter_base'
  targetColumn: string; // e.g., 'vessel_name', 'imo_number'
  extractionMethod: ExtractionMethod;
  boundingBox?: BoundingBox; // From OCR service
  pageNumber?: number;
  validated: boolean;
  validatedBy?: string;
  validatedAt?: string;
  validationNotes?: string;
}

// From Python OCR service response
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CommitResponse {
  success: boolean;
  message: string;
  affectedRecords: {
    vessel?: { id: number; name: string; created: boolean };
    voyage?: { id: number; created: boolean };
    vesselStatus?: { id: number; created: boolean };
    charter?: { id: number; type: 'TC' | 'VC'; created: boolean };
    voyagePort?: { id: number; created: boolean };
    cargo?: { id: number; created: boolean };
  };
  errors?: string[];
}

export interface ProcessedDocument {
  id: number;
  documentName: string;
  documentType: ProcessingDocumentType;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  processedAt?: string;
  processingStatus: ProcessingStatus;
  vesselId?: number;
  vesselName?: string;
  voyageId?: number;
}

export interface ProcessedDocumentsPage {
  content: ProcessedDocument[];
  totalElements: number;
  totalPages: number;
}

// ============================================
// UI Helper Types
// ============================================

export interface DocumentTypeOption {
  value: ProcessingDocumentType;
  label: string;
  description: string;
}

// Document type options for the upload screen
export const PROCESSING_DOCUMENT_TYPES: DocumentTypeOption[] = [
  { value: 'Q88', label: 'Q88 Questionnaire', description: 'INTERTANKO vessel questionnaire' },
  { value: 'FormC', label: 'Form C', description: 'Gas carrier specifications (LPG only)' },
  { value: 'NoonReport', label: 'Noon Report', description: 'Daily vessel status report' },
  { value: 'NOR', label: 'Notice of Readiness', description: 'Port arrival readiness' },
  { value: 'CharterParty', label: 'Charter Party', description: 'TC or VC charter agreement' },
  { value: 'PortClearance', label: 'Port Clearance', description: 'Port departure clearance' },
  { value: 'BL', label: 'Bill of Lading', description: 'Cargo bill of lading' },
  { value: 'CargoManifest', label: 'Cargo Manifest', description: 'Cargo details manifest' },
  { value: 'SOF', label: 'Statement of Facts', description: 'Statement of facts document' },
  { value: 'Other', label: 'Other', description: 'Other document type' },
];

// Table display labels for extraction review
export const TABLE_LABELS: Record<string, { icon: string; label: string }> = {
  vessel: { icon: 'ship', label: 'Vessel Information' },
  voyage: { icon: 'map', label: 'Voyage Details' },
  vessel_status: { icon: 'activity', label: 'Vessel Status' },
  voyage_port: { icon: 'anchor', label: 'Port Information' },
  charter_base: { icon: 'file-text', label: 'Charter Details' },
  tc_charter: { icon: 'calendar', label: 'Time Charter' },
  vc_charter: { icon: 'navigation', label: 'Voyage Charter' },
  cargo: { icon: 'package', label: 'Cargo Details' },
  other: { icon: 'file', label: 'Other Fields' },
};

// Extraction method display names
export const EXTRACTION_METHOD_LABELS: Record<ExtractionMethod, string> = {
  OCR: 'OCR Scan',
  TEXT_EXTRACTION: 'Text Extraction',
  REGEX: 'Pattern Match',
  ML_MODEL: 'AI Model',
  TEMPLATE: 'Template',
  MANUAL: 'Manual Entry',
};
