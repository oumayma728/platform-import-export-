import adminClient from "./adminClient";


export async function getAdminUsers(filters = {}) {
  // Nettoyer les valeurs vides pour éviter ?status=&country= dans l'URL
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== "" && v !== null && v !== undefined)
  );
  const { data } = await adminClient.get("/admin/users", { params });
  return data;
}


export async function suspendUser(userId, body = {}) {
  const { data } = await adminClient.post(`/admin/users/${userId}/suspend`, body);
  return data;
}
