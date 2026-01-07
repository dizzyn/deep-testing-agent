import type { ExplorerAgentUIMessage } from "@/agents/explorer";
import type { ConversationType } from "@/lib/conversation";

interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts?: unknown[];
  createdAt: string;
}

export async function loadConversationHistory(
  conversationType: ConversationType
): Promise<ExplorerAgentUIMessage[]> {
  try {
    const res = await fetch(`/api/chat?conversationType=${conversationType}`);
    if (!res.ok) {
      console.error("Failed to fetch conversation history:", res.statusText);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const formatted = data.map(
      (msg: StoredMessage): ExplorerAgentUIMessage => ({
        ...msg,
        parts: Array.isArray(msg.parts)
          ? msg.parts
          : JSON.parse(msg.content || "[]"),
      })
    ) as ExplorerAgentUIMessage[];

    return formatted;
  } catch (error) {
    console.error("History load error:", error);
    return [];
  }
}

export async function clearConversation(
  conversationType: ConversationType
): Promise<void> {
  try {
    const res = await fetch(`/api/chat?conversationType=${conversationType}`, {
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
