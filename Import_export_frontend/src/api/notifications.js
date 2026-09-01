import apiClient from "./client";

export async function getMyNotifications({ unreadOnly = false } = {}) {
  const { data } = await apiClient.get("/notifications/me", {
    params: { non_lues: unreadOnly },
  });
  return Array.isArray(data) ? data : [];
}

export async function markNotificationRead(notificationId) {
  const { data } = await apiClient.patch(`/notifications/${notificationId}/read`);
  return data;
}

export async function sendEmailNotification({ to, subject, body }) {
  const { data } = await apiClient.post("/notifications/email", null, {
    params: { to, subject, body },
  });
  return data;
}

export async function sendSmsNotification({ to, message }) {
  const { data } = await apiClient.post("/notifications/sms", null, {
    params: { to, message },
  });
  return data;
}

export async function retryFailedNotifications() {
  const { data } = await apiClient.post("/notifications/retry-failed");
  return data;
}
