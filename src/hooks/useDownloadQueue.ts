import { useEffect, useState } from 'react';
import { clientDownloadQueue } from '../services/download/queueManager';
import type { DownloadQueueState, DownloadJob } from '../services/download/queue';

export const useDownloadQueue = () => {
  const [queueState, setQueueState] = useState<DownloadQueueState>(
    clientDownloadQueue.getState(),
  );

  useEffect(() => {
    const unsubscribe = clientDownloadQueue.subscribe(setQueueState);
    return unsubscribe;
  }, []);

  return {
    activeDownload: queueState.activeDownload,
    queuedDownloads: queueState.queuedDownloads,
    completedDownloads: queueState.completedDownloads,
    enqueue: (job: DownloadJob) => clientDownloadQueue.enqueue(job),
    cancel: (id: string) => clientDownloadQueue.cancelDownload(id),
    retry: (id: string) => clientDownloadQueue.retryDownload(id),
    clearCompleted: () => clientDownloadQueue.clearCompleted(),
    moveUp: (id: string) => clientDownloadQueue.moveUp(id),
    moveDown: (id: string) => clientDownloadQueue.moveDown(id),
  };
};
