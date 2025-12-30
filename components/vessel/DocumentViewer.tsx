/**
 * DocumentViewer Component
 * 
 * Facade component that detects file type and delegates to appropriate viewer.
 * 
 * Supports:
 * - PDF files via PdfViewer
 * - Images via ImageViewer
 * - Fallback placeholder for other types
 */

import React from 'react';
import { PdfViewer } from './PdfViewer';
import { ImageViewer } from './ImageViewer';
import { DocumentPlaceholder } from './DocumentPlaceholder';
import { getFullUrl } from '@/lib/urlUtils';
import type { DocumentViewerProps } from '@/types';

/** Supported image extensions */
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];

/**
 * Detects file type from document name.
 * @param fileName - The document name with extension
 * @returns 'pdf' | 'image' | 'other'
 */
const detectFileType = (fileName: string | undefined): 'pdf' | 'image' | 'other' => {
  if (!fileName) return 'other';

  const lower = fileName.toLowerCase();

  if (lower.endsWith('.pdf')) {
    return 'pdf';
  }

  if (IMAGE_EXTENSIONS.some(ext => lower.endsWith(ext))) {
    return 'image';
  }

  return 'other';
};

/**
 * DocumentViewer - displays document previews based on file type.
 * 
 * @param doc - The document to display
 * @param style - Optional custom styles
 */
export const DocumentViewer: React.FC<DocumentViewerProps> = ({ doc, style }) => {
  // No document or no URL
  if (!doc || !doc.fileUrl) {
    return <DocumentPlaceholder type="na" style={style} />;
  }

  const fileType = detectFileType(doc.documentName);
  const fullUrl = getFullUrl(doc.fileUrl);

  switch (fileType) {
    case 'pdf':
      return <PdfViewer url={fullUrl} docId={doc.id} style={style} />;

    case 'image':
      return <ImageViewer url={fullUrl} style={style} />;

    default:
      return <DocumentPlaceholder type="fallback" style={style} />;
  }
};
