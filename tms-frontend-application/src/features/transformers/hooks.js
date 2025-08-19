import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  listTransformers, 
  getTransformer, 
  createTransformer, 
  updateTransformer, 
  deleteTransformer, 
  fetchMeta 
} from './api.js';

export function useTransformerList(page = 0, size = 10) {
  return useQuery({
    queryKey: ['transformers', { page, size }],
    queryFn: () => listTransformers({ page, size }),
    staleTime: 30_000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 2,
    refetchOnWindowFocus: false
  });
}

export function useTransformer(id) {
  return useQuery({
    queryKey: ['transformer', id],
    queryFn: () => getTransformer(id),
    enabled: !!id,
    staleTime: 60_000, // Cache for 1 minute
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2
  });
}

export function useCreateTransformer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTransformer,
    onSuccess: (newTransformer) => {
      // Invalidate list queries
      qc.invalidateQueries({ queryKey: ['transformers'] });
      
      // Optionally add the new transformer to cache
      if (newTransformer?.id) {
        qc.setQueryData(['transformer', newTransformer.id], newTransformer);
      }
    },
    onError: (error) => {
      console.error('Create transformer failed:', error);
    }
  });
}

export function useUpdateTransformer(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => updateTransformer(id, payload),
    onSuccess: (updatedTransformer) => {
      // Invalidate list queries
      qc.invalidateQueries({ queryKey: ['transformers'] });
      
      // Update the specific transformer in cache
      if (updatedTransformer) {
        qc.setQueryData(['transformer', id], updatedTransformer);
      } else {
        // If no data returned, just invalidate
        qc.invalidateQueries({ queryKey: ['transformer', id] });
      }
    },
    onError: (error) => {
      console.error('Update transformer failed:', error);
    }
  });
}

export function useDeleteTransformer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTransformer,
    onSuccess: (_, deletedId) => {
      // Invalidate list queries
      qc.invalidateQueries({ queryKey: ['transformers'] });
      
      // Remove the specific transformer from cache
      qc.removeQueries({ queryKey: ['transformer', deletedId] });
    },
    onError: (error) => {
      console.error('Delete transformer failed:', error);
    }
  });
}

export function useMetaOptions(fallbackRegions = [], fallbackTypes = []) {
  return useQuery({
    queryKey: ['transformers-meta'],
    queryFn: fetchMeta,
    staleTime: 5 * 60_000, // Cache for 5 minutes (meta data changes infrequently)
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    select: (data) => ({
      regions: data?.regions?.length ? data.regions : fallbackRegions,
      types: data?.types?.length ? data.types : fallbackTypes
    }),
    placeholderData: {
      regions: fallbackRegions,
      types: fallbackTypes
    }
  });
}