/**
 * Document Processing React Query Hooks
 *
 * Provides hooks for document upload, processing status polling,
 * extraction review, validation, and commit operations.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentProcessingService } from '@/services';
import {
  DocumentUploadRequest,
  ValidationRequest,
  CommitRequest,
  ProcessingStatus,
  ProcessingDocumentType,
  ExtractionResponse,
} from '@/types/documentProcessing';
import { vesselKeys } from './useVesselsQuery';
import { voyageKeys } from './useVesselDetailsQuery';

// ============================================
// Query Keys
// ============================================

export const documentProcessingKeys = {
  all: ['documentProcessing'] as const,
  lists: () => [...documentProcessingKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...documentProcessingKeys.lists(), filters] as const,
  details: () => [...documentProcessingKeys.all, 'detail'] as const,
  detail: (id: number) => [...documentProcessingKeys.details(), id] as const,
  status: (id: number) => [...documentProcessingKeys.all, 'status', id] as const,
  extraction: (id: number) => [...documentProcessingKeys.all, 'extraction', id] as const,
  preview: (id: number, page: number) => [...documentProcessingKeys.all, 'preview', id, page] as const,
};

// ============================================
// Upload Mutation
// ============================================

export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      request,
      onProgress,
    }: {
      request: DocumentUploadRequest;
      onProgress?: (progress: number) => void;
    }) => {
      return documentProcessingService.uploadDocument(request, onProgress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentProcessingKeys.lists() });
    },
  });
};

// ============================================
// Status Polling Hook
// ============================================

export const useDocumentStatus = (
  documentId: number,
  options?: {
    enabled?: boolean;
    onCompleted?: () => void;
    onFailed?: (error: string) => void;
  }
) => {
  const { enabled = true, onCompleted, onFailed } = options || {};

  return useQuery({
    queryKey: documentProcessingKeys.status(documentId),
    queryFn: () => documentProcessingService.getStatus(documentId),
    enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      // Stop polling when processing is complete
      if (status === 'COMPLETED' || status === 'REVIEW_REQUIRED') {
        onCompleted?.();
        return false;
      }
      if (status === 'FAILED') {
        onFailed?.(query.state.data?.errorMessage || 'Processing failed');
        return false;
      }

      // Poll every 2 seconds while processing
      return status === 'PENDING' || status === 'PROCESSING' ? 2000 : false;
    },
    staleTime: 1000,
  });
};

// ============================================
// Extraction Results Hook
// ============================================

export const useExtraction = (documentId: number, enabled = true) => {
  return useQuery({
    queryKey: documentProcessingKeys.extraction(documentId),
    queryFn: () => documentProcessingService.getExtraction(documentId),
    enabled,
    staleTime: 30000, // 30 seconds
  });
};

// ============================================
// Field Validation Mutation
// ============================================

export const useValidateField = (documentId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fieldId, data }: { fieldId: number; data: ValidationRequest }) =>
      documentProcessingService.validateField(documentId, fieldId, data),
    onSuccess: (updatedField) => {
      // Optimistically update the extraction cache
      queryClient.setQueryData(
        documentProcessingKeys.extraction(documentId),
        (old: ExtractionResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            extractedFields: old.extractedFields.map((f) =>
              f.id === updatedField.id ? updatedField : f
            ),
          };
        }
      );
    },
  });
};

// ============================================
// Bulk Validation Mutation
// ============================================

export const useBulkValidateFields = (documentId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (validations: Array<{ fieldId: number; data: ValidationRequest }>) =>
      documentProcessingService.validateFields(documentId, validations),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentProcessingKeys.extraction(documentId) });
    },
  });
};

// ============================================
// Commit Extraction Mutation
// ============================================

export const useCommitExtraction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      options,
    }: {
      documentId: number;
      options?: CommitRequest;
    }) => documentProcessingService.commitExtraction(documentId, options),
    onSuccess: (result, variables) => {
      // Invalidate document queries
      queryClient.invalidateQueries({ queryKey: documentProcessingKeys.detail(variables.documentId) });
      queryClient.invalidateQueries({ queryKey: documentProcessingKeys.lists() });

      // Invalidate related entity queries based on what was affected
      if (result.affectedRecords.vessel) {
        queryClient.invalidateQueries({ queryKey: vesselKeys.all });
        queryClient.invalidateQueries({
          queryKey: vesselKeys.detail(result.affectedRecords.vessel.id),
        });
      }
      if (result.affectedRecords.voyage) {
        queryClient.invalidateQueries({ queryKey: voyageKeys.all });
      }
    },
  });
};

// ============================================
// Document List Hook
// ============================================

export const useProcessedDocuments = (params: {
  vesselId?: number;
  voyageId?: number;
  documentType?: ProcessingDocumentType;
  status?: ProcessingStatus;
  page?: number;
  size?: number;
}) => {
  return useQuery({
    queryKey: documentProcessingKeys.list(params),
    queryFn: () => documentProcessingService.getDocuments(params),
    staleTime: 30000,
  });
};

// ============================================
// Delete Document Mutation
// ============================================

export const useDeleteProcessedDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: number) => documentProcessingService.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentProcessingKeys.lists() });
    },
  });
};

// ============================================
// Reprocess Document Mutation
// ============================================

export const useReprocessDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: number) => documentProcessingService.reprocessDocument(documentId),
    onSuccess: (_, documentId) => {
      queryClient.invalidateQueries({ queryKey: documentProcessingKeys.status(documentId) });
    },
  });
};

// ============================================
// Preview Hook
// ============================================

export const useDocumentPreview = (documentId: number, page: number = 1) => {
  return useQuery({
    queryKey: documentProcessingKeys.preview(documentId, page),
    queryFn: () => documentProcessingService.downloadPreview(documentId, page),
    staleTime: Infinity, // Previews don't change
  });
};
