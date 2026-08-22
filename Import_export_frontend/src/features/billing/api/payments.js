import apiClient, { USE_MOCKS } from "../../../api/client";

export async function createPaymentIntent(planId) {
  if (USE_MOCKS) {
    return null;
  }

  const { data } = await apiClient.post("/payments/create-intent", { planId });
  return data;
}
