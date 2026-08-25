import adminClient from "./adminClient";


export async function getModerationHistory(entityType, entityId, page = 1, limit = 10) {
  const { data } = await adminClient.get("/admin/moderation-history", {
    params: {
      entity_type: entityType,
      entity_id: entityId,
      page,
      limit,
    },
  });
  return data;
}
