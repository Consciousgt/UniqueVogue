/* ==========================================================================
   UNIFIED VOGUE — STORE OWNER ADMIN DASHBOARD MODULE
   ========================================================================== */

class AdminManager {
  static initAdminDashboard() {
    this.renderMetrics();
    this.renderProductsTable();
    this.renderOrdersTable();
  }

  static renderMetrics() {
    const products = ProductsAPI.getProducts();
    const orders = JSON.parse(localStorage.getItem("uv_orders_history") || "[]");
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const revenueEl  = document.getElementById("metricRevenue");
    const productsEl = document.getElementById("metricProducts");
    const ordersEl   = document.getElementById("metricOrders");

    if (revenueEl)  revenueEl.textContent  = App.formatMoney(totalRevenue);
    if (productsEl) productsEl.textContent = products.length;
    if (ordersEl)   ordersEl.textContent   = orders.length;
  }

  static renderProductsTable() {
    const tbody = document.getElementById("adminProductsTbody");
    if (!tbody) return;

    const products = ProductsAPI.getProducts();
    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-tbl">No products in catalog. Click "Upload New Product" to add.</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(p => {
      const hasChart = p.sizeChart && p.sizeChart.measurements && p.sizeChart.measurements.length > 0;
      return `
      <tr>
        <td><img src="${p.image}" alt="${p.name}" onerror="this.src='images/logo.jpg'" /></td>
        <td>
          <div class="admin-prod-name">${p.name}</div>
          <div style="font-size:0.72rem; color:var(--grey-dim);">${p.sizes ? p.sizes.join(', ') : 'S, M, L, XL'}</div>
        </td>
        <td><span class="admin-cat">${p.category}</span></td>
        <td class="admin-price">${App.formatMoney(p.price)}</td>
        <td>
          <span style="color:${p.stock > 5 ? 'var(--white)' : '#e63946'}; font-weight:700;">${p.stock}</span>
          <span style="font-size:0.75rem; color:var(--grey-dim);">in stock</span>
        </td>
        <td>
          <button onclick="openEditSizeChart('${p.id}')"
            style="display:inline-flex; align-items:center; gap:5px; background:${hasChart ? 'rgba(197,160,89,0.12)' : 'rgba(255,255,255,0.04)'}; border:1px solid ${hasChart ? 'var(--border-gold)' : 'var(--border)'}; color:${hasChart ? 'var(--gold)' : 'var(--grey-dim)'}; padding:5px 12px; border-radius:var(--r-full); font-size:0.74rem; font-weight:700; cursor:pointer; font-family:var(--font-s); transition:var(--ease);">
            <i class="fa-solid fa-ruler"></i> ${hasChart ? 'Edit Chart' : 'Add Chart'}
          </button>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-outline btn-sm" style="padding:4px 10px; font-size:0.72rem;" onclick="AdminManager.quickEditStock('${p.id}')">
              <i class="fa-solid fa-pen"></i> Edit
            </button>
            <button class="del-btn" onclick="AdminManager.deleteProd('${p.id}')">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `}).join('');
  }

  static renderOrdersTable() {
    const container = document.getElementById("ordersContainer");
    if (!container) return;

    const orders = JSON.parse(localStorage.getItem("uv_orders_history") || "[]");

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="empty-tbl">
          <i class="fa-regular fa-file-lines" style="font-size:2.2rem; display:block; margin-bottom:10px; color:var(--gold);"></i>
          No customer orders recorded yet.<br>When customers submit orders via checkout, they will appear here live.
        </div>`;
      return;
    }

    container.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="admin-tbl">
          <thead>
            <tr>
              <th>Ref Code</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Delivery Address</th>
              <th>Items Ordered</th>
              <th>Total Paid</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map((o, idx) => {
              const cust = o.customer || {};
              const itemsStr = (o.items || []).map(i => `${i.name} (${i.size}) x${i.qty}`).join(', ');
              const status = o.status || 'Payment Confirmed';
              const cleanPhone = cust.phone ? cust.phone.replace(/[^0-9]/g, '') : '';
              const waLink = cleanPhone ? `https://wa.me/234${cleanPhone.slice(-10)}?text=Hello%20${encodeURIComponent(cust.name || 'Valued Customer')},%20this%20is%20Angela%20from%20Unified%20Vogue%20regarding%20order%20${o.id}.` : '#';

              return `
                <tr>
                  <td><strong style="color:var(--gold-light); font-family:monospace;">${o.id}</strong></td>
                  <td style="font-size:0.78rem; color:var(--grey-dim);">${o.date || 'Today'}</td>
                  <td><strong>${cust.name || 'Customer'}</strong></td>
                  <td style="font-size:0.82rem;">${cust.phone || '—'}</td>
                  <td style="font-size:0.8rem; color:var(--grey); max-width:180px;">${cust.address || '—'}, ${cust.city || ''}</td>
                  <td style="font-size:0.8rem; max-width:200px; color:var(--grey-light);">${itemsStr || '—'}</td>
                  <td class="admin-price">${App.formatMoney(o.total || 0)}</td>
                  <td>
                    <span class="badge" style="background:${status === 'Dispatched' ? '#25D366' : 'var(--gold-grad)'}; color:#000; font-size:0.6rem;">
                      ${status}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex; gap:6px;">
                      ${cleanPhone ? `<a href="${waLink}" target="_blank" class="btn btn-gold btn-sm" style="padding:4px 10px; font-size:0.72rem; background:#25D366; color:#fff;" title="Chat customer on WhatsApp"><i class="fa-brands fa-whatsapp"></i> Chat</a>` : ''}
                      <button class="btn btn-outline btn-sm" style="padding:4px 8px; font-size:0.72rem;" onclick="AdminManager.toggleOrderStatus(${idx})" title="Toggle Order Status">
                        <i class="fa-solid fa-rotate"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  static quickEditStock(id) {
    const prod = ProductsAPI.getProductById(id);
    if (!prod) return;

    const newPrice = prompt(`Update Price for "${prod.name}" (₦):`, prod.price);
    if (newPrice === null) return;

    const newStock = prompt(`Update Stock Quantity for "${prod.name}":`, prod.stock);
    if (newStock === null) return;

    const priceNum = Number(newPrice);
    const stockNum = Number(newStock);

    if (isNaN(priceNum) || isNaN(stockNum)) {
      App.showToast("Invalid values entered", "error");
      return;
    }

    ProductsAPI.updateProduct(id, { price: priceNum, stock: stockNum });
    App.showToast(`Updated "${prod.name}" successfully!`);
    this.initAdminDashboard();
  }

  static deleteProd(id) {
    if (confirm("Are you sure you want to remove this product from the store catalog?")) {
      ProductsAPI.deleteProduct(id);
      App.showToast("Product removed from catalog");
      this.initAdminDashboard();
    }
  }

  static toggleOrderStatus(index) {
    const orders = JSON.parse(localStorage.getItem("uv_orders_history") || "[]");
    if (orders[index]) {
      orders[index].status = orders[index].status === 'Dispatched' ? 'Payment Confirmed' : 'Dispatched';
      localStorage.setItem("uv_orders_history", JSON.stringify(orders));
      App.showToast(`Order status updated to "${orders[index].status}"`);
      this.initAdminDashboard();
    }
  }
}
