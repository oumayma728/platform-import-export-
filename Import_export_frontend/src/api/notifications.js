import apiClient from "./client";

export async function getNotifications(params = {}) {
  const { data } = await apiClient.get("/notifications", { params });
  return data;
}

export async function getUnreadNotificationsCount() {
  const { data } = await apiClient.get("/notifications/unread-count");
  return data;
}

export async function markNotificationRead(notificationId) {
  const { data } = await apiClient.post(`/notifications/${notificationId}/read`);
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await apiClient.post("/notifications/read-all");
  return data;
}
