// Debug script to help identify stuck downloads
// Run this in your React Native debugger console

console.log('🔍 DOWNLOAD DEBUG INFORMATION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Check if downloadService is available
if (typeof downloadService !== 'undefined') {
    console.log('📊 Active Downloads:', downloadService.getActiveDownloadCount());

    // List all active connections
    if (downloadService.activeEventSources) {
        console.log('🔌 Active SSE Connections:');
        downloadService.activeEventSources.forEach((eventSource, downloadId) => {
            const status = downloadService.getDownloadStatus(downloadId);
            console.log(`   └─ ${downloadId}: ${status}`);
        });
    }

    // List reconnect attempts
    if (downloadService.reconnectAttempts) {
        console.log('🔄 Reconnect Attempts:');
        downloadService.reconnectAttempts.forEach((attempts, downloadId) => {
            console.log(`   └─ ${downloadId}: ${attempts} attempts`);
        });
    }

    // List heartbeat timers
    if (downloadService.heartbeatTimers) {
        console.log('💓 Active Heartbeat Timers:', downloadService.heartbeatTimers.size);
    }
} else {
    console.log('❌ downloadService not found in global scope');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('💡 To force cleanup all downloads, run:');
console.log('   downloadService.cleanup()');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');