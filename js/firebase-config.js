/* ==========================================================================
   UNIFIED VOGUE — UNIVERSAL REAL-TIME FIREBASE STORE ENGINE (V16 MULTI-CHANNEL)
   • Products Catalog Live Sync across ALL customer devices
   • Live Customer Orders & Sales Tracking directly to Admin Dashboard
   • Triple-Channel Redundancy (WebSocket + HTTPS REST + Local Storage)
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
function _getDb() {
  if (db) return db;
  try {
    if (typeof firebase !== "undefined") {
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.database();
    }
  } catch (e) {
    console.warn("[Unified Vogue] Firebase init notice:", e.message);
  }
  return db;
}
_getDb();

const CATALOG_REF = "catalog";
const ORDERS_REF = "orders";
const DB_KEY = "uv_vogue_catalog_v16";
const ORDERS_KEY = "uv_orders_history";
const FIREBASE_REST_BASE = "https://unifiedvogue-b8a97-default-rtdb.firebaseio.com";
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
  if (!p) return null;
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
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(products));
    } catch (e) {}
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
    if (!id) return null;
    const p = this.getProducts().find(p => p && p.id === id);
    return p ? _attachSizeChart(p) : null;
  }

  /* ── Real-Time Live Subscription ─────────────────────────────────────── */
  static subscribeToLiveCatalog(callback) {
    // 1. Initial cached render
    const initial = ProductsAPI.getProducts();
    if (typeof callback === "function") callback(initial);

    const activeDb = _getDb();

    // 2. Channel A: Direct Firebase WebSocket Stream
    if (activeDb) {
      try {
        const catalogRef = activeDb.ref(CATALOG_REF);
        catalogRef.on("value", (snapshot) => {
          const data = snapshot.val();
          if (data && typeof data === "object" && Object.keys(data).length > 0) {
            const products = _snapshotToProductArray(data);
            _cacheProducts(products);
            window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: products }));
            if (typeof callback === "function") callback(products);
          }
        }, (err) => {
          console.warn("[Unified Vogue] Firebase catalog stream notice:", err.message);
        });
      } catch (e) {}
    }

    // 3. Channel B: Direct HTTPS REST Fetch (Zero WebSocket dependency)
    fetch(`${FIREBASE_REST_BASE}/catalog.json?_t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === "object" && Object.keys(data).length > 0) {
          const products = _snapshotToProductArray(data);
          _cacheProducts(products);
          window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: products }));
          if (typeof callback === "function") callback(products);
        }
      })
      .catch(() => {});

    // 4. Channel C: Fallback Cloud Storage Bin Sync
    fetch(`${CLOUD_BIN_URL}?_t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(raw => {
        const remoteProducts = Array.isArray(raw) ? raw : (raw && raw.data ? (typeof raw.data === 'string' ? JSON.parse(raw.data) : raw.data) : null);
        if (Array.isArray(remoteProducts) && remoteProducts.length > 0) {
          const standardized = _snapshotToProductArray(remoteProducts);
          _cacheProducts(standardized);
          window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: standardized }));
          if (typeof callback === "function") callback(standardized);
        }
      })
      .catch(() => {});

    return () => {
      const dbInstance = _getDb();
      if (dbInstance) {
        try { dbInstance.ref(CATALOG_REF).off("value"); } catch (e) {}
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

    // 2. Channel A: Firebase WebSocket
    const activeDb = _getDb();
    if (activeDb) {
      try {
        await activeDb.ref(`${CATALOG_REF}/${id}`).set(newProd);
      } catch (e) {
        console.warn("[Unified Vogue] Firebase write notice:", e.message);
      }
    }

    // 3. Channel B: Direct HTTPS REST PUT
    try {
      await fetch(`${FIREBASE_REST_BASE}/catalog/${id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd)
      });
    } catch (e) {}

    // 4. Channel C: Cloud Storage Bin
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

    // Firebase WebSocket
    const activeDb = _getDb();
    if (activeDb) {
      try {
        await activeDb.ref(`${CATALOG_REF}/${id}`).set(updated);
      } catch (e) {}
    }

    // Firebase REST
    try {
      await fetch(`${FIREBASE_REST_BASE}/catalog/${id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) {}

    _pushToCloudBin(products);
    return updated;
  }

  /* ── DELETE PRODUCT (Admin Delete Sold Out / Unavailable Items) ───────── */
  static async deleteProduct(id) {
    let products = ProductsAPI.getProducts();
    products = products.filter(p => p.id !== id);
    _cacheProducts(products);
    window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: products }));

    const activeDb = _getDb();
    if (activeDb) {
      try {
        await activeDb.ref(`${CATALOG_REF}/${id}`).remove();
      } catch (e) {}
    }

    try {
      await fetch(`${FIREBASE_REST_BASE}/catalog/${id}.json`, { method: 'DELETE' });
    } catch (e) {}

    _pushToCloudBin(products);
    return true;
  }

  /* ── RESET CATALOG to Official 5 Shirts ──────────────────────────────── */
  static async resetCatalog() {
    const obj = {};
    OFFICIAL_CATALOG.forEach(p => { obj[p.id] = _attachSizeChart(p); });

    _cacheProducts(OFFICIAL_CATALOG);
    window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: OFFICIAL_CATALOG }));

    const activeDb = _getDb();
    if (activeDb) {
      try {
        await activeDb.ref(CATALOG_REF).set(obj);
      } catch (e) {}
    }

    try {
      await fetch(`${FIREBASE_REST_BASE}/catalog.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
      });
    } catch (e) {}

    _pushToCloudBin(OFFICIAL_CATALOG);
    return OFFICIAL_CATALOG;
  }

  /* ── ONE-TIME FETCH ─────────────────────────────────────────────────── */
  static async fetchRemoteCatalog() {
    try {
      const res = await fetch(`${FIREBASE_REST_BASE}/catalog.json?_t=${Date.now()}`);
      const data = await res.json();
      if (data && typeof data === "object" && Object.keys(data).length > 0) {
        const products = _snapshotToProductArray(data);
        _cacheProducts(products);
        window.dispatchEvent(new CustomEvent("uv_catalog_synced", { detail: products }));
        return products;
      }
    } catch (e) {}

    return ProductsAPI.getProducts();
  }

  static saveProducts(products) { _cacheProducts(products); }
  static async syncToCloud() { return true; }
}

/* ═══════════════════════════════════════════════════════════════════════════
   OrdersAPI — Universal Live Orders & Sales Tracking Engine
   ═══════════════════════════════════════════════════════════════════════════ */
class OrdersAPI {

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
      try {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      } catch (e) {}
    }
  }

  /* ── Live Orders Subscription (Admin Dashboard) ─────────────────────── */
  static subscribeToLiveOrders(callback) {
    if (typeof callback === "function") callback(OrdersAPI.getOrders());

    const activeDb = _getDb();

    // 1. Channel A: Firebase WebSocket
    if (activeDb) {
      try {
        const ordersRef = activeDb.ref(ORDERS_REF);
        ordersRef.on("value", (snapshot) => {
          const data = snapshot.val();
          if (data && typeof data === "object") {
            const orders = Object.values(data).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            OrdersAPI._cacheOrders(orders);
            if (typeof callback === "function") callback(orders);
          } else {
            OrdersAPI._cacheOrders([]);
            if (typeof callback === "function") callback([]);
          }
        }, (err) => {
          console.warn("[Unified Vogue] Orders live stream notice:", err.message);
        });
      } catch (e) {}
    }

    // 2. Channel B: HTTPS REST Fetch
    fetch(`${FIREBASE_REST_BASE}/orders.json?_t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === "object") {
          const orders = Object.values(data).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          OrdersAPI._cacheOrders(orders);
          if (typeof callback === "function") callback(orders);
        }
      })
      .catch(() => {});

    return () => {
      const dbInstance = _getDb();
      if (dbInstance) {
        try { dbInstance.ref(ORDERS_REF).off("value"); } catch (e) {}
      }
    };
  }

  /* ── Live Single Order Subscription (Customer Order Tracking) ───────── */
  static subscribeToSingleOrder(orderId, callback) {
    if (!orderId) return () => {};

    const cached = OrdersAPI.getOrders().find(o => o.id === orderId);
    if (cached && typeof callback === "function") callback(cached);

    const activeDb = _getDb();

    // Channel A: WebSocket
    if (activeDb) {
      try {
        const orderRef = activeDb.ref(`${ORDERS_REF}/${orderId}`);
        orderRef.on("value", (snap) => {
          const order = snap.val();
          if (order && typeof callback === "function") callback(order);
        });
      } catch (e) {}
    }

    // Channel B: REST Fetch
    fetch(`${FIREBASE_REST_BASE}/orders/${orderId}.json?_t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(order => {
        if (order && typeof callback === "function") callback(order);
      })
      .catch(() => {});

    return () => {
      const dbInstance = _getDb();
      if (dbInstance) {
        try { dbInstance.ref(`${ORDERS_REF}/${orderId}`).off("value"); } catch (e) {}
      }
    };
  }

  /* ── Create New Order (Checkout) ─────────────────────────────────────── */
  static async createOrder(orderRecord) {
    const fullOrder = {
      timestamp: Date.now(),
      ...orderRecord
    };

    const existing = OrdersAPI.getOrders();
    existing.unshift(fullOrder);
    OrdersAPI._cacheOrders(existing);

    // Channel A: WebSocket
    const activeDb = _getDb();
    if (activeDb) {
      try {
        await activeDb.ref(`${ORDERS_REF}/${fullOrder.id}`).set(fullOrder);
      } catch (e) {}
    }

    // Channel B: REST PUT
    try {
      await fetch(`${FIREBASE_REST_BASE}/orders/${fullOrder.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullOrder)
      });
    } catch (e) {}

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

    const activeDb = _getDb();
    if (activeDb) {
      try {
        await activeDb.ref(`${ORDERS_REF}/${orderId}`).update({ status: newStatus });
      } catch (e) {}
    }

    try {
      await fetch(`${FIREBASE_REST_BASE}/orders/${orderId}/status.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStatus)
      });
    } catch (e) {}

    return orders;
  }

  /* ── Delete Single Order (Admin) ─────────────────────────────────────── */
  static async deleteOrder(orderId) {
    let orders = OrdersAPI.getOrders();
    orders = orders.filter(o => o.id !== orderId);
    OrdersAPI._cacheOrders(orders);

    const activeDb = _getDb();
    if (activeDb) {
      try {
        await activeDb.ref(`${ORDERS_REF}/${orderId}`).remove();
      } catch (e) {}
    }

    try {
      await fetch(`${FIREBASE_REST_BASE}/orders/${orderId}.json`, { method: 'DELETE' });
    } catch (e) {}

    return orders;
  }

  /* ── Clear All Orders (Admin) ────────────────────────────────────────── */
  static async clearAllOrders() {
    OrdersAPI._cacheOrders([]);

    const activeDb = _getDb();
    if (activeDb) {
      try {
        await activeDb.ref(ORDERS_REF).remove();
      } catch (e) {}
    }

    try {
      await fetch(`${FIREBASE_REST_BASE}/orders.json`, { method: 'DELETE' });
    } catch (e) {}

    return [];
  }
}

// Expose globally for all pages
window.ProductsAPI = ProductsAPI;
window.OrdersAPI = OrdersAPI;
window.OFFICIAL_SIZE_CHART = OFFICIAL_SIZE_CHART;
window.OFFICIAL_CATALOG = OFFICIAL_CATALOG;
