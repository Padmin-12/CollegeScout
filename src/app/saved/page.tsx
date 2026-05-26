import { redirect } from "next/navigation";

/** Saved colleges merged into session shortlist — redirect for old links */
export default function SavedRedirectPage() {
  redirect("/shortlist");
}
