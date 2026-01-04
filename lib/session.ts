export interface SessionData {
  chatHistory: unknown[];
  sessionMeta: {
    createdAt: string;
    lastUpdated: string;
    sessionId: string;
    status: string;
    messageCount?: number;
    testBrief?: string;
  };
  sessionState: Record<string, unknown>;
  files: string[];
}

export async function fetchSessionData(): Promise<SessionData> {
  const response = await fetch("/api/session");
  if (!response.ok) {
    throw new Error("Failed to fetch session data");
  }
  return response.json();
}

export async function updateSessionData(
  data: Partial<SessionData>
): Promise<void> {
  const response = await fetch("/api/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update session data");
  }
}

export async function resetSession(): Promise<void> {
  const response = await fetch("/api/session", {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to reset session");
  }
}
