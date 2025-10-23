import { useState, useCallback } from 'react';
import { Video } from '../types/video';
import { apiClient } from '../services/apiClient';

interface UseSearchState {
  results: Video[];
  loading: boolean;
  error: string | null;
  nextPageToken: string | null;
  hasMore: boolean;
}

interface UseSearchReturn extends UseSearchState {
  search: (query: string, isNewSearch?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  clearResults: () => void;
}

export const useSearch = (): UseSearchReturn => {
  const [state, setState] = useState<UseSearchState>({
    results: [],
    loading: false,
    error: null,
    nextPageToken: null,
    hasMore: false,
  });
  const [currentQuery, setCurrentQuery] = useState<string>('');

  const search = useCallback(async (query: string, isNewSearch: boolean = true) => {
    if (!query.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a search query' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const searchRequest = {
        query: query.trim(),
        nextPage: isNewSearch ? '' : state.nextPageToken || '',
        prevPage: '',
      };

      const response = await apiClient.searchVideos(searchRequest);
      
      setState(prev => ({
        ...prev,
        results: isNewSearch ? response.videos : [...prev.results, ...response.videos],
        loading: false,
        error: null,
        nextPageToken: response.nextPageToken || null,
        hasMore: !!(response.nextPageToken && response.nextPageToken.trim()),
      }));

      if (isNewSearch) {
        setCurrentQuery(query.trim());
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
        ? error 
        : 'Failed to search videos';
        
      setState(prev => ({
        ...prev,
        results: isNewSearch ? [] : prev.results,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [state.nextPageToken]);

  const loadMore = useCallback(async () => {
    if (!currentQuery || !state.hasMore || state.loading) {
      return;
    }
    
    await search(currentQuery, false);
  }, [currentQuery, state.hasMore, state.loading, search]);

  const clearResults = useCallback(() => {
    setState({
      results: [],
      loading: false,
      error: null,
      nextPageToken: null,
      hasMore: false,
    });
    setCurrentQuery('');
  }, []);

  return {
    ...state,
    search,
    loadMore,
    clearResults,
  };
};