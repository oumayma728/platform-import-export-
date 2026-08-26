import adminClient from "./adminClient";
import apiClient from "../../../api/client";

// ── Auth admin (identité séparée, spec §4) ──

export async function adminLogin(email, password) {
  const { data } = await adminClient.post("/admin/auth/login", { email, password });
  return data;
}

export async function getAdminProfile() {
  const { data } = await adminClient.get("/admin/auth/me");
  return data;
}

export async function adminLogout() {
  const { data } = await adminClient.post("/admin/auth/logout");
  return data;
}

// ── Gestion des comptes admin (SUPERADMIN) ──

export async function getAdmins() {
  const { data } = await adminClient.get("/admin/admins");
  return data;
}

export async function createAdmin(payload) {
  const { data } = await adminClient.post("/admin/admins", payload);
  return data;
}

export async function deactivateAdmin(adminId) {
  const { data } = await adminClient.post(`/admin/admins/${adminId}/deactivate`);
  return data;
}

export async function reactivateAdmin(adminId) {
  const { data } = await adminClient.post(`/admin/admins/${adminId}/reactivate`);
  return data;
}

// ── Dashboard ──

export async function getDashboardStats() {
  const { data } = await adminClient.get("/admin/dashboard");
  return data;
}

export async function getAdminCountries() {
  const { data } = await adminClient.get("/admin/countries");
  return data.countries || [];
}

// ── Utilisateurs ──

export async function getUsers(params = {}) {
  const { data } = await adminClient.get("/admin/users", { params });
  return data;
}

export async function getUserDetail(userId) {
  const { data } = await adminClient.get(`/admin/users/${userId}`);
  return data;
}

export async function getValidationQueue(params = {}) {
  const { data } = await adminClient.get("/admin/validation-queue", { params });
  return data;
}

export async function validateUser(userId) {
  const { data } = await adminClient.post(`/admin/validate/${userId}`);
  return data;
}

export async function rejectUser(userId, motif) {
  const { data } = await adminClient.post(`/admin/reject/${userId}`, { motif });
  return data;
}

export async function suspendUser(userId, motif, suspensionDurationDays) {
  const { data } = await adminClient.post(`/admin/suspend/${userId}`, {
    motif,
    suspension_duration_days: suspensionDurationDays,
  });
  return data;
}

export async function reactivateUser(userId) {
  const { data } = await adminClient.post(`/admin/reactivate/${userId}`);
  return data;
}

// ── Entreprises ──

export async function getEnterprises(params = {}) {
  const { data } = await adminClient.get("/admin/enterprises", { params });
  return data;
}

export async function getEnterpriseDetail(entrepriseId) {
  const { data } = await adminClient.get(`/admin/enterprises/${entrepriseId}`);
  return data;
}

export async function updateEnterpriseValidation(entrepriseId, { action, motif }) {
  const { data } = await adminClient.patch(`/admin/enterprises/${entrepriseId}/validation`, {
    action,
    motif,
  });
  return data;
}

export async function getEnterpriseDocuments(entrepriseId) {
  const { data } = await adminClient.get(`/admin/enterprises/${entrepriseId}/documents`);
  return data;
}

// ── Signalements ──

export async function getReports(params = {}) {
  const { data } = await adminClient.get("/admin/reports", { params });
  return data;
}

export async function createReport(payload) {
  const { data } = await apiClient.post("/reports", payload);
  return data;
}

export async function treatReport(reportId, payload) {
  const { data } = await adminClient.post(`/admin/reports/${reportId}/treat`, payload);
  return data;
}

export async function getConversationInvestigation(conversationId) {
  const { data } = await adminClient.get(`/admin/conversations/${conversationId}`);
  return data;
}

// ── KYB ──

export async function getKYBVerifications(params = {}) {
  const { data } = await adminClient.get("/admin/kyb", { params });
  return data;
}

export async function getKYBChecklist() {
  const { data } = await adminClient.get("/admin/kyb/checklist");
  return data;
}

export async function createKYB(payload) {
  const { data } = await adminClient.post("/admin/kyb", payload);
  return data;
}

export async function reviewKYB(verificationId, payload) {
  const { data } = await adminClient.post(`/admin/kyb/${verificationId}/review`, payload);
  return data;
}

export async function getKybDocumentViewUrl(documentId) {
  const { data } = await adminClient.get(`/admin/kyb-documents/${documentId}/view-url`);
  return data;
}

export async function reviewKybDocument(documentId, payload) {
  const { data } = await adminClient.patch(`/admin/kyb-documents/${documentId}`, payload);
  return data;
}

// ── Badges ──

export async function getTrustBadges(params = {}) {
  const { data } = await adminClient.get("/admin/badges", { params });
  return data;
}

export async function awardBadge(payload) {
  const { data } = await adminClient.post("/admin/badges", payload);
  return data;
}

export async function awardBadgeDefinition(payload) {
  const { data } = await adminClient.post("/admin/badges/award", payload);
  return data;
}

export async function revokeBadge(badgeId) {
  const { data } = await adminClient.delete(`/admin/badges/${badgeId}`);
  return data;
}

export async function getBadgeDefinitions() {
  const { data } = await adminClient.get("/admin/badges/definitions");
  return data;
}

export async function createBadgeDefinition(payload) {
  const { data } = await adminClient.post("/admin/badges/definitions", payload);
  return data;
}

export async function deleteBadgeDefinition(badgeId) {
  const { data } = await adminClient.delete(`/admin/badges/definitions/${badgeId}`);
  return data;
}

// ── Avis ──

export async function getReviews(params = {}) {
  const { data } = await adminClient.get("/admin/reviews", { params });
  return data;
}

// ── Historique de modération ──

export async function getModerationHistory(params = {}) {
  const { data } = await adminClient.get("/admin/moderation-history", { params });
  return data;
}

// ── Score de confiance ──

export async function getReliabilityScore(entrepriseId) {
  const { data } = await adminClient.get(`/admin/reliability-score/${entrepriseId}`);
  return data;
}

export async function getReputationScore(entrepriseId) {
  const { data } = await adminClient.get(`/admin/reputation-score/${entrepriseId}`);
  return data;
}

export async function recomputeAllTrustScores() {
  const { data } = await adminClient.post("/admin/trust/recompute-all");
  return data;
}
