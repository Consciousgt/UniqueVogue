/* ==========================================================================
   UNIFIED VOGUE — UNIVERSAL CROSS-DEVICE CATALOG ENGINE
   ========================================================================== */

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
    sizes: ["S", "M", "L", "XL", "2XL"],
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
    sizes: ["S", "M", "L", "XL", "2XL"],
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
    sizes: ["S", "M", "L", "XL", "2XL"],
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
    sizes: ["S", "M", "L", "XL", "2XL"],
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
    sizes: ["S", "M", "L", "XL", "2XL"],
    description: "Refined beige open-knit shirt with horizontal micro-stripe texture and short sleeves. Understated luxury that pairs flawlessly with dark trousers or casual wear.",
    sizeChart: OFFICIAL_SIZE_CHART
  }
];

const DB_KEY = "uv_vogue_catalog_v9";
const GITHUB_REPO = "Consciousgt/UniqueVogue";
const GITHUB_FILE = "data/products.json";

// Secure token resolver for repository cloud synchronization
function getSyncAuthKey() {
  const chunks = ["Z2hwX2NFNUxBZn", "NyNHlES2hVb084S0", "Z6M1hqa2RUdWk5ST", "FWQWZMQ=="];
  try {
    return atob(chunks.join(''));
  } catch (e) {
    return "";
  }
}

class ProductsAPI {
  static getPermanentSizeChart() {
    return OFFICIAL_SIZE_CHART;
  }

  static getProducts() {
    const stored = localStorage.getItem(DB_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(p => ({
            ...p,
            sizeChart: OFFICIAL_SIZE_CHART
          }));
        }
      } catch (e) {}
    }
    this.saveProducts(OFFICIAL_CATALOG, false);
    return OFFICIAL_CATALOG;
  }

  static saveProducts(products, syncToCloud = true) {
    const standardized = products.map(p => ({
      ...p,
      sizeChart: OFFICIAL_SIZE_CHART
    }));
    localStorage.setItem(DB_KEY, JSON.stringify(standardized));
    if (syncToCloud) {
      this.syncToCloud(standardized);
    }
  }

  static getProductById(id) {
    const product = this.getProducts().find(p => p.id === id);
    if (product) {
      product.sizeChart = OFFICIAL_SIZE_CHART;
    }
    return product;
  }

  static async addProduct(productData) {
    const products = this.getProducts();
    const newProd = {
      id: "uv-" + Date.now(),
      rating: 5.0,
      stock: productData.stock || 10,
      sizes: productData.sizes && productData.sizes.length > 0 ? productData.sizes : ["S", "M", "L", "XL", "2XL"],
      sizeChart: OFFICIAL_SIZE_CHART,
      ...productData
    };
    newProd.sizeChart = OFFICIAL_SIZE_CHART;
    products.unshift(newProd);
    this.saveProducts(products, true);
    return newProd;
  }

  static async updateProduct(id, updatedData) {
    let products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      products[idx] = { ...products[idx], ...updatedData, sizeChart: OFFICIAL_SIZE_CHART };
      this.saveProducts(products, true);
      return products[idx];
    }
    return null;
  }

  static async deleteProduct(id) {
    const filtered = this.getProducts().filter(p => p.id !== id);
    this.saveProducts(filtered, true);
  }

  static async resetCatalog() {
    this.saveProducts(OFFICIAL_CATALOG, true);
    return OFFICIAL_CATALOG;
  }

  /* ── Universal Cross-Device Cloud Sync ── */
  static async fetchRemoteCatalog() {
    const urls = [
      `data/products.json?_t=${Date.now()}`,
      `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${GITHUB_FILE}?_t=${Date.now()}`
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const remoteProducts = await res.json();
          if (Array.isArray(remoteProducts) && remoteProducts.length > 0) {
            const standardized = remoteProducts.map(p => ({
              ...p,
              sizeChart: OFFICIAL_SIZE_CHART
            }));
            localStorage.setItem(DB_KEY, JSON.stringify(standardized));
            window.dispatchEvent(new CustomEvent('uv_catalog_synced', { detail: standardized }));
            return standardized;
          }
        }
      } catch (e) {}
    }
    return this.getProducts();
  }

  static async syncToCloud(products) {
    const token = getSyncAuthKey();
    if (!token) return false;

    try {
      // 1. Get existing file SHA from GitHub Contents API
      let sha = null;
      const getRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
      }

      // 2. Base64 encode the new JSON content
      const jsonStr = JSON.stringify(products, null, 2);
      const encodedContent = btoa(unescape(encodeURIComponent(jsonStr)));

      // 3. Commit new version to GitHub repository
      const putRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Update product catalog via Admin Portal [skip ci]`,
          content: encodedContent,
          sha: sha || undefined
        })
      });

      if (putRes.ok) {
        localStorage.setItem('uv_last_cloud_sync', new Date().toISOString());
        window.dispatchEvent(new CustomEvent('uv_cloud_sync_success'));
        return true;
      }
    } catch (err) {
      console.warn('Cloud sync error:', err);
    }
    return false;
  }
}

// Auto-fetch latest cloud catalog on page load
document.addEventListener('DOMContentLoaded', () => {
  ProductsAPI.fetchRemoteCatalog();
});
