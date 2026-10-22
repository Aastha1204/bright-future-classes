/** Seller-side marketing constants for the demo site (not part of the client knowledge base). */
export const PRICE = "₹22,500";

/** Seller contact: the number prospects can call or WhatsApp to buy this service. */
export const CONTACT_PHONE_INTL = "918691969772";
export const CONTACT_PHONE_DISPLAY = "+91 86919 69772";

export const CALL_URL = `tel:+${CONTACT_PHONE_INTL}`;

export function whatsappUrl(text = "Hi, I saw the AI chatbot demo (Bright Future Classes) and want it for my business."): string {
  return `https://wa.me/${CONTACT_PHONE_INTL}?text=${encodeURIComponent(text)}`;
}
