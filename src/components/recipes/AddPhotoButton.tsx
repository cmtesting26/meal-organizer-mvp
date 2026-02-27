/**
 * AddPhotoButton Component (Sprint 25)
 *
 * Overlaid pill button on recipe image area with dropdown menu
 * for "Take Photo" (camera) and "Upload File" (file picker).
 *
 * Source: Roadmap V1.6 Epic 6, Design Specification V1.6 — Photo Upload Recipe Detail
 * Mockup reference: recipe-detail-mockup.jsx
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Upload } from 'lucide-react';
import { uploadRecipePhoto, createPersistentPreviewUrl, type UploadResult, type UploadError } from '@/lib/photoUploadService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

interface AddPhotoButtonProps {
  recipeId: string;
  onPhotoUploaded: (result: UploadResult) => void;
}

export function AddPhotoButton({ recipeId, onPhotoUploaded }: AddPhotoButtonProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  const handleFileSelected = useCallback(
    async (file: File) => {
      setDropdownOpen(false);
      setUploading(true);

      // Get household ID from user profile
      const householdId = (user as any)?.household_id || 'local';

      try {
        const result = await uploadRecipePhoto(file, recipeId, householdId);
        onPhotoUploaded(result);
        toast.success(t('photoUpload.success'));
      } catch (error) {
        // Any upload failure (bucket missing, network, not configured) →
        // fall back to persistent base64 data URL stored in IndexedDB
        const uploadError = error as UploadError;
        try {
          const dataUrl = await createPersistentPreviewUrl(file);
          onPhotoUploaded({ photoUrl: dataUrl, thumbnailUrl: dataUrl });
          toast.success(t('photoUpload.savedLocally'));
        } catch {
          toast.error(uploadError.message || t('photoUpload.failed'));
        }
      } finally {
        setUploading(false);
      }
    },
    [recipeId, user, onPhotoUploaded, toast, t],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelected(file);
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [handleFileSelected],
  );

  const handleTakePhoto = () => cameraInputRef.current?.click();
  const handleUploadFile = () => fileInputRef.current?.click();

  return (
    <div ref={dropdownRef} className="relative">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Add Photo pill button */}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        disabled={uploading}
        className="flex items-center gap-1.5 transition-opacity hover:opacity-90"
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          backgroundColor: 'var(--fs-bg-surface, #FFFFFF)',
          border: '1px solid var(--fs-border-default, #C5B5AB)',
          borderRadius: '9999px',
          padding: '6px 14px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--fs-text-secondary, #57534E)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          cursor: uploading ? 'wait' : 'pointer',
          opacity: uploading ? 0.6 : 1,
          zIndex: 10,
        }}
      >
        <Camera className="w-3.5 h-3.5" style={{ stroke: 'currentColor' }} />
        {uploading ? t('photoUpload.uploading') : t('photoUpload.addPhoto')}
      </button>

      {/* Dropdown menu */}
      {dropdownOpen && !uploading && (
        <div
          style={{
            position: 'absolute',
            bottom: '48px',
            right: '12px',
            backgroundColor: 'var(--fs-bg-surface, white)',
            borderRadius: '12px',
            border: '1px solid var(--fs-border-default, #C5B5AB)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            width: '180px',
            zIndex: 20,
            overflow: 'hidden',
          }}
        >
          <button
            onClick={handleTakePhoto}
            className="flex items-center gap-3 w-full text-left hover:opacity-80 transition-opacity"
            style={{
              padding: '12px 16px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--fs-text-primary, #2D2522)',
              borderBottom: '1px solid var(--fs-border-default, #C5B5AB)',
            }}
          >
            <Camera className="w-4 h-4" style={{ stroke: 'var(--fs-accent, #D4644E)' }} />
            {t('photoUpload.takePhoto')}
          </button>
          <button
            onClick={handleUploadFile}
            className="flex items-center gap-3 w-full text-left hover:opacity-80 transition-opacity"
            style={{
              padding: '12px 16px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--fs-text-primary, #2D2522)',
            }}
          >
            <Upload className="w-4 h-4" style={{ stroke: 'var(--fs-accent, #D4644E)' }} />
            {t('photoUpload.uploadFile')}
          </button>
        </div>
      )}
    </div>
  );
}
