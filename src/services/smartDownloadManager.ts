import { downloadConfig, getDownloadConfig, DownloadMethod } from '../config/downloadConfig';
import { DownloadOptions } from './download/types';

export class SmartDownloadManager {
    private config = getDownloadConfig();

    constructor(
        private downloadService: any, // DownloadService instance
    ) { }

    /**
     * Smart download that chooses method based on configuration
     */
    async downloadVideo(
        options: DownloadOptions,
        onProgress?: (progress: number) => void,
        onComplete?: (filePath: string, filename: string) => void,
        onError?: (error: string) => void,
        localDownloadId?: string,
    ): Promise<string> {
        const method = this.determineDownloadMethod(options);

        if (this.config.enableMethodSwitchLogs) {
            console.log('🔧 SMART DOWNLOAD MANAGER');
            console.log(`📋 Selected method: ${method.toUpperCase()}`);
            console.log(`🎯 Video: ${options.videoTitle || options.videoId}`);
            console.log(`📦 Format: ${options.format}`);
            console.log(`⚙️ Config method: ${this.config.method}`);
            if (this.config.autoSwitchThreshold) {
                console.log(`📏 Auto-switch threshold: ${this.config.autoSwitchThreshold}MB`);
            }
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }

        try {
            return await this.executeDownload(
                method,
                options,
                onProgress,
                onComplete,
                onError,
                localDownloadId,
            );
        } catch (error) {
            console.error(`❌ ${method.toUpperCase()} method failed:`, error);

            // Try fallback method if configured
            if (this.config.fallbackMethod && this.config.fallbackMethod !== method) {
                console.log(`🔄 Attempting fallback to ${this.config.fallbackMethod.toUpperCase()}...`);

                try {
                    return await this.executeDownload(
                        this.config.fallbackMethod,
                        options,
                        onProgress,
                        onComplete,
                        onError,
                        localDownloadId,
                    );
                } catch (fallbackError) {
                    console.error(`❌ Fallback ${this.config.fallbackMethod.toUpperCase()} also failed:`, fallbackError);
                    throw new Error(`Both ${method} and ${this.config.fallbackMethod} methods failed`);
                }
            }

            throw error;
        }
    }

    /**
     * Determine which download method to use
     */
    private determineDownloadMethod(options: DownloadOptions): DownloadMethod {
        // Start with configured method
        let method = this.config.method;

        // Auto-switch based on estimated file size (if threshold is set)
        if (this.config.autoSwitchThreshold) {
            const estimatedSizeMB = this.estimateFileSize(options);

            if (estimatedSizeMB > this.config.autoSwitchThreshold) {
                if (this.config.enableMethodSwitchLogs) {
                    console.log(`📏 Estimated size: ${estimatedSizeMB}MB > ${this.config.autoSwitchThreshold}MB threshold`);
                    console.log(`🔄 Auto-switching to direct-stream for better performance`);
                }
                method = 'direct-stream';
            }
        }

        return method;
    }

    /**
     * Execute download using specified method
     */
    private async executeDownload(
        method: DownloadMethod,
        options: DownloadOptions,
        onProgress?: (progress: number) => void,
        onComplete?: (filePath: string, filename: string) => void,
        onError?: (error: string) => void,
        localDownloadId?: string,
    ): Promise<string> {
        switch (method) {
            case 'direct-stream':
                return await this.downloadService.downloadVideoDirectStream(
                    options,
                    onProgress,
                    onComplete,
                    onError,
                    localDownloadId,
                );

            case 'sse':
                return await this.downloadService.downloadVideo(
                    options,
                    onProgress,
                    onComplete,
                    onError,
                    localDownloadId,
                );

            default:
                throw new Error(`Unknown download method: ${method}`);
        }
    }

    /**
     * Estimate file size based on format and quality
     */
    private estimateFileSize(options: DownloadOptions): number {
        // Rough estimates in MB
        const estimates = {
            mp3: 5, // ~5MB for average song
            mp4: {
                '360p': 25,
                '480p': 40,
                '720p': 80,
                '1080p': 150,
                default: 60, // Default to ~60MB
            },
            webm: {
                '360p': 20,
                '480p': 35,
                '720p': 70,
                '1080p': 130,
                default: 50,
            },
        };

        if (options.format === 'mp3') {
            return estimates.mp3;
        }

        const formatEstimates = estimates[options.format as keyof typeof estimates] as any;
        if (typeof formatEstimates === 'object') {
            return formatEstimates[options.quality || 'default'] || formatEstimates.default;
        }

        return 60; // Default estimate
    }

    /**
     * Update configuration at runtime
     */
    updateConfig(newConfig: Partial<typeof downloadConfig>) {
        this.config = { ...this.config, ...newConfig };

        if (this.config.enableMethodSwitchLogs) {
            console.log('🔧 Download config updated:', newConfig);
        }
    }

    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Force a specific method for next download (one-time override)
     */
    forceMethod(method: DownloadMethod): void {
        const originalMethod = this.config.method;
        this.config.method = method;

        if (this.config.enableMethodSwitchLogs) {
            console.log(`🔧 Forcing download method: ${originalMethod} → ${method}`);
        }
    }
}