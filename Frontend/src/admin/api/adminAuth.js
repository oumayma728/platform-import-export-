import adminClient from "./adminClient";


export async function adminLogin({ email, password }) {
  const { data } = await adminClient.post("/admin/login", { email, password });
  return data; 
}


export async function adminLogout() {
  try {
    await adminClient.post("/admin/logout");
  } catch {
    
  }
}
