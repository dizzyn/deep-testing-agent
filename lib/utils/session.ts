/**
 * Session management utilities for Scout Web Testing Agent
 * Enhanced for LangGraph v1.0.7 StateGraph state persistence
 */

import { randomUUID } from "crypto";
import { mkdir, writeFile, readFile, rm, readdir, stat } from "fs/promises";
import { join, dirname } from "path";
import { existsSync } from "fs";
import type { ScoutState, MissionBrief, Action } from "../graph/state";

/**
 * Session configuration interface
 */
export interface SessionConfig {
  session_id: string;
  storage_path: string;
  cleanup_on_exit: boolean;
  created_at: string;
  last_accessed: string;
}

/**
 * Session storage paths
 */
export interface SessionPaths {
  root: string;
  screenshots: string;
  logs: string;
  state: string;
  missionBrief: string;
  executionJournal: string;
  finalReport: string;
}

/**
 * Create a new isolated session with LangGraph state persistence
 */
export async function createSession(): Promise<SessionConfig> {
  const sessionId = randomUUID();
  const storagePath = join("/tmp", `scout-${sessionId}`);

  console.log("📁 Creating session:", sessionId);

  // Create session directory structure
  await mkdir(storagePath, { recursive: true });
  await mkdir(join(storagePath, "screenshots"), { recursive: true });
  await mkdir(join(storagePath, "logs"), { recursive: true });

  const config: SessionConfig = {
    session_id: sessionId,
    storage_path: storagePath,
    cleanup_on_exit: true,
    created_at: new Date().toISOString(),
    last_accessed: new Date().toISOString(),
  };

  // Save session config
  await writeFile(
    join(storagePath, "session.json"),
    JSON.stringify(config, null, 2)
  );

  console.log("✅ Session created:", storagePath);

  return config;
}

/**
 * Get session paths for organized file storage
 */
export function getSessionPaths(sessionConfig: SessionConfig): SessionPaths {
  const root = sessionConfig.storage_path;
  return {
    root,
    screenshots: join(root, "screenshots"),
    logs: join(root, "logs"),
    state: join(root, "state.json"),
    missionBrief: join(root, "mission_brief.json"),
    executionJournal: join(root, "execution_journal.json"),
    finalReport: join(root, "final_report.json"),
  };
}

/**
 * Save LangGraph state with persistence across interruptions
 */
export async function saveState(
  sessionConfig: SessionConfig,
  state: ScoutState
): Promise<void> {
  const paths = getSessionPaths(sessionConfig);

  // Update last accessed time
  const updatedConfig = {
    ...sessionConfig,
    last_accessed: new Date().toISOString(),
  };

  try {
    // Save state with timestamp
    const stateWithMetadata = {
      ...state,
      _metadata: {
        saved_at: new Date().toISOString(),
        session_id: sessionConfig.session_id,
        version: "1.0.7",
      },
    };

    await writeFile(paths.state, JSON.stringify(stateWithMetadata, null, 2));

    // Update session config
    await writeFile(
      join(sessionConfig.storage_path, "session.json"),
      JSON.stringify(updatedConfig, null, 2)
    );

    console.log("💾 State saved for session:", sessionConfig.session_id);
  } catch (error) {
    console.error("❌ Failed to save state:", error);
    throw new Error(
      `Failed to save state: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Load LangGraph state with error recovery
 */
export async function loadState(
  sessionConfig: SessionConfig
): Promise<ScoutState | null> {
  const paths = getSessionPaths(sessionConfig);

  try {
    if (!existsSync(paths.state)) {
      console.log(
        "📂 No saved state found for session:",
        sessionConfig.session_id
      );
      return null;
    }

    const content = await readFile(paths.state, "utf-8");
    const savedData = JSON.parse(content);

    // Extract state (remove metadata)
    const { _metadata, ...state } = savedData;

    console.log("📖 State loaded for session:", sessionConfig.session_id, {
      savedAt: _metadata?.saved_at,
      version: _metadata?.version,
    });

    return state as ScoutState;
  } catch (error) {
    console.error("❌ Failed to load state:", error);
    return null;
  }
}

/**
 * Save mission brief to session
 */
export async function saveMissionBrief(
  sessionConfig: SessionConfig,
  missionBrief: MissionBrief
): Promise<void> {
  const paths = getSessionPaths(sessionConfig);

  try {
    await writeFile(paths.missionBrief, JSON.stringify(missionBrief, null, 2));
    console.log(
      "📋 Mission brief saved for session:",
      sessionConfig.session_id
    );
  } catch (error) {
    console.error("❌ Failed to save mission brief:", error);
    throw error;
  }
}

/**
 * Load mission brief from session
 */
export async function loadMissionBrief(
  sessionConfig: SessionConfig
): Promise<MissionBrief | null> {
  const paths = getSessionPaths(sessionConfig);

  try {
    if (!existsSync(paths.missionBrief)) {
      return null;
    }

    const content = await readFile(paths.missionBrief, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("❌ Failed to load mission brief:", error);
    return null;
  }
}

/**
 * Save execution journal with action history
 */
export async function saveExecutionJournal(
  sessionConfig: SessionConfig,
  actions: Action[]
): Promise<void> {
  const paths = getSessionPaths(sessionConfig);

  const journal = {
    session_id: sessionConfig.session_id,
    actions,
    created_at: new Date().toISOString(),
    total_actions: actions.length,
  };

  try {
    await writeFile(paths.executionJournal, JSON.stringify(journal, null, 2));
    console.log("📝 Execution journal saved:", actions.length, "actions");
  } catch (error) {
    console.error("❌ Failed to save execution journal:", error);
    throw error;
  }
}

/**
 * Save screenshot with organized naming
 */
export async function saveScreenshot(
  sessionConfig: SessionConfig,
  screenshotData: Buffer,
  filename?: string
): Promise<string> {
  const paths = getSessionPaths(sessionConfig);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const screenshotFilename = filename || `screenshot-${timestamp}.png`;
  const screenshotPath = join(paths.screenshots, screenshotFilename);

  try {
    await writeFile(screenshotPath, screenshotData);
    console.log("📸 Screenshot saved:", screenshotFilename);
    return screenshotPath;
  } catch (error) {
    console.error("❌ Failed to save screenshot:", error);
    throw error;
  }
}

/**
 * Get screenshot path for session
 */
export function getScreenshotPath(
  sessionConfig: SessionConfig,
  filename: string
): string {
  const paths = getSessionPaths(sessionConfig);
  return join(paths.screenshots, filename);
}

/**
 * List all screenshots in session
 */
export async function listScreenshots(
  sessionConfig: SessionConfig
): Promise<string[]> {
  const paths = getSessionPaths(sessionConfig);

  try {
    if (!existsSync(paths.screenshots)) {
      return [];
    }

    const files = await readdir(paths.screenshots);
    return files.filter(
      (file) => file.endsWith(".png") || file.endsWith(".jpg")
    );
  } catch (error) {
    console.error("❌ Failed to list screenshots:", error);
    return [];
  }
}

/**
 * Save final test result to session
 */
export async function saveTestResult(
  sessionConfig: SessionConfig,
  result: {
    status: "PASS" | "FAIL";
    evidence: string[];
    summary: string;
    final_screenshot?: string;
  }
): Promise<void> {
  const paths = getSessionPaths(sessionConfig);

  const finalReport = {
    session_id: sessionConfig.session_id,
    ...result,
    completed_at: new Date().toISOString(),
  };

  try {
    await writeFile(paths.finalReport, JSON.stringify(finalReport, null, 2));
    console.log("📊 Final report saved:", result.status);
  } catch (error) {
    console.error("❌ Failed to save test result:", error);
    throw error;
  }
}

/**
 * Get session statistics
 */
export async function getSessionStats(sessionConfig: SessionConfig): Promise<{
  size: number;
  screenshotCount: number;
  hasState: boolean;
  hasMissionBrief: boolean;
  hasExecutionJournal: boolean;
  hasFinalReport: boolean;
}> {
  const paths = getSessionPaths(sessionConfig);

  try {
    // Calculate directory size
    let totalSize = 0;
    const calculateSize = async (dirPath: string): Promise<void> => {
      if (!existsSync(dirPath)) return;

      const items = await readdir(dirPath);
      for (const item of items) {
        const itemPath = join(dirPath, item);
        const stats = await stat(itemPath);
        if (stats.isDirectory()) {
          await calculateSize(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
    };

    await calculateSize(paths.root);

    const screenshots = await listScreenshots(sessionConfig);

    return {
      size: totalSize,
      screenshotCount: screenshots.length,
      hasState: existsSync(paths.state),
      hasMissionBrief: existsSync(paths.missionBrief),
      hasExecutionJournal: existsSync(paths.executionJournal),
      hasFinalReport: existsSync(paths.finalReport),
    };
  } catch (error) {
    console.error("❌ Failed to get session stats:", error);
    return {
      size: 0,
      screenshotCount: 0,
      hasState: false,
      hasMissionBrief: false,
      hasExecutionJournal: false,
      hasFinalReport: false,
    };
  }
}

/**
 * Clean up session directory with confirmation
 */
export async function cleanupSession(
  sessionConfig: SessionConfig,
  force: boolean = false
): Promise<void> {
  if (!sessionConfig.cleanup_on_exit && !force) {
    console.log("🔒 Session cleanup disabled:", sessionConfig.session_id);
    return;
  }

  try {
    const stats = await getSessionStats(sessionConfig);
    console.log("🧹 Cleaning up session:", sessionConfig.session_id, {
      size: `${(stats.size / 1024).toFixed(2)}KB`,
      screenshots: stats.screenshotCount,
    });

    await rm(sessionConfig.storage_path, { recursive: true, force: true });
    console.log("✅ Session cleaned up successfully");
  } catch (error) {
    console.warn(
      `⚠️ Failed to cleanup session ${sessionConfig.session_id}:`,
      error
    );
  }
}

/**
 * Load existing session by ID
 */
export async function loadSession(
  sessionId: string
): Promise<SessionConfig | null> {
  const storagePath = join("/tmp", `scout-${sessionId}`);
  const configPath = join(storagePath, "session.json");

  try {
    if (!existsSync(configPath)) {
      return null;
    }

    const content = await readFile(configPath, "utf-8");
    const config = JSON.parse(content) as SessionConfig;

    // Update last accessed time
    const updatedConfig = {
      ...config,
      last_accessed: new Date().toISOString(),
    };

    await writeFile(configPath, JSON.stringify(updatedConfig, null, 2));

    console.log("📂 Session loaded:", sessionId);
    return updatedConfig;
  } catch (error) {
    console.error("❌ Failed to load session:", error);
    return null;
  }
}

/**
 * List all active sessions
 */
export async function listActiveSessions(): Promise<SessionConfig[]> {
  const tmpDir = "/tmp";
  const sessions: SessionConfig[] = [];

  try {
    const items = await readdir(tmpDir);
    const scoutDirs = items.filter((item) => item.startsWith("scout-"));

    for (const dir of scoutDirs) {
      const configPath = join(tmpDir, dir, "session.json");
      if (existsSync(configPath)) {
        try {
          const content = await readFile(configPath, "utf-8");
          const config = JSON.parse(content) as SessionConfig;
          sessions.push(config);
        } catch (error) {
          console.warn(`⚠️ Failed to read session config: ${dir}`);
        }
      }
    }

    return sessions.sort(
      (a, b) =>
        new Date(b.last_accessed).getTime() -
        new Date(a.last_accessed).getTime()
    );
  } catch (error) {
    console.error("❌ Failed to list sessions:", error);
    return [];
  }
}

/**
 * Session management utilities
 */
export const SessionManager = {
  create: createSession,
  load: loadSession,
  listActive: listActiveSessions,
  cleanup: cleanupSession,
  getStats: getSessionStats,

  // State management
  saveState,
  loadState,

  // Artifacts
  saveMissionBrief,
  loadMissionBrief,
  saveExecutionJournal,
  saveTestResult,

  // Screenshots
  saveScreenshot,
  getScreenshotPath,
  listScreenshots,

  // Utilities
  getPaths: getSessionPaths,
};
