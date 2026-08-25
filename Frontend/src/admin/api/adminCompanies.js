import adminClient from "./adminClient";


export async function getAdminCompanies(filters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== "" && v !== null && v !== undefined)
  );
  const { data } = await adminClient.get("/admin/companies", { params });
  return data;
}


export async function getPendingCompanies(page = 1, limit = 10) {
  const { data } = await adminClient.get("/admin/companies/pending", {
    params: { page, limit },
  });
  return data;
}


export async function getCompanyDocuments(companyId) {
  const { data } = await adminClient.get(`/admin/companies/${companyId}/documents`);
  return data;
}


export async function validateCompany(companyId, body = {}) {
  const { data } = await adminClient.post(`/admin/companies/${companyId}/validate`, body);
  return data;
}


export async function rejectCompany(companyId, body = {}) {
  const { data } = await adminClient.post(`/admin/companies/${companyId}/reject`, body);
  return data;
}


export async function kybVerify(companyId, body) {
  const { data } = await adminClient.post(`/admin/companies/${companyId}/kyb-verify`, body);
  return data;
}


export async function assignBadge(companyId, body) {
  const { data } = await adminClient.post(`/admin/companies/${companyId}/badges`, body);
  return data;
}


export async function getCompanyReviewsSummary(companyId) {
  const { data } = await adminClient.get(`/companies/${companyId}/reviews/summary`);
  return data;
}
