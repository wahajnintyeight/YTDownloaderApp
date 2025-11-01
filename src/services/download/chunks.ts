export function normalizeBase64(input: string): string {
  let s = input.replace(/\s/g, '');
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  s = s.replace(/[^A-Za-z0-9+/=]/g, '');
  const padding = (4 - (s.length % 4)) % 4;
  if (padding) s = s + '='.repeat(padding);
  return s;
}

interface AssembleParams {
  downloadId: string;
  filename: string;
  mimeType: string;
  chunkBuffer: Map<string, string[]>;
  totalChunksPerDownload: Map<string, number>;
  receivedChunksPerDownload: Map<string, number>;
  saveBase64: (base64: string, filename: string) => Promise<string>;
  onComplete?: (filePath: string, filename: string) => void;
  onError?: (error: string) => void;
  cleanup: (downloadId: string) => void;
}

export async function assembleChunks({
  downloadId,
  filename,
  mimeType: _mimeType, // currently unused but kept for parity with old signature
  chunkBuffer,
  totalChunksPerDownload,
  receivedChunksPerDownload,
  saveBase64,
  onComplete,
  onError,
  cleanup,
}: AssembleParams): Promise<void> {
  try {
    const chunks = chunkBuffer.get(downloadId);
    const total = totalChunksPerDownload.get(downloadId) || 0;
    const received = receivedChunksPerDownload.get(downloadId) || 0;

    if (!chunks || chunks.length === 0 || received !== total) {
      throw new Error(`Incomplete chunks: ${received}/${total}`);
    }

    for (let i = 0; i < chunks.length; i++) {
      if (!chunks[i]) {
        throw new Error(`Missing chunk at index ${i}`);
      }
    }

    const fullBase64 = normalizeBase64(chunks.join(''));
    if (fullBase64.length % 4 !== 0) {
      throw new Error(`Invalid base64 length: ${fullBase64.length} (not divisible by 4)`);
    }

    const filePath = await saveBase64(fullBase64, filename);
    onComplete?.(filePath, filename);
    cleanup(downloadId);
  } catch (error: any) {
    onError?.(`Failed to assemble file: ${error?.message || String(error)}`);
    cleanup(downloadId);
  }
}
