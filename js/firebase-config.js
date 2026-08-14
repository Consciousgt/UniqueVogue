/* ==========================================================================
   UNIFIED VOGUE — UNIVERSAL REAL-TIME CATALOG ENGINE
   Supports: Admin Instant Product Publishing, Live Editing, & Full Product Deletion
   Multi-Cloud Redundant Sync: Firebase Realtime Database + High-Speed Cloud Storage + Local Storage
   ========================================================================== */

/* ── Firebase Configuration ─────────────────────────────────────────────── */
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

let db = null;
try {
  if (typeof firebase !== "undefined") {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.database();
  }
} catch (e) {
  console.warn("[Unified Vogue] Firebase init note:", e.message);
}

const CATALOG_REF = "catalog";
const DELETED_REF = "deleted_ids";
const DB_KEY = "uv_vogue_catalog_v14";
const DELETED_KEY = "uv_vogue_deleted_v14";
const CLOUD_BIN_URL = "https://extendsclass.com/api/json-storage/bin/acfdddb";

/* ── Permanent Official Standard Size Chart (Inches) ─────────────────────── */
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
    name: "Knit Shirt — Black",
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
    name: "Vintage Shirt — Abstract Gold & Black Print",
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
    name: "Knit Shirt — Chocolate Brown",
    category: "Clothes",
    price: 15000,
    image: "images/shirt-brown-knit.jpg",
    badge: "Hot Deal",
    rating: 5.0,
    stock: 18,
    sizes: ["S","M","L","XL","2XL"],
    description: "Rich chocolate-brown open-knit shirt with classic Cuban lapels and custom pearlized buttons. Warm, elegant, and versatile — a staple piece for high-fashion casual styling.",
    sizeChart: OFFICIAL_SIZE_CHART
  },
  {
    id: "uv-4",
    name: "Vintage Shirt — Teal Tribal Swirl",
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
    name: "Knit Shirt — Warm Beige Stripe",
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

/* ── Internal Helpers ─────────────────────────────────────────────────────── */
function _attachSizeChart(p) {
  return { ...p, sizeChart: OFFICIAL_SIZE_CHART };
}

function _getDeletedIds() {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function _markDeletedId(id) {
  try {
    const list = _getDeletedIds();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(DELETED_KEY, JSON.stringify(list));
    }
  } catch (e) {}
}

function _unmarkDeletedId(id) {
  try {
    let list = _getDeletedIds();
    list = list.filter(item => item !== id);
    localStorage.setItem(DELETED_KEY, JSON.stringify(list));
  } catch (e) {}
}

function _filterDeleted(products) {
  if (!Array.isArray(products)) return [];
  const deleted = _getDeletedIds();
  return products.filter(p => p && p.id && !deleted.includes(p.id));
}

function _snapshotToArray(data) {
  if (!data || typeof data !== "object") return [];
  const items = Object.values(data).map(_attachSizeChart);
  const filtered = _filterDeleted(items);
  if (filtered.length === 0) {
    return OFFICIAL_CATALOG.map(_attachSizeChart);
  }
  return filtered.sort((a, b) => {
    const aNew = a.id && a.id.length > 6;
    const bNew = b.id && b.id.length > 6;
    if (aNew && !bNew) return -1;
    if (!aNew && bNew) return 1;
    if (aNew && bNew) return b.id.localeCompare(a.id);
    return a.id.localeCompare(b.id);
  });
}

function _cacheProducts(products) {
  const filtered = _filterDeleted(products);
  if (filtered.length > 0) {
    localStorage.setItem(DB_KEY, JSON.stringify(filtered));
  }
}

async function _pushToCloudBin(products) {
  try {
    await fetch(CLOUD_BIN_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(products)
    });
  } catch (e) {}
}

/* ═══════════════════════════════════════════════════════════════════════════
   ProductsAPI — Universal Multi-Cloud Synchronized Store Engine
   ═══════════════════════════════════════════════════════════════════════════ */
class ProductsAPI {

  static getPermanentSizeChart() {
    return OFFICIAL_SIZE_CHART;
  }

  /* ── Read Products (Guaranteed to return products, instant, filters deleted) ── */
  static getProducts() {
    try {
      const stored = localStorage.getItem(DB_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = _filterDeleted(parsed);
          if (filtered.length > 0) {
            return filtered.map(_attachSizeChart);
          }
        }
      }
    } catch (e) {}

    const defaultFiltered = _filterDeleted(OFFICIAL_CATALOG);
    if (defaultFiltered.length > 0) {
      return defaultFiltered.map(_attachSizeChart);
    }
    return OFFICIAL_CATALOG.map(_attachSizeChart);
  }

  static getProductById(id) {
    const deleted = _getDeletedIds();
    if (deleted.includes(id)) return null;
    const p = this.getProducts().find(p => p.id === id);
    return p ? _attachSizeChart(p) : null;
  }

  /* ── Real-Time Live Subscription ─────────────────────────────────────── */
  static subscribeToLiveCatalog(callback) {
    // 1. Send initial data immediately
    const initial = ProductsAPI.getProducts();
    callback(initial);

    // 2. Listen to Firebase Realtime Database
    if (db) {
      try {
        const catalogRef = db.ref(CATALOG_REF);
        catalogRef.on("value", (snapshot) => {
          const data = snapshot.val();
          if (data && typeof data === "object" && Object.keys(data).length > 0) {
            const products = _snapshotToArray(data);
            if (products.length > 0) {
              _cacheProducts(products);
              window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: products }));
              callback(products);
            }
          } else {
            // Seed Firebase if empty
            ProductsAPI.resetCatalog().then(prods => callback(prods));
          }
        }, (err) => {
          console.warn("[Unified Vogue] Firebase stream notice:", err.message);
          callback(ProductsAPI.getProducts());
        });

        // Sync deleted IDs from Firebase
        db.ref(DELETED_REF).on("value", (snap) => {
          const deletedMap = snap.val();
          if (deletedMap && typeof deletedMap === "object") {
            Object.keys(deletedMap).forEach(delId => _markDeletedId(delId));
            const fresh = ProductsAPI.getProducts();
            _cacheProducts(fresh);
            callback(fresh);
          }
        });
      } catch (e) {}
    }

    // 3. Background Cloud Storage Bin Sync
    fetch(`${CLOUD_BIN_URL}?_t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(raw => {
        const remoteProducts = Array.isArray(raw) ? raw : (raw && raw.data ? (typeof raw.data === 'string' ? JSON.parse(raw.data) : raw.data) : null);
        if (Array.isArray(remoteProducts) && remoteProducts.length > 0) {
          const standardized = _snapshotToArray(remoteProducts);
          if (standardized.length > 0) {
            _cacheProducts(standardized);
            window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: standardized }));
            callback(standardized);
          }
        }
      })
      .catch(() => {});

    return () => {
      if (db) {
        try {
          db.ref(CATALOG_REF).off("value");
          db.ref(DELETED_REF).off("value");
        } catch (e) {}
      }
    };
  }

  /* ── ADD PRODUCT (Admin) ─────────────────────────────────────────────── */
  static async addProduct(productData) {
    const id = "uv-" + Date.now();
    _unmarkDeletedId(id);

    const newProd = _attachSizeChart({
      id,
      rating: 5.0,
      stock: Number(productData.stock) || 10,
      sizes: productData.sizes && productData.sizes.length > 0 ? productData.sizes : ["S","M","L","XL","2XL"],
      ...productData
    });
    newProd.sizeChart = OFFICIAL_SIZE_CHART;

    // 1. Update local cache immediately
    const products = ProductsAPI.getProducts();
    products.unshift(newProd);
    _cacheProducts(products);
    window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: products }));

    // 2. Sync to Firebase
    if (db) {
      try {
        await db.ref(`${CATALOG_REF}/${id}`).set(newProd);
      } catch (e) {
        console.warn("[Unified Vogue] Firebase write notice:", e.message);
      }
    }

    // 3. Sync to Cloud Storage Bin
    _pushToCloudBin(products);

    return newProd;
  }

  /* ── UPDATE PRODUCT (Admin Edit / Restock / Price) ────────────────────── */
  static async updateProduct(id, updatedData) {
    const products = ProductsAPI.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const updated = _attachSizeChart({ ...products[idx], ...updatedData });
    products[idx] = updated;
    _cacheProducts(products);
    window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: products }));

    // Sync to Firebase
    if (db) {
      try {
        await db.ref(`${CATALOG_REF}/${id}`).set(updated);
      } catch (e) {}
    }

    // Sync to Cloud Storage Bin
    _pushToCloudBin(products);

    return updated;
  }

  /* ── DELETE PRODUCT (Admin Delete Sold Out / Unavailable Items) ───────── */
  static async deleteProduct(id) {
    // 1. Permanently blacklist ID
    _markDeletedId(id);

    // 2. Remove from local catalog array immediately
    let products = ProductsAPI.getProducts();
    products = products.filter(p => p.id !== id);
    _cacheProducts(products);
    window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: products }));

    // 3. Sync deletion to Firebase
    if (db) {
      try {
        await db.ref(`${CATALOG_REF}/${id}`).remove();
        await db.ref(`${DELETED_REF}/${id}`).set(true);
      } catch (e) {
        console.warn("[Unified Vogue] Firebase delete notice:", e.message);
      }
    }

    // 4. Sync updated catalog array to Cloud Storage Bin
    _pushToCloudBin(products);

    return true;
  }

  /* ── RESET CATALOG to Official 5 Shirts ──────────────────────────────── */
  static async resetCatalog() {
    localStorage.removeItem(DELETED_KEY);
    const obj = {};
    OFFICIAL_CATALOG.forEach(p => { obj[p.id] = _attachSizeChart(p); });

    _cacheProducts(OFFICIAL_CATALOG);
    window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: OFFICIAL_CATALOG }));

    if (db) {
      try {
        await db.ref(CATALOG_REF).set(obj);
        await db.ref(DELETED_REF).remove();
      } catch (e) {}
    }

    _pushToCloudBin(OFFICIAL_CATALOG);
    return OFFICIAL_CATALOG;
  }

  /* ── ONE-TIME FETCH ─────────────────────────────────────────────────── */
  static async fetchRemoteCatalog() {
    if (db) {
      try {
        const snap = await db.ref(CATALOG_REF).once("value");
        if (snap.exists()) {
          const products = _snapshotToArray(snap.val());
          if (products.length > 0) {
            _cacheProducts(products);
            window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: products }));
            return products;
          }
        }
      } catch (e) {}
    }

    try {
      const res = await fetch(`${CLOUD_BIN_URL}?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const raw = await res.json();
        const remoteProducts = Array.isArray(raw) ? raw : (raw && raw.data ? (typeof raw.data === 'string' ? JSON.parse(raw.data) : raw.data) : null);
        if (Array.isArray(remoteProducts) && remoteProducts.length > 0) {
          const standardized = _snapshotToArray(remoteProducts);
          if (standardized.length > 0) {
            _cacheProducts(standardized);
            window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: standardized }));
            return standardized;
          }
        }
      }
    } catch (e) {}

    return ProductsAPI.getProducts();
  }

  /* Legacy stubs for backward compatibility */
  static saveProducts(products) { _cacheProducts(products); }
  static async syncToCloud() { return true; }
}

// Expose globally for all pages
window.ProductsAPI = ProductsAPI;
window.OFFICIAL_SIZE_CHART = OFFICIAL_SIZE_CHART;
window.OFFICIAL_CATALOG = OFFICIAL_CATALOG;
