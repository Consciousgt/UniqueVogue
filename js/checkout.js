/* ==========================================================================
   UNIFIED VOGUE — CHECKOUT & WHATSAPP RECEIPT ENGINE
   ========================================================================== */

class CheckoutManager {
  static generateRefCode() {
    return "UV-" + Math.floor(100000 + Math.random() * 900000) + "-PAY";
  }

  static submitOrder(formData) {
    const cart = CartManager.getCart();
    if (cart.length === 0) {
      App.showToast("Your shopping bag is empty!", "error");
      return;
    }

    const refCode = this.generateRefCode();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const shipping = subtotal >= 30000 ? 0 : 3500;
    const grandTotal = subtotal + shipping;

    const itemsText = cart.map(i => `• ${i.name} (Size: ${i.size}) x${i.qty} — ${App.formatMoney(i.price * i.qty)}`).join('\n');

    const whatsappMessage = `*HAUTE COUTURE ORDER — UNIFIED VOGUE*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `*Reference:* ${refCode}\n` +
      `*Customer:* ${formData.name}\n` +
      `*Phone:* ${formData.phone}\n` +
      `*City/State:* ${formData.city}\n` +
      `*Address:* ${formData.address}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `*ITEMS ORDERED:*\n${itemsText}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `*Subtotal:* ${App.formatMoney(subtotal)}\n` +
      `*Delivery Fee:* ${shipping === 0 ? 'FREE' : App.formatMoney(shipping)}\n` +
      `*TOTAL PAID:* ${App.formatMoney(grandTotal)}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `I have transferred the payment into Opay (Acc: 7044027511 - Chioma Peace Okafor). Please confirm receipt and dispatch order. Thank you!`;

    // Save order record for Admin portal
    const orderRecord = {
      id: refCode,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      customer: formData,
      items: cart,
      subtotal: subtotal,
      shipping: shipping,
      total: grandTotal,
      status: 'Payment Confirmed'
    };

    const existingOrders = JSON.parse(localStorage.getItem("uv_orders_history") || "[]");
    existingOrders.unshift(orderRecord);
    localStorage.setItem("uv_orders_history", JSON.stringify(existingOrders));

    // Clear shopping bag after order
    CartManager.saveCart([]);

    // Direct WhatsApp receipt link to Angela's phone number (+2347044027511)
    const waUrl = `https://wa.me/2347044027511?text=${encodeURIComponent(whatsappMessage)}`;
    window.location.href = `success.html?ref=${refCode}&wa=${encodeURIComponent(waUrl)}`;
  }
}
