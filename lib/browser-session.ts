/**
 * Simple browser session coordination between agents
 */

let currentPageIndex = 0;
let sessionActive = false;

export function getSessionState() {
  return {
    currentPageIndex,
    sessionActive,
  };
}

export function setCurrentPage(pageIndex: number) {
  currentPageIndex = pageIndex;
  sessionActive = true;
}

export function isSessionActive(): boolean {
  return sessionActive;
}

export function resetSession() {
  currentPageIndex = 0;
  sessionActive = false;
}
