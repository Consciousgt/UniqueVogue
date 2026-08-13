/* ==========================================================================
   UNIFIED VOGUE — SHOPPING BAG ENGINE (MULTIDYNAMIC)
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

  static addToCart(productId, qty = 1, selectedSize = null) {
    const product = ProductsAPI.getProductById(productId);
    if (!product) return;

    const size = selectedSize || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : "S");
    let cart = this.getCart();
    const existingIndex = cart.findIndex(item => item.id === productId && item.size === size);

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
        size: size,
        availableSizes: product.sizes || ["S", "M", "L", "XL", "2XL"]
      });
    }

    this.saveCart(cart);
    App.showToast(`Added "${product.name}" (${size}) to bag!`);
  }

  static updateQuantity(productId, size, delta) {
    let cart = this.getCart();
    const item = cart.find(i => i.id === productId && i.size === size);
    if (item) {
      item.qty += delta;
      if (item.qty <= 0) {
        cart = cart.filter(i => !(i.id === productId && i.size === size));
        App.showToast(`Removed "${item.name}" from bag`);
      }
      this.saveCart(cart);
    }
  }

  static changeSize(productId, oldSize, newSize) {
    if (!newSize || oldSize === newSize) return;
    let cart = this.getCart();
    const itemIdx = cart.findIndex(i => i.id === productId && i.size === oldSize);
    if (itemIdx === -1) return;

    const existingNewSizeIdx = cart.findIndex(i => i.id === productId && i.size === newSize);
    if (existingNewSizeIdx > -1 && existingNewSizeIdx !== itemIdx) {
      cart[existingNewSizeIdx].qty += cart[itemIdx].qty;
      cart.splice(itemIdx, 1);
    } else {
      cart[itemIdx].size = newSize;
    }

    this.saveCart(cart);
    App.showToast(`Size updated to ${newSize}`);
  }

  static removeFromCart(productId, size) {
    let cart = this.getCart();
    const item = cart.find(i => i.id === productId && i.size === size);
    cart = cart.filter(i => !(i.id === productId && i.size === size));
    this.saveCart(cart);
    App.showToast(item ? `Removed "${item.name}" (${size})` : "Item removed from bag");
  }

  static updateBadges() {
    const cart = this.getCart();
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

    const cartBadge = document.getElementById("navCartBadge");
    if (cartBadge) {
      cartBadge.innerText = totalQty;
      cartBadge.style.display = totalQty > 0 ? "flex" : "none";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  CartManager.updateBadges();
});
