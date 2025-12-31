/**
 * Document Processing Navigation Hook
 *
 * Provides a simple interface for navigating to the document processing flow
 * from any component in the app.
 */

import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ProcessingDocumentType } from '@/types/documentProcessing';

interface DocumentProcessingParams {
  vesselId?: number;
  vesselName?: string;
  voyageId?: number;
  charterBaseId?: number;
  preselectedType?: ProcessingDocumentType;
}

export function useDocumentProcessing() {
  const router = useRouter();

  const openDocumentUpload = useCallback((params?: DocumentProcessingParams) => {
    router.push({
      pathname: '/document-processing/upload',
      params: params ? {
        vesselId: params.vesselId?.toString(),
        vesselName: params.vesselName,
        voyageId: params.voyageId?.toString(),
        charterBaseId: params.charterBaseId?.toString(),
        preselectedType: params.preselectedType,
      } : undefined,
    });
  }, [router]);

  const openDocumentReview = useCallback((documentId: number, documentName?: string) => {
    router.push({
      pathname: '/document-processing/review',
      params: {
        documentId: documentId.toString(),
        documentName,
      },
    });
  }, [router]);

  return {
    openDocumentUpload,
    openDocumentReview,
  };
}
