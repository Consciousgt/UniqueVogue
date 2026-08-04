/* ==========================================================================
   UNIFIED VOGUE — SHOPPING BAG ENGINE
   ========================================================================== */

class CartManager {
  static getCart() {
    const stored = localStorage.getItem("uv_bag_db");
    return stored ? JSON.parse(stored) : [];
  }

  static saveCart(cart) {
    localStorage.setItem("uv_bag_db", JSON.stringify(cart));
    this.updateBadges();
  }

  static addToCart(productId, qty = 1, selectedSize = "S") {
    const product = ProductsAPI.getProductById(productId);
    if (!product) return;

    let cart = this.getCart();
    const existingIndex = cart.findIndex(item => item.id === productId && item.size === selectedSize);

    if (existingIndex > -1) {
      cart[existingIndex].qty += qty;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        image: product.image,
        qty: qty,
        size: selectedSize || "S"
      });
    }

    this.saveCart(cart);
    App.showToast(`Added "${product.name}" (${selectedSize}) to bag!`);
  }

  static updateQuantity(productId, size, delta) {
    let cart = this.getCart();
    const item = cart.find(i => i.id === productId && i.size === size);
    if (item) {
      item.qty += delta;
      if (item.qty <= 0) {
        cart = cart.filter(i => !(i.id === productId && i.size === size));
      }
      this.saveCart(cart);
    }
  }

  static removeFromCart(productId, size) {
    let cart = this.getCart();
    cart = cart.filter(i => !(i.id === productId && i.size === size));
    this.saveCart(cart);
    App.showToast("Item removed from bag");
  }

  static updateBadges() {
    const cart = this.getCart();
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

    const cartBadge = document.getElementById("navCartBadge");
    if (cartBadge) cartBadge.innerText = totalQty;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  CartManager.updateBadges();
});
