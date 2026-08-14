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

    // Only count revenue for non-cancelled orders
    const activeOrders = orders.filter(o => o.status !== 'Cancelled by Customer' && o.status !== 'Cancelled / Failed');
    const totalRevenue = activeOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

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
      tbody.innerHTML = `<tr><td colspan="7" class="empty-tbl">No products in catalog. Click "Upload New Product" to add.</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(p => {
      return `
      <tr>
        <td><img src="${p.image}" alt="${p.name}" onerror="this.src='images/logo.jpg'" /></td>
        <td>
          <div class="admin-prod-name">${p.name}</div>
          <div style="font-size:0.72rem; color:var(--grey-dim);">${p.sizes ? p.sizes.join(', ') : 'S, M, L, XL, 2XL'}</div>
        </td>
        <td><span class="admin-cat">${p.category}</span></td>
        <td class="admin-price">${App.formatMoney(p.price)}</td>
        <td>
          <span style="color:${p.stock > 5 ? 'var(--white)' : '#e63946'}; font-weight:700;">${p.stock}</span>
          <span style="font-size:0.75rem; color:var(--grey-dim);">in stock</span>
        </td>
        <td>
          <button type="button" onclick="openPreviewPermanentSizeChart('${p.name}')"
            style="display:inline-flex; align-items:center; gap:5px; background:rgba(197,160,89,0.12); border:1px solid var(--border-gold); color:var(--gold); padding:5px 12px; border-radius:var(--r-full); font-size:0.74rem; font-weight:700; cursor:pointer; font-family:var(--font-s); transition:var(--ease);"
            title="Permanent Standard Size Chart (Length, Shoulder, Sleeve, Chest in inches)">
            <i class="fa-solid fa-circle-check"></i> Standard Chart
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

  static renderOrdersTable(filterStatus = 'ALL') {
    const container = document.getElementById("ordersContainer");
    if (!container) return;

    const allOrders = JSON.parse(localStorage.getItem("uv_orders_history") || "[]");

    let orders = allOrders;
    if (filterStatus === 'CANCELLED') {
      orders = allOrders.filter(o => o.status === 'Cancelled by Customer' || o.status === 'Cancelled / Failed');
    } else if (filterStatus === 'ACTIVE') {
      orders = allOrders.filter(o => o.status !== 'Cancelled by Customer' && o.status !== 'Cancelled / Failed');
    }

    if (allOrders.length === 0) {
      container.innerHTML = `
        <div class="empty-tbl">
          <i class="fa-regular fa-file-lines" style="font-size:2.2rem; display:block; margin-bottom:10px; color:var(--gold);"></i>
          No customer orders recorded yet.<br>When customers submit orders via checkout, they will appear here live.
        </div>`;
      return;
    }

    const filterToolbar = `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 18px; background:rgba(255,255,255,0.02); border-bottom:1px solid var(--border); flex-wrap:wrap; gap:10px;">
        <div style="display:flex; gap:8px; font-size:0.78rem;">
          <button class="btn btn-sm ${filterStatus === 'ALL' ? 'btn-gold' : 'btn-outline'}" onclick="AdminManager.renderOrdersTable('ALL')">All (${allOrders.length})</button>
          <button class="btn btn-sm ${filterStatus === 'ACTIVE' ? 'btn-gold' : 'btn-outline'}" onclick="AdminManager.renderOrdersTable('ACTIVE')">Active (${allOrders.filter(o => o.status !== 'Cancelled by Customer' && o.status !== 'Cancelled / Failed').length})</button>
          <button class="btn btn-sm ${filterStatus === 'CANCELLED' ? 'btn-gold' : 'btn-outline'}" style="${filterStatus === 'CANCELLED' ? 'background:#e63946; color:#fff;' : 'border-color:rgba(230,57,70,0.4); color:#e63946;'}" onclick="AdminManager.renderOrdersTable('CANCELLED')">Cancelled (${allOrders.filter(o => o.status === 'Cancelled by Customer' || o.status === 'Cancelled / Failed').length})</button>
        </div>
      </div>`;

    if (orders.length === 0) {
      container.innerHTML = filterToolbar + `
        <div class="empty-tbl">
          No orders match the selected filter.
        </div>`;
      return;
    }

    container.innerHTML = filterToolbar + `
      <div style="overflow-x:auto; -webkit-overflow-scrolling:touch;">
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map((o) => {
              const cust = o.customer || {};
              const itemsStr = (o.items || []).map(i => `${i.name} (${i.size}) x${i.qty}`).join(', ');
              const status = o.status || 'Payment Confirmed';
              const isCancelled = status === 'Cancelled by Customer' || status === 'Cancelled / Failed';
              const cleanPhone = cust.phone ? cust.phone.replace(/[^0-9]/g, '') : '';
              const waLink = cleanPhone ? `https://wa.me/234${cleanPhone.slice(-10)}?text=Hello%20${encodeURIComponent(cust.name || 'Valued Customer')},%20this%20is%20Unified%20Vogue%20regarding%20order%20${o.id}.` : '#';

              let badgeStyle = 'background:var(--gold-grad); color:#000;';
              if (status === 'Dispatched') badgeStyle = 'background:#25D366; color:#fff;';
              else if (isCancelled) badgeStyle = 'background:#e63946; color:#fff;';
              else if (status === 'Payment Pending Confirmation') badgeStyle = 'background:#f39c12; color:#fff;';

              return `
                <tr style="${isCancelled ? 'opacity:0.72;' : ''}">
                  <td><strong style="color:${isCancelled ? '#e63946' : 'var(--gold-light)'}; font-family:monospace;">${o.id}</strong></td>
                  <td style="font-size:0.78rem; color:var(--grey-dim);">${o.date || 'Today'}</td>
                  <td><strong>${cust.name || 'Customer'}</strong></td>
                  <td style="font-size:0.82rem;">${cust.phone || '—'}</td>
                  <td style="font-size:0.8rem; color:var(--grey); max-width:180px;">${cust.address || '—'}, ${cust.city || ''}</td>
                  <td style="font-size:0.8rem; max-width:200px; color:var(--grey-light);">${itemsStr || '—'}</td>
                  <td class="admin-price" style="${isCancelled ? 'text-decoration:line-through; color:var(--grey-dim);' : ''}">${App.formatMoney(o.total || 0)}</td>
                  <td>
                    <span class="badge" style="${badgeStyle} font-size:0.6rem; text-transform:uppercase;">
                      ${status}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                      ${cleanPhone && !isCancelled ? `<a href="${waLink}" target="_blank" class="btn btn-gold btn-sm" style="padding:4px 10px; font-size:0.72rem; background:#25D366; color:#fff;" title="Chat customer on WhatsApp"><i class="fa-brands fa-whatsapp"></i> Chat</a>` : ''}
                      <button class="btn btn-outline btn-sm" style="padding:4px 8px; font-size:0.72rem;" onclick="AdminManager.toggleOrderStatus('${o.id}')" title="Change Order Status">
                        <i class="fa-solid fa-rotate"></i>
                      </button>
                      <button class="del-btn" style="padding:4px 8px; font-size:0.72rem;" onclick="AdminManager.deleteOrder('${o.id}')" title="Delete Unsuccessful Order">
                        <i class="fa-solid fa-trash-can"></i>
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

    await ProductsAPI.updateProduct(id, { price: priceNum, stock: stockNum });
    App.showToast(`Updated "${prod.name}" across all devices!`);
    this.initAdminDashboard();
  }

  static async deleteProd(id) {
    if (confirm("Are you sure you want to remove this product from the store catalog?")) {
      await ProductsAPI.deleteProduct(id);
      App.showToast("Product removed from catalog across all devices");
      this.initAdminDashboard();
    }
  }

  static toggleOrderStatus(refId) {
    const orders = JSON.parse(localStorage.getItem("uv_orders_history") || "[]");
    const idx = orders.findIndex(o => o.id === refId);
    if (idx !== -1) {
      const statuses = ['Payment Pending Confirmation', 'Payment Confirmed', 'Dispatched', 'Cancelled by Customer'];
      const currentIdx = statuses.indexOf(orders[idx].status);
      const nextIdx = (currentIdx + 1) % statuses.length;
      orders[idx].status = statuses[nextIdx];

      localStorage.setItem("uv_orders_history", JSON.stringify(orders));
      App.showToast(`Order ${refId} status set to "${orders[idx].status}"`);
      this.initAdminDashboard();
    }
  }

  static deleteOrder(refId) {
    if (!confirm(`Delete order "${refId}" from store records?\nThis will remove it from the sales log.`)) return;

    let orders = JSON.parse(localStorage.getItem("uv_orders_history") || "[]");
    orders = orders.filter(o => o.id !== refId);
    localStorage.setItem("uv_orders_history", JSON.stringify(orders));

    App.showToast(`Order ${refId} deleted from records`);
    this.initAdminDashboard();
  }
}
