import apiClient from "./client";

export async function getReferenceOptions(kind) {
  const response = await apiClient.get(`/reference-options/${kind}`);
  return Array.isArray(response.data) ? response.data : [];
}

export async function addReferenceOption(kind, value, label = null) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    throw new Error("La valeur est obligatoire.");
  }

  const response = await apiClient.post(`/reference-options/${kind}`, {
    value: trimmed,
    label: label || trimmed,
  });

  return response.data;
}
