/**
 * Document Viewer Types
 * 
 * Type definitions for document viewer components.
 */

import type { ViewStyle, StyleProp } from 'react-native';
import type { Document } from './document';

/** Props for the main DocumentViewer component */
export interface DocumentViewerProps {
    /** The document to display */
    doc: Document | undefined;
    /** Optional custom styles */
    style?: StyleProp<ViewStyle>;
}

/** Props for the PdfViewer component */
export interface PdfViewerProps {
    /** Full URL to the PDF file */
    url: string;
    /** Document ID for caching */
    docId: number;
    /** Optional custom styles */
    style?: StyleProp<ViewStyle>;
}

/** Props for the ImageViewer component */
export interface ImageViewerProps {
    /** Full URL to the image file */
    url: string;
    /** Optional custom styles */
    style?: StyleProp<ViewStyle>;
}

/** Props for the DocumentPlaceholder component */
export interface DocumentPlaceholderProps {
    /** Type of placeholder to display */
    type: 'na' | 'error' | 'unavailable' | 'fallback';
    /** Optional custom styles */
    style?: StyleProp<ViewStyle>;
}

/** Return type for the usePdfDownload hook */
export interface UsePdfDownloadResult {
    /** Local file path to the downloaded PDF, null if not ready */
    localPath: string | null;
    /** Whether the download is in progress */
    loading: boolean;
    /** Whether an error occurred */
    error: boolean;
    /** Set error state (for render errors) */
    setError: (error: boolean) => void;
}
