/* ==========================================================================
   UNIFIED VOGUE — OFFICIAL PRODUCT CATALOG WITH SIZE CHART SUPPORT
   ========================================================================== */

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
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "A luxury all-black open-knit shirt featuring a relaxed Cuban camp collar, tonal button closure, and premium textured finish. Lightweight, breathable, and designed for effortless sophistication.",
    sizeChart: {
      unit: "cm",
      measurements: [
        { size: "S",   shoulder: "42", chest: "96",  waist: "90",  hip: "96",  length: "72" },
        { size: "M",   shoulder: "44", chest: "100", waist: "94",  hip: "100", length: "74" },
        { size: "L",   shoulder: "46", chest: "108", waist: "102", hip: "108", length: "76" },
        { size: "XL",  shoulder: "48", chest: "116", waist: "110", hip: "116", length: "78" },
        { size: "XXL", shoulder: "50", chest: "124", waist: "118", hip: "124", length: "80" }
      ]
    }
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
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "A bold, artistic vintage-style short-sleeve shirt with an eye-catching black, white, and gold brushstroke pattern. Crafted from smooth, lightweight fabric for maximum comfort and style.",
    sizeChart: {
      unit: "cm",
      measurements: [
        { size: "S",   shoulder: "42", chest: "96",  waist: "90",  hip: "96",  length: "72" },
        { size: "M",   shoulder: "44", chest: "100", waist: "94",  hip: "100", length: "74" },
        { size: "L",   shoulder: "46", chest: "108", waist: "102", hip: "108", length: "76" },
        { size: "XL",  shoulder: "48", chest: "116", waist: "110", hip: "116", length: "78" },
        { size: "XXL", shoulder: "50", chest: "124", waist: "118", hip: "124", length: "80" }
      ]
    }
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
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Rich chocolate-brown open-knit shirt with classic Cuban lapels and custom pearlized buttons. Warm, elegant, and versatile — a staple piece for high-fashion casual styling.",
    sizeChart: {
      unit: "cm",
      measurements: [
        { size: "S",   shoulder: "42", chest: "96",  waist: "90",  hip: "96",  length: "72" },
        { size: "M",   shoulder: "44", chest: "100", waist: "94",  hip: "100", length: "74" },
        { size: "L",   shoulder: "46", chest: "108", waist: "102", hip: "108", length: "76" },
        { size: "XL",  shoulder: "48", chest: "116", waist: "110", hip: "116", length: "78" },
        { size: "XXL", shoulder: "50", chest: "124", waist: "118", hip: "124", length: "80" }
      ]
    }
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
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Vibrant ocean teal and deep black African-inspired swirl pattern shirt. Features a tailored resort fit that makes a powerful fashion statement wherever you go.",
    sizeChart: {
      unit: "cm",
      measurements: [
        { size: "S",   shoulder: "42", chest: "96",  waist: "90",  hip: "96",  length: "72" },
        { size: "M",   shoulder: "44", chest: "100", waist: "94",  hip: "100", length: "74" },
        { size: "L",   shoulder: "46", chest: "108", waist: "102", hip: "108", length: "76" },
        { size: "XL",  shoulder: "48", chest: "116", waist: "110", hip: "116", length: "78" },
        { size: "XXL", shoulder: "50", chest: "124", waist: "118", hip: "124", length: "80" }
      ]
    }
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
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Refined beige open-knit shirt with horizontal micro-stripe texture and short sleeves. Understated luxury that pairs flawlessly with dark trousers or casual wear.",
    sizeChart: {
      unit: "cm",
      measurements: [
        { size: "S",   shoulder: "42", chest: "96",  waist: "90",  hip: "96",  length: "72" },
        { size: "M",   shoulder: "44", chest: "100", waist: "94",  hip: "100", length: "74" },
        { size: "L",   shoulder: "46", chest: "108", waist: "102", hip: "108", length: "76" },
        { size: "XL",  shoulder: "48", chest: "116", waist: "110", hip: "116", length: "78" },
        { size: "XXL", shoulder: "50", chest: "124", waist: "118", hip: "124", length: "80" }
      ]
    }
  }
];

const DB_KEY = "uv_vogue_catalog_v5";

class ProductsAPI {
  static getProducts() {
    const stored = localStorage.getItem(DB_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    this.saveProducts(OFFICIAL_CATALOG);
    return OFFICIAL_CATALOG;
  }

  static saveProducts(products) {
    localStorage.setItem(DB_KEY, JSON.stringify(products));
  }

  static getProductById(id) {
    return this.getProducts().find(p => p.id === id);
  }

  static addProduct(productData) {
    const products = this.getProducts();
    const newProd = {
      id: "uv-" + Date.now(),
      rating: 5.0,
      stock: productData.stock || 10,
      sizes: productData.sizes || ["S", "M", "L", "XL", "XXL"],
      sizeChart: productData.sizeChart || null,
      ...productData
    };
    products.unshift(newProd);
    this.saveProducts(products);
    return newProd;
  }

  static updateProduct(id, updatedData) {
    let products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      products[idx] = { ...products[idx], ...updatedData };
      this.saveProducts(products);
      return products[idx];
    }
    return null;
  }

  static deleteProduct(id) {
    const filtered = this.getProducts().filter(p => p.id !== id);
    this.saveProducts(filtered);
  }

  static resetCatalog() {
    this.saveProducts(OFFICIAL_CATALOG);
    return OFFICIAL_CATALOG;
  }
}
