/* ==========================================================================
   UNIFIED VOGUE — FIREBASE REALTIME DATABASE ENGINE
   Admin publishes a product → instantly visible on EVERY customer device
   Uses Firebase 10 Compat SDK (loaded via CDN script tags in each HTML page)
   ========================================================================== */

/* ── Firebase Initialization ─────────────────────────────────────────────── */
const firebaseConfig = {
  apiKey: "AIzaSyD9VPnej-LZQCOehhugROBfFdjamU6AW7I",
  authDomain: "unifiedvogue-b8a97.firebaseapp.com",
  databaseURL: "https://unifiedvogue-b8a97-default-rtdb.firebaseio.com",
  projectId: "unifiedvogue-b8a97",
  storageBucket: "unifiedvogue-b8a97.firebasestorage.app",
  messagingSenderId: "527897376759",
  appId: "1:527897376759:web:8cf517188d4f9cb612e0f2",
  measurementId: "G-DVE67YHL2X"
};

// Prevent duplicate initialization if script is loaded more than once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const CATALOG_REF = "catalog";

/* ── Permanent Official Size Chart ───────────────────────────────────────── */
const OFFICIAL_SIZE_CHART = {
  unit: "inches",
  measurements: [
    { size: "S",   length: '27"', shoulder: '17"', sleeve: '8"',   chest: '40"' },
    { size: "M",   length: '28"', shoulder: '18"', sleeve: '8.5"', chest: '42"' },
    { size: "L",   length: '29"', shoulder: '19"', sleeve: '9"',   chest: '44"' },
    { size: "XL",  length: '30"', shoulder: '20"', sleeve: '9.5"', chest: '46"' },
    { size: "2XL", length: '31"', shoulder: '21"', sleeve: '10"',  chest: '48"' }
  ]
};

/* ── Official Default Catalog ────────────────────────────────────────────── */
const OFFICIAL_CATALOG = [
  {
    id: "uv-1",
    name: "Knit Shirt \u2014 Black",
    category: "Clothes",
    price: 15000,
    image: "images/shirt-black-knit.jpg",
    badge: "Bestseller",
    rating: 5.0,
    stock: 25,
    sizes: ["S","M","L","XL","2XL"],
    description: "A luxury all-black open-knit shirt featuring a relaxed Cuban camp collar, tonal button closure, and premium textured finish. Lightweight, breathable, and designed for effortless sophistication.",
    sizeChart: OFFICIAL_SIZE_CHART
  },
  {
    id: "uv-2",
    name: "Vintage Shirt \u2014 Abstract Gold & Black Print",
    category: "Clothes",
    price: 10000,
    image: "images/shirt-vintage-print.jpg",
    badge: "New Arrival",
    rating: 4.9,
    stock: 20,
    sizes: ["S","M","L","XL","2XL"],
    description: "A bold, artistic vintage-style short-sleeve shirt with an eye-catching black, white, and gold brushstroke pattern. Crafted from smooth, lightweight fabric for maximum comfort and style.",
    sizeChart: OFFICIAL_SIZE_CHART
  },
  {
    id: "uv-3",
    name: "Knit Shirt \u2014 Chocolate Brown",
    category: "Clothes",
    price: 15000,
    image: "images/shirt-brown-knit.jpg",
    badge: "Hot Deal",
    rating: 5.0,
    stock: 18,
    sizes: ["S","M","L","XL","2XL"],
    description: "Rich chocolate-brown open-knit shirt with classic Cuban lapels and custom pearlized buttons. Warm, elegant, and versatile \u2014 a staple piece for high-fashion casual styling.",
    sizeChart: OFFICIAL_SIZE_CHART
  },
  {
    id: "uv-4",
    name: "Vintage Shirt \u2014 Teal Tribal Swirl",
    category: "Clothes",
    price: 10000,
    image: "images/shirt-teal-print.jpg",
    badge: "New Arrival",
    rating: 4.9,
    stock: 15,
    sizes: ["S","M","L","XL","2XL"],
    description: "Vibrant ocean teal and deep black African-inspired swirl pattern shirt. Features a tailored resort fit that makes a powerful fashion statement wherever you go.",
    sizeChart: OFFICIAL_SIZE_CHART
  },
  {
    id: "uv-5",
    name: "Knit Shirt \u2014 Warm Beige Stripe",
    category: "Clothes",
    price: 15000,
    image: "images/shirt-beige-knit.jpg",
    badge: "Featured",
    rating: 5.0,
    stock: 22,
    sizes: ["S","M","L","XL","2XL"],
    description: "Refined beige open-knit shirt with horizontal micro-stripe texture and short sleeves. Understated luxury that pairs flawlessly with dark trousers or casual wear.",
    sizeChart: OFFICIAL_SIZE_CHART
  }
];

const DB_KEY = "uv_vogue_catalog_v11";

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function _attachSizeChart(p) {
  return { ...p, sizeChart: OFFICIAL_SIZE_CHART };
}

function _snapshotToArray(data) {
  if (!data || typeof data !== "object") return [];
  return Object.values(data)
    .map(_attachSizeChart)
    .sort((a, b) => {
      // New admin-added items (timestamp ids like uv-1723...) appear first
      const aNew = a.id && a.id.length > 6;
      const bNew = b.id && b.id.length > 6;
      if (aNew && !bNew) return -1;
      if (!aNew && bNew) return 1;
      if (aNew && bNew) return b.id.localeCompare(a.id); // newest first
      return a.id.localeCompare(b.id);
    });
}

function _cacheProducts(products) {
  localStorage.setItem(DB_KEY, JSON.stringify(products));
}

/* ═══════════════════════════════════════════════════════════════════════════
   ProductsAPI — the single source of truth for all pages
   ═══════════════════════════════════════════════════════════════════════════ */
class ProductsAPI {

  /* Return the permanent size chart */
  static getPermanentSizeChart() { return OFFICIAL_SIZE_CHART; }

  /* ── Synchronous local cache read (instant, works offline) ────────────── */
  static getProducts() {
    try {
      const stored = localStorage.getItem(DB_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(_attachSizeChart);
        }
      }
    } catch (e) {}
    return OFFICIAL_CATALOG.map(_attachSizeChart);
  }

  static getProductById(id) {
    const p = this.getProducts().find(p => p.id === id);
    return p ? _attachSizeChart(p) : null;
  }

  /* ── LIVE LISTENER: fires immediately + on every remote change ────────── *
   *  Use this on customer pages (index, shop, product).                     *
   *  Returns the Firebase unsubscribe function.                             */
  static subscribeToLiveCatalog(callback) {
    const catalogRef = db.ref(CATALOG_REF);

    catalogRef.on("value", (snapshot) => {
      const data = snapshot.val();

      if (data && Object.keys(data).length > 0) {
        const products = _snapshotToArray(data);
        _cacheProducts(products);
        window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: products }));
        callback(products);
      } else {
        // Firebase is empty — seed it with the official catalog
        ProductsAPI.resetCatalog().then(callback);
      }
    }, (err) => {
      console.warn("[Unified Vogue] Firebase read error:", err.message);
      // Graceful fallback — serve from local cache
      callback(ProductsAPI.getProducts());
    });

    // Return unsubscribe fn
    return () => catalogRef.off("value");
  }

  /* ── ADD PRODUCT ─────────────────────────────────────────────────────── */
  static async addProduct(productData) {
    const id = "uv-" + Date.now();
    const newProd = _attachSizeChart({
      id,
      rating: 5.0,
      stock: 10,
      sizes: ["S","M","L","XL","2XL"],
      ...productData,
    });
    newProd.sizeChart = OFFICIAL_SIZE_CHART; // always enforce

    // Write to Firebase (triggers onValue on ALL connected devices)
    await db.ref(`${CATALOG_REF}/${id}`).set(newProd);

    // Optimistically update local cache
    const products = ProductsAPI.getProducts();
    products.unshift(newProd);
    _cacheProducts(products);

    return newProd;
  }

  /* ── UPDATE PRODUCT ──────────────────────────────────────────────────── */
  static async updateProduct(id, updatedData) {
    const products = ProductsAPI.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const updated = _attachSizeChart({ ...products[idx], ...updatedData });

    await db.ref(`${CATALOG_REF}/${id}`).set(updated);

    products[idx] = updated;
    _cacheProducts(products);
    return updated;
  }

  /* ── DELETE PRODUCT ──────────────────────────────────────────────────── */
  static async deleteProduct(id) {
    try {
      await db.ref(`${CATALOG_REF}/${id}`).remove();
    } catch (e) {
      console.warn("[Unified Vogue] Firebase delete error:", e);
    }

    const products = ProductsAPI.getProducts().filter(p => p.id !== id);
    _cacheProducts(products);
    window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: products }));
    return true;
  }

  /* ── RESET to official 5 shirts ──────────────────────────────────────── */
  static async resetCatalog() {
    const obj = {};
    OFFICIAL_CATALOG.forEach(p => { obj[p.id] = _attachSizeChart(p); });
    await db.ref(CATALOG_REF).set(obj);
    _cacheProducts(OFFICIAL_CATALOG.map(_attachSizeChart));
    window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: OFFICIAL_CATALOG }));
    return OFFICIAL_CATALOG;
  }

  /* ── ONE-TIME FETCH ─────────────────────────────────────────────────── */
  static async fetchRemoteCatalog() {
    try {
      const snapshot = await db.ref(CATALOG_REF).once("value");
      if (snapshot.exists()) {
        const products = _snapshotToArray(snapshot.val());
        _cacheProducts(products);
        window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: products }));
        return products;
      }
      return await ProductsAPI.resetCatalog();
    } catch (e) {
      console.warn("[Unified Vogue] fetchRemoteCatalog error:", e.message);
      return ProductsAPI.getProducts();
    }
  }

  /* Legacy stubs kept for compatibility with older inline scripts */
  static saveProducts(products) { _cacheProducts(products); }
  static async syncToCloud() { return true; }
}

// Expose globally so all inline <script> blocks on every page can use it
window.ProductsAPI  = ProductsAPI;
window.OFFICIAL_SIZE_CHART = OFFICIAL_SIZE_CHART;
window.OFFICIAL_CATALOG    = OFFICIAL_CATALOG;
