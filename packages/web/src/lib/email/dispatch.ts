import { getResend, EMAIL_FROM } from "./client";
import { buildWeeklyDigest, WeeklyDigestData } from "./templates/weekly-digest";
import { buildMilestoneAlert, MilestoneAlertData } from "./templates/milestone-alert";

export async function sendWeeklyDigest(to: string, data: WeeklyDigestData) {
  return getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: `${data.childName}'s Week ${data.gestationalWeek ?? ""} Update — KinPath`,
    html: buildWeeklyDigest(data),
  });
}

export async function sendMilestoneAlert(to: string, data: MilestoneAlertData) {
  return getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Milestone: ${data.milestoneName} — ${data.childName}`,
    html: buildMilestoneAlert(data),
  });
}
