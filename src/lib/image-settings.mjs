// Added 2026-11-13: shared upload limits and build-time responsive image settings.
export const imageSettings = {
  maxUploadBytes: 30 * 1024 * 1024,
  // Updated 2026-11-13: accept full-resolution camera portraits (the current files are 32.74 MP), with a bounded decoder.
  maxInputPixels: 60000000,
  deviceSizes: [480, 768, 1024, 1440, 1920, 2560],
  imageSizes: [64, 128, 256, 384],
  quality: 82,
  // Added 2026-11-13: bound stored upload dimensions and share compression settings with the editor.
  maxUploadDimension: 2560,
  uploadQuality: 88,
  // Added 2026-11-13: small cached admin thumbnails with bounded decoding concurrency.
  editorThumbnailSize: 256,
  editorThumbnailQuality: 65,
  editorThumbnailConcurrency: 2,
};

export function formatImageSize(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function validateUploadServer(status) {
  if (status.maxUploadBytes !== imageSettings.maxUploadBytes || status.maxInputPixels !== imageSettings.maxInputPixels || status.maxUploadDimension !== imageSettings.maxUploadDimension) {
    const activeLimit = Number.isSafeInteger(status.maxUploadBytes) && status.maxUploadBytes > 0 ? ` (${formatImageSize(status.maxUploadBytes)})` : "";
    throw new Error(`Server editor đang chạy cấu hình upload cũ${activeLimit}. Giới hạn hiện tại là ${formatImageSize(imageSettings.maxUploadBytes)} và ${imageSettings.maxInputPixels / 1000000} MP. Hãy lưu bản nháp trước, dừng terminal chạy dev rồi chạy lại npm run dev và đăng nhập lại admin.`);
  }
}
