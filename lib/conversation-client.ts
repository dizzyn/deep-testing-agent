import type { ExplorerAgentUIMessage } from "@/agents/explorer";
import type { ServiceType } from "@/lib/conversation";

export async function loadConversationHistory(
  serviceType: ServiceType
): Promise<ExplorerAgentUIMessage[]> {
  try {
    const res = await fetch(`/api/chat?service=${serviceType}`);
    if (!res.ok) {
      console.error("Failed to fetch conversation history:", res.statusText);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    return data;
  } catch (error) {
    console.error("History load error:", error);
    return [];
  }
}

export async function clearConversation(
  ServiceType: ServiceType
): Promise<void> {
  try {
    const res = await fetch(`/api/chat?ServiceType=${ServiceType}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error(`Failed to clear conversation: ${res.statusText}`);
    }
  } catch (error) {
    console.error("Error clearing conversation:", error);
    throw error;
  }
}
