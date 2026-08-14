/* ==========================================================================
   UNIFIED VOGUE — MULTI-DEVICE COMPATIBILITY PROXY
   Redirects all calls to window.ProductsAPI in firebase-config.js
   ========================================================================== */

if (typeof window !== "undefined" && window.ProductsAPI) {
  // ProductsAPI already initialized via firebase-config.js
}
