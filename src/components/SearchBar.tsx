import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  value?: string;
  debounceMs?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search YouTube videos',
  value: controlledValue,
  debounceMs = 300,
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
  }, [onSearch, debounceMs, controlledValue]);

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
      borderRadius: 24,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      height: 48,
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
      
      {value.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearButtonText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SearchBar;