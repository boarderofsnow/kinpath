import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOfferings,
} from "react-native-purchases";

// ─── Constants ──────────────────────────────────────────────────────────────

// Use separate keys per platform in production:
//   iOS:     appl_XXXX   →  EXPO_PUBLIC_RC_API_KEY_IOS
//   Android: goog_XXXX   →  EXPO_PUBLIC_RC_API_KEY_ANDROID
const RC_API_KEY =
  process.env.EXPO_PUBLIC_RC_API_KEY ?? "test_MvBNKSLsRrkMHFMxlxyaeJeyDVV";

export const ENTITLEMENT_ID = "Kinpath Pro";

// ─── Initialization ─────────────────────────────────────────────────────────

/**
 * Call once at app start (before the user is known).
 * User identification is deferred to `identifyUser()` after sign-in.
 */
export function configureRevenueCat(): void {
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }
  Purchases.configure({ apiKey: RC_API_KEY });
}

// ─── User Identity ───────────────────────────────────────────────────────────

/**
 * Call after the user signs in. Associates RevenueCat purchases with the
 * Supabase user ID so cross-platform entitlements are unified.
 */
export async function identifyUser(userId: string): Promise<CustomerInfo | null> {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    return customerInfo;
  } catch (error) {
    console.error("[RevenueCat] identifyUser failed:", error);
    return null;
  }
}

/**
 * Call on sign-out. Reverts RevenueCat to an anonymous user ID so the next
 * sign-in gets a clean slate.
 */
export async function resetUser(): Promise<void> {
  try {
    await Purchases.logOut();
  } catch (error) {
    // logOut throws if the user is already anonymous — safe to ignore.
    console.warn("[RevenueCat] resetUser:", error);
  }
}

// ─── Customer Info & Entitlements ────────────────────────────────────────────

/** Fetch the latest CustomerInfo from RevenueCat. */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error("[RevenueCat] getCustomerInfo failed:", error);
    return null;
  }
}

/**
 * Returns true when the user has an active entitlement for `entitlementId`.
 * Defaults to the "Kinpath Pro" entitlement.
 */
export async function checkEntitlement(
  entitlementId: string = ENTITLEMENT_ID
): Promise<boolean> {
  const info = await getCustomerInfo();
  if (!info) return false;
  return entitlementId in info.entitlements.active;
}

// ─── Offerings ───────────────────────────────────────────────────────────────

/**
 * Fetches the current RevenueCat offerings.
 * The default offering should contain "monthly" and "yearly" packages.
 */
export async function getOfferings(): Promise<PurchasesOfferings | null> {
  try {
    return await Purchases.getOfferings();
  } catch (error) {
    console.error("[RevenueCat] getOfferings failed:", error);
    return null;
  }
}
