import apiClient from "../../../api/client";

export async function createPaymentIntent(planId) {
  const { data } = await apiClient.post(
    "/billing/create-payment-intent", 
    {
       planId: planId,
    }
  );
  
  return data;
}
