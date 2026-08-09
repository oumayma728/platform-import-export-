import apiClient from "./client";

// ── Documents KYB côté utilisateur (spec §3 / §5.1) ──
// Ces endpoints utilisent le token du connecté (get_current_user) et ne sont
// donc PAS appelés avec le client admin.

export async function getMyKybDocuments() {
  const { data } = await apiClient.get("/admin/kyb-documents");
  return data;
}

export async function presignKybUpload(payload) {
  const { data } = await apiClient.post("/admin/kyb-documents/presign-upload", payload);
  return data;
}

export async function localKybUpload(documentId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post(`/admin/kyb-documents/${documentId}/local-upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function confirmKybUpload(documentId) {
  const { data } = await apiClient.post(`/admin/kyb-documents/${documentId}/confirm`);
  return data;
}
