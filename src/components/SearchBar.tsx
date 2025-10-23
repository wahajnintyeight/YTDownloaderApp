import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import SearchIcon from './SearchIcon';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  value?: string;
  debounceMs?: number;
  showSearchButton?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search YouTube videos',
  value: controlledValue,
  debounceMs = 300,
  showSearchButton = true,
}) => {
  const { theme } = useTheme();
  const [internalValue, setInternalValue] = useState<string>(controlledValue || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  const handleTextChange = useCallback((text: string) => {
    if (controlledValue === undefined) {
      setInternalValue(text);
    }

    // Only auto-search if search button is not shown
    if (!showSearchButton) {
      // Clear previous debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Set new debounce
      debounceRef.current = setTimeout(() => {
        if (text.trim()) {
          onSearch(text.trim());
        }
      }, debounceMs);
    }
  }, [onSearch, debounceMs, controlledValue, showSearchButton]);

  const handleSubmit = useCallback(() => {
    if (value.trim()) {
      // Clear debounce and search immediately
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      onSearch(value.trim());
    }
  }, [value, onSearch]);

  const handleClear = useCallback(() => {
    if (controlledValue === undefined) {
      setInternalValue('');
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    inputRef.current?.focus();
  }, [controlledValue]);

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 28,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      height: 56,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
      paddingVertical: 0, // Remove default padding
    },
    clearButton: {
      marginLeft: theme.spacing.sm,
      padding: theme.spacing.xs,
    },
    clearButtonText: {
      fontSize: 18,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    searchButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginLeft: theme.spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
  });

  return (
    <View style={styles.container}>
      
      
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={handleTextChange}
        onSubmitEditing={handleSubmit}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      {value.length > 0 && !showSearchButton && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearButtonText}>×</Text>
        </TouchableOpacity>
      )}
      
      {showSearchButton && (
        <TouchableOpacity 
          style={[styles.searchButton, { backgroundColor: theme.colors.primary }]} 
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <SearchIcon 
            size={20} 
            color="#FFFFFF" 
            strokeWidth={2.5}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SearchBar;