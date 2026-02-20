import type { DoctorDiscussionItem } from "../types/doctor";

const PRIORITY_ORDER = { high: 0, normal: 1, low: 2 } as const;

export function groupDoctorItems(items: DoctorDiscussionItem[]) {
  const toDiscuss: DoctorDiscussionItem[] = [];
  const discussed: DoctorDiscussionItem[] = [];

  for (const item of items) {
    if (item.is_discussed) {
      discussed.push(item);
    } else {
      toDiscuss.push(item);
    }
  }

  toDiscuss.sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  );
  discussed.sort(
    (a, b) =>
      new Date(b.discussed_at ?? b.updated_at).getTime() -
      new Date(a.discussed_at ?? a.updated_at).getTime()
  );

  return { toDiscuss, discussed };
}
