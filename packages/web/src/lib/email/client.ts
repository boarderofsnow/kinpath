import { Resend } from "resend";

// Will be configured with RESEND_API_KEY env var
export const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_FROM = "KinPath <hello@kinpath.com>";
