/* ==========================================================================
   UNIFIED VOGUE — UNIVERSAL REAL-TIME FIREBASE STORE ENGINE
   • Products Catalog Live Sync across ALL customer devices
   • Live Customer Orders & Sales Tracking directly to Admin Dashboard
   • Multi-Cloud Fallback & Redundancy
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
  console.warn("[Unified Vogue] Firebase init notice:", e.message);
}

const CATALOG_REF = "catalog";
const ORDERS_REF = "orders";
const DB_KEY = "uv_vogue_catalog_v15";
const ORDERS_KEY = "uv_orders_history";
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

/* ── Product Helpers ──────────────────────────────────────────────────────── */
function _attachSizeChart(p) {
  return { ...p, sizeChart: OFFICIAL_SIZE_CHART };
}

function _snapshotToProductArray(data) {
  if (!data || typeof data !== "object") return OFFICIAL_CATALOG.map(_attachSizeChart);
  const items = Object.values(data).filter(p => p && p.id).map(_attachSizeChart);
  if (items.length === 0) return OFFICIAL_CATALOG.map(_attachSizeChart);

  return items.sort((a, b) => {
    const aNew = a.id && a.id.length > 6;
    const bNew = b.id && b.id.length > 6;
    if (aNew && !bNew) return -1;
    if (!aNew && bNew) return 1;
    if (aNew && bNew) return b.id.localeCompare(a.id);
    return a.id.localeCompare(b.id);
  });
}

function _cacheProducts(products) {
  if (Array.isArray(products) && products.length > 0) {
    localStorage.setItem(DB_KEY, JSON.stringify(products));
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
   ProductsAPI — Universal Multi-Device Catalog Engine
   ═══════════════════════════════════════════════════════════════════════════ */
class ProductsAPI {

  static getPermanentSizeChart() {
    return OFFICIAL_SIZE_CHART;
  }

  /* ── Read Products (Instant, synchronous, non-empty guaranteed) ─────── */
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

  /* ── Real-Time Live Subscription ─────────────────────────────────────── */
  static subscribeToLiveCatalog(callback) {
    // 1. Initial cached render
    const initial = ProductsAPI.getProducts();
    callback(initial);

    // 2. Listen to Firebase
    if (db) {
      try {
        const catalogRef = db.ref(CATALOG_REF);
        catalogRef.on("value", (snapshot) => {
          const data = snapshot.val();
          if (data && typeof data === "object" && Object.keys(data).length > 0) {
            const products = _snapshotToProductArray(data);
            _cacheProducts(products);
            window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: products }));
            callback(products);
          } else {
            // Seed Firebase if empty
            ProductsAPI.resetCatalog().then(prods => callback(prods));
          }
        }, (err) => {
          console.warn("[Unified Vogue] Firebase catalog stream notice:", err.message);
          callback(ProductsAPI.getProducts());
        });
      } catch (e) {}
    }

    // 3. Fallback Cloud Storage Bin Sync
    fetch(`${CLOUD_BIN_URL}?_t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(raw => {
        const remoteProducts = Array.isArray(raw) ? raw : (raw && raw.data ? (typeof raw.data === 'string' ? JSON.parse(raw.data) : raw.data) : null);
        if (Array.isArray(remoteProducts) && remoteProducts.length > 0) {
          const standardized = _snapshotToProductArray(remoteProducts);
          _cacheProducts(standardized);
          window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: standardized }));
          callback(standardized);
        }
      })
      .catch(() => {});

    return () => {
      if (db) {
        try { db.ref(CATALOG_REF).off("value"); } catch (e) {}
      }
    };
  }

  /* ── ADD PRODUCT (Admin) ─────────────────────────────────────────────── */
  static async addProduct(productData) {
    const id = "uv-" + Date.now();
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
    // 1. Remove from local catalog array immediately
    let products = ProductsAPI.getProducts();
    products = products.filter(p => p.id !== id);
    _cacheProducts(products);
    window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: products }));

    // 2. Sync deletion to Firebase
    if (db) {
      try {
        await db.ref(`${CATALOG_REF}/${id}`).remove();
      } catch (e) {
        console.warn("[Unified Vogue] Firebase delete notice:", e.message);
      }
    }

    // 3. Sync updated catalog array to Cloud Storage Bin
    _pushToCloudBin(products);

    return true;
  }

  /* ── RESET CATALOG to Official 5 Shirts ──────────────────────────────── */
  static async resetCatalog() {
    const obj = {};
    OFFICIAL_CATALOG.forEach(p => { obj[p.id] = _attachSizeChart(p); });

    _cacheProducts(OFFICIAL_CATALOG);
    window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: OFFICIAL_CATALOG }));

    if (db) {
      try {
        await db.ref(CATALOG_REF).set(obj);
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
          const products = _snapshotToProductArray(snap.val());
          _cacheProducts(products);
          window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: products }));
          return products;
        }
      } catch (e) {}
    }

    return ProductsAPI.getProducts();
  }

  /* Legacy stubs for backward compatibility */
  static saveProducts(products) { _cacheProducts(products); }
  static async syncToCloud() { return true; }
}

/* ═══════════════════════════════════════════════════════════════════════════
   OrdersAPI — Universal Live Orders & Sales Tracking Engine
   ═══════════════════════════════════════════════════════════════════════════ */
class OrdersAPI {

  /* ── Get Orders from local storage ───────────────────────────────────── */
  static getOrders() {
    try {
      const stored = localStorage.getItem(ORDERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  }

  static _cacheOrders(orders) {
    if (Array.isArray(orders)) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    }
  }

  /* ── Live Orders Subscription (Admin Dashboard) ─────────────────────── */
  static subscribeToLiveOrders(callback) {
    // 1. Initial cached render
    callback(OrdersAPI.getOrders());

    // 2. Listen to Firebase Realtime Database
    if (db) {
      try {
        const ordersRef = db.ref(ORDERS_REF);
        ordersRef.on("value", (snapshot) => {
          const data = snapshot.val();
          if (data && typeof data === "object") {
            const orders = Object.values(data).sort((a, b) => {
              const dateA = a.timestamp || 0;
              const dateB = b.timestamp || 0;
              return dateB - dateA;
            });
            OrdersAPI._cacheOrders(orders);
            callback(orders);
          } else {
            OrdersAPI._cacheOrders([]);
            callback([]);
          }
        }, (err) => {
          console.warn("[Unified Vogue] Orders live stream notice:", err.message);
          callback(OrdersAPI.getOrders());
        });
      } catch (e) {}
    }

    return () => {
      if (db) {
        try { db.ref(ORDERS_REF).off("value"); } catch (e) {}
      }
    };
  }

  /* ── Create New Order (Checkout) ─────────────────────────────────────── */
  static async createOrder(orderRecord) {
    const fullOrder = {
      timestamp: Date.now(),
      ...orderRecord
    };

    // 1. Update local storage immediately
    const existing = OrdersAPI.getOrders();
    existing.unshift(fullOrder);
    OrdersAPI._cacheOrders(existing);

    // 2. Sync to Firebase
    if (db) {
      try {
        await db.ref(`${ORDERS_REF}/${fullOrder.id}`).set(fullOrder);
      } catch (e) {
        console.warn("[Unified Vogue] Firebase order write notice:", e.message);
      }
    }

    return fullOrder;
  }

  /* ── Update Order Status (Admin) ─────────────────────────────────────── */
  static async updateOrderStatus(orderId, newStatus) {
    const orders = OrdersAPI.getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      orders[idx].status = newStatus;
      OrdersAPI._cacheOrders(orders);
    }

    if (db) {
      try {
        await db.ref(`${ORDERS_REF}/${orderId}`).update({ status: newStatus });
      } catch (e) {}
    }

    return orders;
  }

  /* ── Delete Single Order (Admin) ─────────────────────────────────────── */
  static async deleteOrder(orderId) {
    let orders = OrdersAPI.getOrders();
    orders = orders.filter(o => o.id !== orderId);
    OrdersAPI._cacheOrders(orders);

    if (db) {
      try {
        await db.ref(`${ORDERS_REF}/${orderId}`).remove();
      } catch (e) {}
    }

    return orders;
  }

  /* ── Clear All Orders (Admin) ────────────────────────────────────────── */
  static async clearAllOrders() {
    OrdersAPI._cacheOrders([]);

    if (db) {
      try {
        await db.ref(ORDERS_REF).remove();
      } catch (e) {}
    }

    return [];
  }
}

// Expose globally for all pages
window.ProductsAPI = ProductsAPI;
window.OrdersAPI = OrdersAPI;
window.OFFICIAL_SIZE_CHART = OFFICIAL_SIZE_CHART;
window.OFFICIAL_CATALOG = OFFICIAL_CATALOG;
