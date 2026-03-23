import { API_ENDPOINTS } from '../config/api.config';

export interface AttachmentRecord {
  id: number;
  entityType: string;
  entityId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  storageType: string;
  storagePath: string;
  category: string | null;
  description: string | null;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const attachmentsService = {
  /**
   * Upload a file for an entity
   */
  async upload(
    file: File,
    entityType: string,
    entityId: string,
    category?: string,
    description?: string,
  ): Promise<AttachmentRecord> {
    const formData = new FormData();
    formData.append('file', file);

    const params = new URLSearchParams({ entityType, entityId });
    if (category) params.append('category', category);
    if (description) params.append('description', description);

    const res = await fetch(`${API_ENDPOINTS.attachmentUpload}?${params.toString()}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Upload failed');
    }
    return res.json();
  },

  /**
   * List attachments for an entity
   */
  async getByEntity(entityType: string, entityId: string): Promise<AttachmentRecord[]> {
    const params = new URLSearchParams({ entityType, entityId });
    const res = await fetch(`${API_ENDPOINTS.attachments}?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Failed to load attachments');
    }
    return res.json();
  },

  /**
   * Get download URL for an attachment
   */
  getDownloadUrl(id: number): string {
    return API_ENDPOINTS.attachmentDownload(id);
  },

  /**
   * Get preview URL for an attachment (images, PDFs)
   */
  getPreviewUrl(id: number): string {
    return API_ENDPOINTS.attachmentPreview(id);
  },

  /**
   * Delete an attachment
   */
  async delete(id: number): Promise<void> {
    const res = await fetch(API_ENDPOINTS.attachmentById(id), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Delete failed');
    }
  },

  /**
   * Delete all attachments for an entity
   */
  async deleteAllForEntity(entityType: string, entityId: string): Promise<{ deleted: number }> {
    const params = new URLSearchParams({ entityType, entityId });
    const res = await fetch(`${API_ENDPOINTS.attachments}?${params.toString()}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Delete failed');
    }
    return res.json();
  },

  /**
   * Get storage info
   */
  async getStorageInfo(): Promise<{ mode: string }> {
    const res = await fetch(API_ENDPOINTS.attachmentStorageInfo, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      return { mode: 'unknown' };
    }
    return res.json();
  },
};
