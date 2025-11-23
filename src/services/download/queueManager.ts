import { downloadService } from '../downloadService';
import type { DownloadQueueState, DownloadJob } from './queue';
import { storageService, PersistedDownloadQueue } from '../storageService';
import { notificationService } from '../notificationService';

export class ClientDownloadQueue {
  private activeDownload: DownloadJob | null = null;
  private queue: DownloadJob[] = [];
  private completed: Map<string, DownloadJob> = new Map();
  private listeners: Set<(state: DownloadQueueState) => void> = new Set();
  // Map local job id -> internal downloadService id
  private idMap: Map<string, string> = new Map();
  // Optional per-job callbacks (progress, complete, error)
  private callbacks: Map<
    string,
    {
      onProgress?: (progress: number) => void;
      onComplete?: (filePath: string, filename: string) => void;
      onError?: (error: string) => void;
    }
  > = new Map();
  private startIdResolvers: Map<
    string,
    { resolve: (id: string) => void; reject: (e: any) => void }
  > = new Map();
  private persistDebounce?: ReturnType<typeof setTimeout>;

  constructor() {
    // Attempt restore persisted queue snapshot
    void this.restoreQueue();
  }

  enqueue(job: DownloadJob): void {
    job.status = 'queued';
    job.createdAt = Date.now();
    job.progress = job.progress ?? 0;
    this.queue.push(job);
    this.notifyListeners();
    void this.processNext();
  }

  enqueueWithCallbacks(
    job: DownloadJob,
    cb?: {
      onProgress?: (progress: number) => void;
      onComplete?: (filePath: string, filename: string) => void;
      onError?: (error: string) => void;
    },
  ): string {
    if (cb) this.callbacks.set(job.id, cb);
    this.enqueue(job);
    return job.id;
  }

  private async processNext(): Promise<void> {
    if (this.activeDownload) return;
    if (this.queue.length === 0) return;

    const next = this.queue.shift();
    if (!next) return;

    this.activeDownload = next;
    next.status = 'downloading';
    next.startedAt = Date.now();
    next.progress = 0;
    this.notifyListeners();

    try {
      await this.executeDownload(next);
      next.status = 'completed';
      next.completedAt = Date.now();
      this.completed.set(next.id, { ...next });

      // Persist completed download to storage
      if (next.filePath && next.filename) {
        console.log(`💾 [QUEUE] Saving completed download to storage...`);
        console.log(
          `📝 [QUEUE] Download details: ID=${next.id}, Title=${next.videoTitle}, File=${next.filename}`,
        );
        await storageService.addDownloadedVideo({
          id: next.id,
          videoId: next.videoId,
          title: next.videoTitle || 'Unknown',
          format: next.format,
          filePath: next.filePath,
          filename: next.filename,
          downloadedAt: next.completedAt,
          thumbnailUrl: undefined,
        });
        console.log(
          `✅ [QUEUE] Successfully saved download to storage: ${next.filename}`,
        );
      } else {
        console.warn(
          `⚠️ [QUEUE] Cannot save download to storage - missing filePath or filename`,
        );
      }
    } catch (error: any) {
      next.status = 'error';
      next.error = error instanceof Error ? error.message : String(error);
      next.completedAt = Date.now();
      this.completed.set(next.id, { ...next });
    } finally {
      // Clean up mapping for this job
      const internalId = this.idMap.get(next.id);
      if (internalId) this.idMap.delete(next.id);
      // Drop callbacks for this job
      this.callbacks.delete(next.id);
    }

    this.activeDownload = null;
    this.notifyListeners();
    // continue with next
    void this.processNext();
  }

  private executeDownload(job: DownloadJob): Promise<void> {
    console.log("JOB:", job)
    return new Promise((resolve, reject) => {
      const cb = this.callbacks.get(job.id);
      downloadService
        .downloadVideo(
          {
            videoId: job.videoId,
            format: job.format,
            bitRate: job.bitRate,
            quality: job.quality,
            videoTitle: job.videoTitle,
          },
          (progress: number) => {
            job.progress = progress;
            notificationService.showDownloadProgress(
              job.id,
              job.videoTitle,
              progress,
              'Downloading...',
              () => this.cancelDownload(job.id),
            );
            this.notifyListeners();
            cb?.onProgress?.(progress);
          },
          (filePath: string, filename: string) => {
            job.filePath = filePath;
            job.filename = filename;
            notificationService.showDownloadComplete(job.id, job.videoTitle);
            cb?.onComplete?.(filePath, filename);
            resolve();
          },
          (error: string) => {
            notificationService.showDownloadError(job.id, job.videoTitle, error);
            cb?.onError?.(error);
            reject(new Error(error));
          },
          job.id,
        )
        .then(internalId => {
          // Save mapping to allow cancelling via downloadService
          this.idMap.set(job.id, internalId);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  getState(): DownloadQueueState {
    return {
      activeDownload: this.activeDownload,
      queuedDownloads: [...this.queue],
      completedDownloads: new Map(this.completed),
    };
  }

  subscribe(listener: (state: DownloadQueueState) => void): () => void {
    this.listeners.add(listener);
    // push current state immediately
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private async restoreQueue() {
    try {
      const data = await storageService.loadDownloadQueue();
      if (!data) return;

      // Restore queued jobs first
      if (Array.isArray(data.queue)) {
        // Deep clone to avoid mutation issues
        this.queue = data.queue.map(j => ({ ...j }));
      }

      // Restore activeDownload (if any) as queued to resume
      if (data.activeDownload) {
        const activeJob: DownloadJob = {
          ...data.activeDownload,
        } as DownloadJob;
        // Reset status & progress for safety
        activeJob.status = 'queued';
        activeJob.progress = activeJob.progress ?? 0;
        this.queue.unshift(activeJob);
      }

      if (this.queue.length > 0) {
        this.notifyListeners();
        void this.processNext();
      }
    } catch (err) {
      console.error('❌ Failed to restore download queue', err);
    }
  }

  private schedulePersist() {
    // Debounce rapid successive writes (250ms window)
    if (this.persistDebounce) clearTimeout(this.persistDebounce);
    this.persistDebounce = setTimeout(() => {
      const snapshot: PersistedDownloadQueue = {
        activeDownload: this.activeDownload,
        queue: this.queue,
      };
      storageService.saveDownloadQueue(snapshot);
    }, 250);
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(l => l(state));
    this.schedulePersist();
  }

  getJob(id: string): DownloadJob | null {
    if (this.activeDownload?.id === id) return this.activeDownload;
    return this.queue.find(j => j.id === id) || this.completed.get(id) || null;
  }

  cancelDownload(id: string): void {
    if (this.activeDownload?.id === id) {
      // Attempt to cancel underlying service
      const internalId = this.idMap.get(id);
      if (internalId) {
        downloadService.cancelDownload(internalId);
        this.idMap.delete(id);
      }
      // Cancel notification and drop the active job so it disappears from the list
      notificationService.cancelNotification(id);
      this.activeDownload = null;
      this.notifyListeners();
      void this.processNext();
      return;
    }

    const idx = this.queue.findIndex(j => j.id === id);
    if (idx >= 0) {
      // Remove from queue entirely and cancel notification
      this.queue.splice(idx, 1);
      notificationService.cancelNotification(id);
      this.notifyListeners();
      return;
    }

    // If already completed but user tries to cancel, ignore
  }

  retryDownload(id: string): void {
    const job = this.completed.get(id);
    if (job && job.status === 'error') {
      this.completed.delete(id);
      // reset fields
      job.progress = 0;
      job.error = undefined;
      job.startedAt = undefined;
      job.completedAt = undefined;
      job.status = 'queued';
      this.enqueue(job);
    }
  }

  // Move a queued item one position up (closer to the front)
  moveUp(id: string): void {
    const idx = this.queue.findIndex(j => j.id === id);
    if (idx > 0) {
      const tmp = this.queue[idx - 1];
      this.queue[idx - 1] = this.queue[idx];
      this.queue[idx] = tmp;
      this.notifyListeners();
    }
  }

  // Move a queued item one position down (further from the front)
  moveDown(id: string): void {
    const idx = this.queue.findIndex(j => j.id === id);
    if (idx >= 0 && idx < this.queue.length - 1) {
      const tmp = this.queue[idx + 1];
      this.queue[idx + 1] = this.queue[idx];
      this.queue[idx] = tmp;
      this.notifyListeners();
    }
  }

  clearCompleted(): void {
    this.completed.clear();
    this.notifyListeners();
  }
}

export const clientDownloadQueue = new ClientDownloadQueue();
