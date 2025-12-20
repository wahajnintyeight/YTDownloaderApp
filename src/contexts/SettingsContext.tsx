import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { DOWNLOAD_FOLDER_NAME } from '../config/env';

interface SettingsContextType {
  downloadLocation: string;
  setDownloadLocation: (path: string) => Promise<void>;
  isLocationSet: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = '@ytdownloader_settings';
const DEFAULT_DOWNLOAD_PATH = `${RNFS.DownloadDirectoryPath}/${DOWNLOAD_FOLDER_NAME}`;

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [downloadLocation, setDownloadLocationState] = useState<string>(DEFAULT_DOWNLOAD_PATH);
  const [isLocationSet, setIsLocationSet] = useState<boolean>(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEY);
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        if (settings.downloadLocation) {
          setDownloadLocationState(settings.downloadLocation);
          setIsLocationSet(true);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const setDownloadLocation = async (path: string) => {
    try {
      const isSafUri = path.startsWith('content://');

      if (!isSafUri) {
        // Ensure filesystem directory exists (non-SAF path)
        const exists = await RNFS.exists(path);
        if (!exists) {
          await RNFS.mkdir(path);
        }
      } else {
        // SAF URI selected; no RNFS ops here. Permissions are handled by SAF.
        console.log('🔐 Using SAF URI for download location:', path);
      }

      // Save to state
      setDownloadLocationState(path);
      setIsLocationSet(true);

      // Save to storage
      const settings = { downloadLocation: path };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

      console.log(`✅ Download location set to: ${path}`);
    } catch (error) {
      console.error('Error setting download location:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        downloadLocation,
        setDownloadLocation,
        isLocationSet,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
