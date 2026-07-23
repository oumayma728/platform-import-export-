import apiClient from "../../../api/client";

export async function getDashboardStats() {
  const { data } = await apiClient.get("/admin/dashboard");
  return data;
}

export async function getUsers(params = {}) {
  const { data } = await apiClient.get("/admin/users", { params });
  return data;
}

export async function getUserDetail(userId) {
  const { data } = await apiClient.get(`/admin/users/${userId}`);
  return data;
}

export async function getValidationQueue() {
  const { data } = await apiClient.get("/admin/validation-queue");
  return data;
}

export async function validateUser(userId) {
  const { data } = await apiClient.post(`/admin/validate/${userId}`);
  return data;
}

export async function rejectUser(userId, motif) {
  const { data } = await apiClient.post(`/admin/reject/${userId}`, { motif });
  return data;
}

export async function suspendUser(userId, motif) {
  const { data } = await apiClient.post(`/admin/suspend/${userId}`, { motif });
  return data;
}

export async function reactivateUser(userId) {
  const { data } = await apiClient.post(`/admin/reactivate/${userId}`);
  return data;
}

export async function getEnterprises(params = {}) {
  const { data } = await apiClient.get("/admin/enterprises", { params });
  return data;
}

export async function getReports(params = {}) {
  const { data } = await apiClient.get("/admin/reports", { params });
  return data;
}

export async function createReport(payload) {
  const { data } = await apiClient.post("/admin/reports", payload);
  return data;
}

export async function treatReport(reportId, payload) {
  const { data } = await apiClient.post(`/admin/reports/${reportId}/treat`, payload);
  return data;
}

export async function getKYBVerifications(params = {}) {
  const { data } = await apiClient.get("/admin/kyb", { params });
  return data;
}

export async function createKYB(payload) {
  const { data } = await apiClient.post("/admin/kyb", payload);
  return data;
}

export async function reviewKYB(verificationId, payload) {
  const { data } = await apiClient.post(`/admin/kyb/${verificationId}/review`, payload);
  return data;
}

export async function getTrustBadges(params = {}) {
  const { data } = await apiClient.get("/admin/badges", { params });
  return data;
}

export async function awardBadge(payload) {
  const { data } = await apiClient.post("/admin/badges", payload);
  return data;
}

export async function revokeBadge(badgeId) {
  const { data } = await apiClient.delete(`/admin/badges/${badgeId}`);
  return data;
}

export async function getReviews(params = {}) {
  const { data } = await apiClient.get("/admin/reviews", { params });
  return data;
}

export async function getModerationHistory(params = {}) {
  const { data } = await apiClient.get("/admin/moderation-history", { params });
  return data;
}

export async function getReliabilityScore(entrepriseId) {
  const { data } = await apiClient.get(`/admin/reliability-score/${entrepriseId}`);
  return data;
}
