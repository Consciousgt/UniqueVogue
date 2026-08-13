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
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

    // Format all items cleanly in order list
    const itemsListText = cart.map((item, idx) => {
      const itemTotal = item.price * item.qty;
      return `${idx + 1}. *${item.name}*\n   • Size: ${item.size}\n   • Qty: ${item.qty}\n   • Price: ${App.formatMoney(itemTotal)}`;
    }).join('\n\n');

    const whatsappMessage = 
      `*HAUTE COUTURE ORDER — UNIFIED VOGUE*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `*Order Reference:* ${refCode}\n` +
      `*Customer Name:* ${formData.name}\n` +
      `*Phone/WhatsApp:* ${formData.phone}\n` +
      `*State/City:* ${formData.city}\n` +
      `*Delivery Address:* ${formData.address}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `*ITEMS ORDERED (${totalQty} item${totalQty > 1 ? 's' : ''}):*\n\n` +
      `${itemsListText}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `*Items Subtotal:* ${App.formatMoney(subtotal)}\n` +
      `*Delivery Fee:* To be confirmed via WhatsApp chat\n` +
      `*ITEMS TOTAL PAID:* ${App.formatMoney(subtotal)}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `I have transferred ${App.formatMoney(subtotal)} into Opay (Acc: 6584992459 - CHIOMA PEACE OKAFOR). Please confirm receipt and let me know the delivery fee & dispatch timeline. Thank you!`;

    // Save order record for Admin portal
    const orderRecord = {
      id: refCode,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      customer: formData,
      items: cart,
      subtotal: subtotal,
      shipping: 'TBD',
      total: subtotal,
      status: 'Payment Pending Confirmation'
    };

    const existingOrders = JSON.parse(localStorage.getItem("uv_orders_history") || "[]");
    existingOrders.unshift(orderRecord);
    localStorage.setItem("uv_orders_history", JSON.stringify(existingOrders));

    // Clear shopping bag after order submission
    CartManager.saveCart([]);

    // Direct WhatsApp receipt link to phone number (+2349126284759)
    const waUrl = `https://wa.me/2349126284759?text=${encodeURIComponent(whatsappMessage)}`;
    window.location.href = `success.html?ref=${refCode}&wa=${encodeURIComponent(waUrl)}`;
  }
}
