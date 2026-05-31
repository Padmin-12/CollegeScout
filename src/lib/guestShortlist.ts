/**
 * Guest shortlist — persists in localStorage so the founder can demo all
 * shortlist features without needing a login / database session.
 */

const KEY = "guest_shortlist";

export type GuestEntry = { collegeId: string };

export function getGuestShortlist(): GuestEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as GuestEntry[];
  } catch {
    return [];
  }
}

export function addToGuestShortlist(collegeId: string): void {
  const list = getGuestShortlist();
  if (!list.some((e) => e.collegeId === collegeId)) {
    list.push({ collegeId });
    localStorage.setItem(KEY, JSON.stringify(list));
  }
}

export function removeFromGuestShortlist(collegeId: string): void {
  const list = getGuestShortlist().filter((e) => e.collegeId !== collegeId);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function isInGuestShortlist(collegeId: string): boolean {
  return getGuestShortlist().some((e) => e.collegeId === collegeId);
}

/** Emit a custom event so all components stay in sync */
export function dispatchShortlistChange() {
  window.dispatchEvent(new Event("guest-shortlist-change"));
}
