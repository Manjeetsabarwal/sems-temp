import React, { useState, useEffect, useRef } from 'react';
import {
  Paperclip,
  Upload,
  Trash2,
  Download,
  Eye,
  FileText,
  Image,
  File,
  Loader2,
  X,
  HardDrive,
  Cloud,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { attachmentsService, type AttachmentRecord } from '../services/attachments.service';

interface FileAttachmentsProps {
  entityType: string;
  entityId: string;
  readOnly?: boolean;
  maxFiles?: number;
  acceptedTypes?: string; // e.g. "image/*,.pdf,.doc,.docx"
  title?: string;
  compact?: boolean;
}

const FILE_CATEGORIES = [
  { value: 'document', label: 'Document' },
  { value: 'photo', label: 'Photo' },
  { value: 'id_proof', label: 'ID Proof' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'report', label: 'Report' },
  { value: 'other', label: 'Other' },
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image className="w-5 h-5 text-green-600" />;
  if (mimeType === 'application/pdf') return <FileText className="w-5 h-5 text-red-600" />;
  if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="w-5 h-5 text-blue-600" />;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileText className="w-5 h-5 text-emerald-600" />;
  return <File className="w-5 h-5 text-gray-500" />;
}

function isPreviewable(mimeType: string): boolean {
  return mimeType.startsWith('image/') || mimeType === 'application/pdf';
}

export function FileAttachments({
  entityType,
  entityId,
  readOnly = false,
  maxFiles = 20,
  acceptedTypes = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv',
  title = 'Attachments',
  compact = false,
}: FileAttachmentsProps) {
  const [attachments, setAttachments] = useState<AttachmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('');
  const [storageMode, setStorageMode] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load attachments
  const loadAttachments = async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const data = await attachmentsService.getByEntity(entityType, entityId);
      setAttachments(data);
    } catch (err: any) {
      // Silently fail if backend doesn't support attachments yet
      console.warn('Failed to load attachments:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load storage info
  const loadStorageInfo = async () => {
    try {
      const info = await attachmentsService.getStorageInfo();
      setStorageMode(info.mode);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadAttachments();
    loadStorageInfo();
  }, [entityType, entityId]);

  // Handle file upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        await attachmentsService.upload(file, entityType, entityId);
        successCount++;
      } catch (err: any) {
        toast.error(`Failed to upload ${file.name}: ${err.message}`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} file(s) uploaded successfully`);
      await loadAttachments();
    }

    setUploading(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle delete
  const handleDelete = async (attachment: AttachmentRecord) => {
    if (!confirm(`Delete "${attachment.originalName}"?`)) return;

    try {
      await attachmentsService.delete(attachment.id);
      toast.success('File deleted');
      await loadAttachments();
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  // Handle download
  const handleDownload = (attachment: AttachmentRecord) => {
    const url = attachmentsService.getDownloadUrl(attachment.id);
    window.open(url, '_blank');
  };

  // Handle preview
  const handlePreview = (attachment: AttachmentRecord) => {
    const url = attachmentsService.getPreviewUrl(attachment.id);
    setPreviewUrl(url);
    setPreviewName(attachment.originalName);
  };

  // Drag and drop
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!readOnly) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (readOnly) return;

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      try {
        await attachmentsService.upload(files[i], entityType, entityId);
        successCount++;
      } catch (err: any) {
        toast.error(`Failed to upload ${files[i].name}: ${err.message}`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} file(s) uploaded successfully`);
      await loadAttachments();
    }
    setUploading(false);
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{title}</span>
            <Badge variant="secondary" className="text-xs">
              {attachments.length}
            </Badge>
            {storageMode && (
              <Badge variant="outline" className="text-xs gap-1">
                {storageMode === 's3' ? <Cloud className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
                {storageMode === 's3' ? 'S3' : 'Local'}
              </Badge>
            )}
          </div>
          {!readOnly && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={acceptedTypes}
                onChange={handleUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                Upload
              </Button>
            </div>
          )}
        </div>

        {loading && <div className="text-sm text-gray-500">Loading attachments...</div>}

        {!loading && attachments.length === 0 && (
          <div className="text-sm text-gray-400 italic">No attachments</div>
        )}

        {attachments.map((att) => (
          <div key={att.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm">
            {getFileIcon(att.mimeType)}
            <span className="flex-1 truncate" title={att.originalName}>
              {att.originalName}
            </span>
            <span className="text-gray-400 text-xs whitespace-nowrap">{formatFileSize(att.size)}</span>
            <div className="flex gap-1">
              {isPreviewable(att.mimeType) && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handlePreview(att)}>
                  <Eye className="w-3 h-3" />
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDownload(att)}>
                <Download className="w-3 h-3" />
              </Button>
              {!readOnly && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700" onClick={() => handleDelete(att)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* Preview Modal */}
        {previewUrl && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setPreviewUrl(null)}>
            <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium truncate mr-4">{previewName}</h3>
                <Button variant="ghost" size="sm" onClick={() => setPreviewUrl(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {previewName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                <img src={previewUrl} alt={previewName} className="max-w-full max-h-[75vh] object-contain mx-auto" />
              ) : (
                <iframe src={previewUrl} className="w-full h-[75vh] border rounded" title={previewName} />
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full card view
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-gray-500" />
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant="secondary">{attachments.length}</Badge>
            {storageMode && (
              <Badge variant="outline" className="text-xs gap-1">
                {storageMode === 's3' ? <Cloud className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
                {storageMode === 's3' ? 'S3 Storage' : 'Local Storage'}
              </Badge>
            )}
          </div>
          {!readOnly && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={acceptedTypes}
                onChange={handleUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload Files
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Drag & Drop Zone */}
        {!readOnly && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center mb-4 transition-colors cursor-pointer ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">
              {uploading ? 'Uploading...' : 'Drag & drop files here or click to browse'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Max 25MB per file · {acceptedTypes.replace(/\./g, '').replace(/,/g, ', ')}
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading attachments...</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && attachments.length === 0 && (
          <div className="text-center py-6 text-gray-400">
            <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No files attached yet</p>
          </div>
        )}

        {/* File list */}
        {!loading && attachments.length > 0 && (
          <div className="space-y-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                {getFileIcon(att.mimeType)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={att.originalName}>
                    {att.originalName}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{formatFileSize(att.size)}</span>
                    <span>·</span>
                    <span>{new Date(att.createdAt).toLocaleDateString()}</span>
                    {att.category && (
                      <>
                        <span>·</span>
                        <Badge variant="outline" className="text-xs py-0">
                          {att.category}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isPreviewable(att.mimeType) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handlePreview(att)}
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleDownload(att)}
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(att)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        {previewUrl && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setPreviewUrl(null)}>
            <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium truncate mr-4">{previewName}</h3>
                <Button variant="ghost" size="sm" onClick={() => setPreviewUrl(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {previewName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                <img src={previewUrl} alt={previewName} className="max-w-full max-h-[75vh] object-contain mx-auto" />
              ) : (
                <iframe src={previewUrl} className="w-full h-[75vh] border rounded" title={previewName} />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
