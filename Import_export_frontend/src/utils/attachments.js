// Utilitaires partagés pour ouvrir/prévisualiser une pièce jointe, qu'elle
// vienne d'une annonce (documents) ou d'un message de la messagerie.
//
// En mode mock, un fichier tout juste sélectionné par l'utilisateur (via
// FileDropzone ou le composeur de messages) n'existe que côté navigateur :
// on génère une URL locale (blob:) via URL.createObjectURL, valable tant que
// l'onglet reste ouvert. Une fois un vrai backend branché, `attachment.url`
// (renvoyé par le serveur après upload) prendra le relais automatiquement.

export function isImageAttachment(attachment) {
  if (attachment?.file?.type) return attachment.file.type.startsWith("image/");
  return /\.(png|jpe?g|webp|gif)$/i.test(attachment?.name || "");
}

export function getAttachmentUrl(attachment) {
  if (!attachment) return null;
  if (attachment.url) return attachment.url;
  if (attachment.file) {
    if (!attachment.file.__objectUrl) {
      attachment.file.__objectUrl = URL.createObjectURL(attachment.file);
    }
    return attachment.file.__objectUrl;
  }
  return null;
}
