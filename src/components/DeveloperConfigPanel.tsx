import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { downloadService } from '../services/downloadService';
import { downloadConfig } from '../config/downloadConfig';

export const DeveloperConfigPanel: React.FC = () => {
  const [config, setConfig] = useState(downloadService.getDownloadConfig());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Update local state when config changes
    const currentConfig = downloadService.getDownloadConfig();
    setConfig(currentConfig);
  }, []);

  const updateMethod = (method: 'sse' | 'direct-stream') => {
    downloadService.setDownloadMethod(method);
    setConfig(prev => ({ ...prev, method }));
    
    Alert.alert(
      'Download Method Changed',
      `All future downloads will use: ${method.toUpperCase()}`,
      [{ text: 'OK' }]
    );
  };

  const toggleAutoSwitch = (enabled: boolean) => {
    const threshold = enabled ? 50 : undefined;
    downloadService.updateDownloadConfig({ autoSwitchThreshold: threshold });
    setConfig(prev => ({ ...prev, autoSwitchThreshold: threshold }));
  };

  const updateThreshold = (threshold: number) => {
    downloadService.updateDownloadConfig({ autoSwitchThreshold: threshold });
    setConfig(prev => ({ ...prev, autoSwitchThreshold: threshold }));
  };

  const toggleDebugLogs = (enabled: boolean) => {
    downloadService.updateDownloadConfig({ enableDebugLogs: enabled });
    setConfig(prev => ({ ...prev, enableDebugLogs: enabled }));
  };

  const testDownload = (method: 'sse' | 'direct-stream') => {
    Alert.alert(
      'Test Download',
      `This will start a test download using ${method.toUpperCase()} method`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Test',
          onPress: () => {
            // Force next download to use specific method
            downloadService.forceNextDownloadMethod(method);
            Alert.alert('Test Ready', `Next download will use ${method.toUpperCase()}`);
          },
        },
      ]
    );
  };

  if (!isVisible) {
    return (
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.toggleButtonText}>🔧 Dev Config</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>🔧 Developer Configuration</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setIsVisible(false)}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Download Method Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Download Method</Text>
          <Text style={styles.currentValue}>
            Current: {config.method.toUpperCase()}
          </Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.methodButton,
                config.method === 'sse' && styles.methodButtonActive,
              ]}
              onPress={() => updateMethod('sse')}
            >
              <Text style={[
                styles.methodButtonText,
                config.method === 'sse' && styles.methodButtonTextActive,
              ]}>
                SSE (Basic)
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.methodButton,
                config.method === 'direct-stream' && styles.methodButtonActive,
              ]}
              onPress={() => updateMethod('direct-stream')}
            >
              <Text style={[
                styles.methodButtonText,
                config.method === 'direct-stream' && styles.methodButtonTextActive,
              ]}>
                Direct Stream
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Auto-Switch Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auto-Switch</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              Auto-switch to Direct Stream for large files
            </Text>
            <Switch
              value={!!config.autoSwitchThreshold}
              onValueChange={toggleAutoSwitch}
            />
          </View>
          
          {config.autoSwitchThreshold && (
            <View style={styles.thresholdContainer}>
              <Text style={styles.thresholdLabel}>
                Threshold: {config.autoSwitchThreshold}MB
              </Text>
              <View style={styles.thresholdButtons}>
                {[25, 50, 100, 200].map(threshold => (
                  <TouchableOpacity
                    key={threshold}
                    style={[
                      styles.thresholdButton,
                      config.autoSwitchThreshold === threshold && styles.thresholdButtonActive,
                    ]}
                    onPress={() => updateThreshold(threshold)}
                  >
                    <Text style={styles.thresholdButtonText}>{threshold}MB</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Debug Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Settings</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Enable debug logs</Text>
            <Switch
              value={config.enableDebugLogs}
              onValueChange={toggleDebugLogs}
            />
          </View>
        </View>

        {/* Test Downloads */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Downloads</Text>
          <Text style={styles.sectionDescription}>
            Force next download to use specific method
          </Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => testDownload('sse')}
            >
              <Text style={styles.testButtonText}>Test SSE</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => testDownload('direct-stream')}
            >
              <Text style={styles.testButtonText}>Test Direct Stream</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Configuration Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Configuration</Text>
          <View style={styles.configDisplay}>
            <Text style={styles.configText}>
              Method: {config.method}
            </Text>
            <Text style={styles.configText}>
              Fallback: {config.fallbackMethod || 'None'}
            </Text>
            <Text style={styles.configText}>
              Auto-switch: {config.autoSwitchThreshold ? `${config.autoSwitchThreshold}MB` : 'Disabled'}
            </Text>
            <Text style={styles.configText}>
              Debug logs: {config.enableDebugLogs ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    zIndex: 1000,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    color: '#999',
    fontSize: 14,
    marginBottom: 12,
  },
  currentValue: {
    color: '#007AFF',
    fontSize: 14,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  methodButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  methodButtonActive: {
    backgroundColor: '#007AFF',
  },
  methodButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  methodButtonTextActive: {
    color: 'white',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchLabel: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  thresholdContainer: {
    marginTop: 12,
  },
  thresholdLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  thresholdButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  thresholdButton: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  thresholdButtonActive: {
    backgroundColor: '#007AFF',
  },
  thresholdButtonText: {
    color: 'white',
    fontSize: 12,
  },
  testButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  configDisplay: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 8,
  },
  configText: {
    color: '#999',
    fontSize: 14,
    marginBottom: 4,
  },
});