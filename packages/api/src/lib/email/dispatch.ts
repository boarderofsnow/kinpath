import { getResend, EMAIL_FROM } from "./client";
import { buildWeeklyDigest, WeeklyDigestData } from "./templates/weekly-digest";

export type { WeeklyDigestData };

export async function sendWeeklyDigest(to: string, data: WeeklyDigestData) {
  return getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: `${data.childName}'s Week ${data.gestationalWeek ?? ""} Update | KinPath`,
    html: buildWeeklyDigest(data),
  });
}
