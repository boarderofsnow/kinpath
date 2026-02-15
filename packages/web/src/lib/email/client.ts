import { Resend } from "resend";

// Lazy-initialised so the build doesn't throw when the key is missing
let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export const EMAIL_FROM = "KinPath <hello@kinpath.com>";
