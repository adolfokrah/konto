/// Enum to distinguish the purpose/context of media uploads
enum MediaUploadContext {
  /// Upload for user profile photo
  userPhoto,

  /// Upload for jar image/background
  jarImage,

  /// Upload for general media (default)
  general,

  // Upload from jar details home screen
  jarImageHome,

  /// Upload for a business KYB document (goes to the private
  /// `business-documents` collection). The specific slot is identified via the
  /// `contextId` carried on the upload event/state.
  businessDocument,
}
