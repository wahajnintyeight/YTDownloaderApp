import { useState, useCallback } from 'react';
import { Video } from '../types/video';
import { apiClient } from '../services/apiClient';

interface UseSearchState {
  results: Video[];
  loading: boolean;
  error: string | null;
}

interface UseSearchReturn extends UseSearchState {
  search: (query: string) => Promise<void>;
  clearResults: () => void;
}

export const useSearch = (): UseSearchReturn => {
  const [state, setState] = useState<UseSearchState>({
    results: [],
    loading: false,
    error: null,
  });

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a search query' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiClient.searchVideos({ query: query.trim() });
      setState(prev => ({
        ...prev,
        results: response.videos,
        loading: false,
        error: null,
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
        ? error 
        : 'Failed to search videos';
        
      setState(prev => ({
        ...prev,
        results: [],
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const clearResults = useCallback(() => {
    setState({
      results: [],
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    search,
    clearResults,
  };
};