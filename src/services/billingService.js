import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import paymentService from './paymentService.js';

// Must match the one-time product created in Play Console (Monetize > Products)
export const PASS_PRODUCT_ID = 'hoshiyaar_pass_6m';
// One Gita chapter: a second one-time product, bought once per chapter (Play only knows "one Gita chapter";
// the app tells the server which chapter it was for)
export const GITA_PRODUCT_ID = 'hoshiyaar_gita_chapter';
// The chapter being bought, kept until the server has it, so a purchase recovered later still unlocks that chapter
const PENDING_CHAPTER = 'hy_gita_buying_chapter';
const pendingChapter = () => { try { return localStorage.getItem(PENDING_CHAPTER) || ''; } catch (_) { return ''; } };
const setPendingChapter = (id) => { try { if (id) localStorage.setItem(PENDING_CHAPTER, id); else localStorage.removeItem(PENDING_CHAPTER); } catch (_) {} };
const PRODUCT_IDS = [PASS_PRODUCT_ID, GITA_PRODUCT_ID];
const isGita = (productId) => productId === GITA_PRODUCT_ID;

const isNativeAndroid = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

// Dev builds only: open the site with ?billing=play to see the Android (Google Play) paywall
// in a browser, ?billing=web to switch back. Remembered for the tab; ignored in production.
const PREVIEW_KEY = 'hy_billing_preview';
const playPreview = () => {
  if (!import.meta.env.DEV || isNativeAndroid()) return false;
  try {
    const param = new URLSearchParams(window.location.search).get('billing');
    if (param === 'play') sessionStorage.setItem(PREVIEW_KEY, 'play');
    if (param === 'web') sessionStorage.removeItem(PREVIEW_KEY);
    return sessionStorage.getItem(PREVIEW_KEY) === 'play';
  } catch (_) {
    return false;
  }
};

// The Android app sells through Google Play Billing; the website uses Razorpay
export const usesPlayBilling = () => isNativeAndroid() || playPreview();

// Live updates can bring this code to an older Android build that has no billing plugin.
// Such builds must be updated from Play; they may not fall back to Razorpay inside the app.
export const playBillingAvailable = () =>
  playPreview() || (isNativeAndroid() && Capacitor.isPluginAvailable('NativePurchases'));

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.hoshiyaarlearning.app';

/**
 * Every price option Google Play returns for the pass (one per purchase option / offer),
 * as { label: "₹99", price: 99, currency, purchaseOptionId, offerId, offerToken }.
 * Empty if the store is unavailable.
 */
export async function getPassOffers(productId = PASS_PRODUCT_ID) {
  if (!isNativeAndroid()) return [];
  try {
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: [productId],
      productType: PURCHASE_TYPE.INAPP
    });
    return (products || [])
      .filter((p) => p?.identifier === productId || !p?.identifier)
      .map((p) => ({
        // Play sends a localised string such as "₹99.00"; whole rupees read better without the paise
        label: String(p.priceString || '').replace(/[.,]00$/, ''),
        price: Number(p.price),
        currency: p.currencyCode || '',
        purchaseOptionId: p.purchaseOptionId || '',
        offerId: p.offerId || '',
        offerToken: p.offerToken || ''
      }));
  } catch (_) {
    return [];
  }
}

/** The option to sell: the one priced like our own plan if Google has it, else Play's first */
export const pickPassOffer = (offers, planAmount) =>
  offers.find((o) => o.price === Number(planAmount)) || offers[0] || null;

// The server verifies with Google and consumes; if it could not consume, the app does it
// so the pass can be bought again after 6 months
async function verifyWithServer(purchaseToken, productId = PASS_PRODUCT_ID, chapterId = '') {
  const gitaChapter = isGita(productId) ? (chapterId || pendingChapter()) : '';
  const result = await paymentService.verifyGooglePurchase({ purchaseToken, productId, ...(gitaChapter ? { chapterId: gitaChapter } : {}) });
  if (result.success && isGita(productId)) setPendingChapter('');
  if (result.success && result.consumed === false) {
    try { await NativePurchases.consumePurchase({ purchaseToken }); } catch (_) {}
  }
  return result;
}

/**
 * Opens the Google Play purchase sheet for the 6-month pass, or one Gita chapter (productId GITA_PRODUCT_ID + chapterId).
 * Resolves { status: 'success' | 'pending' | 'cancelled' | 'error', message }
 */
export async function buyPassWithPlay(userId, { offerToken = '', onProcessing, productId = PASS_PRODUCT_ID, chapterId = '' } = {}) {
  const passName = isGita(productId) ? 'chapter' : 'pass';
  if (isGita(productId)) setPendingChapter(chapterId);
  if (!isNativeAndroid()) {
    return { status: 'pending', message: 'Preview only: in the Android app this opens the Google Play payment sheet.' };
  }
  let transaction;
  try {
    transaction = await NativePurchases.purchaseProduct({
      productIdentifier: productId,
      productType: PURCHASE_TYPE.INAPP,
      // The exact Play option shown in the pop-up, so the learner pays the price they saw
      ...(offerToken ? { offerToken } : {}),
      // Becomes obfuscatedAccountId, which the server checks so a token cannot move between accounts
      appAccountToken: String(userId),
      isConsumable: false,
      autoAcknowledgePurchases: false
    });
  } catch (err) {
    const code = String(err?.code || '');
    const msg = String(err?.message || err || '');
    if (code === 'USER_CANCELED' || /cancel/i.test(msg)) return { status: 'cancelled' };
    // Paid earlier but never verified (e.g. the app closed): hand that purchase to the server now
    if (code === 'ITEM_ALREADY_OWNED') {
      return (await recoverPlayPurchases())
        ? { status: 'success', message: isGita(productId) ? 'Chapter unlocked. Enjoy every shloka!' : 'Your 6-month pass is active. Enjoy every lesson!' }
        : { status: 'pending', message: 'We found an earlier payment and are confirming it. Please reopen the app in a minute.' };
    }
    if (/pending/i.test(msg)) {
      return { status: 'pending', message: `Payment is pending. ${isGita(productId) ? 'The chapter' : 'The pass'} unlocks as soon as it completes.` };
    }
    return { status: 'error', message: msg || 'Google Play could not start the purchase.' };
  }

  // purchaseProduct only resolves for completed purchases; pending ones reject above
  if (!transaction?.purchaseToken) {
    return { status: 'error', message: 'Google Play did not return a purchase.' };
  }

  // Paid in the Play sheet; the server now confirms it with Google
  onProcessing?.();
  try {
    const result = await verifyWithServer(transaction.purchaseToken, productId, chapterId);
    if (result.success) return { status: 'success', message: result.message };
    if (result.pending) return { status: 'pending', message: result.message };
    return { status: 'error', message: result.message || 'We could not confirm the purchase.' };
  } catch (_) {
    // Payment went through but our server was unreachable; recoverPlayPurchases retries on next launch
    return { status: 'pending', message: `Payment received. Your ${passName} will unlock in a moment, keep the app open or reopen it.` };
  }
}

/**
 * Sends any purchase Play still holds (unconsumed) to the server. Covers an app that
 * closed between paying and verifying, and purchases that were pending. Safe to repeat.
 */
export async function recoverPlayPurchases() {
  if (!isNativeAndroid()) return false;
  try {
    const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP });
    let granted = false;
    for (const p of purchases || []) {
      // Science Pro and Gita chapters both (a Gita one goes to the chapter that was being bought)
      if (!PRODUCT_IDS.includes(p.productIdentifier) || !p.purchaseToken) continue;
      const result = await verifyWithServer(p.purchaseToken, p.productIdentifier).catch(() => null);
      if (result?.success) granted = true;
    }
    return granted;
  } catch (_) {
    return false;
  }
}
