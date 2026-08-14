/* ==========================================================================
   UNIFIED VOGUE — STORE OWNER ADMIN DASHBOARD MODULE
   Live Metrics, Real-Time Product Catalog & Customer Order Management
   ========================================================================== */

class AdminManager {
  static _catalogSub = null;
  static _ordersSub = null;
  static _activeFilter = 'ALL';

  static initAdminDashboard() {
    this.renderMetrics();
    this.renderProductsTable();
    this.renderOrdersTable();

    // 1. Live Products Subscription
    if (!this._catalogSub) {
      this._catalogSub = ProductsAPI.subscribeToLiveCatalog((products) => {
        this.renderMetrics();
        this.renderProductsTable(products);
      });
    }

    // 2. Live Orders Subscription
    if (!this._ordersSub) {
      this._ordersSub = OrdersAPI.subscribeToLiveOrders((orders) => {
        this.renderMetrics();
        this.renderOrdersTable(this._activeFilter, orders);
      });
    }
  }

  static renderMetrics() {
    const products = ProductsAPI.getProducts();
    const orders = (typeof OrdersAPI !== "undefined") ? OrdersAPI.getOrders() : JSON.parse(localStorage.getItem("uv_orders_history") || "[]");

    // Count revenue for non-cancelled orders
    const activeOrders = orders.filter(o => o.status !== 'Cancelled by Customer' && o.status !== 'Cancelled / Failed');
    const totalRevenue = activeOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const revenueEl  = document.getElementById("metricRevenue");
    const productsEl = document.getElementById("metricProducts");
    const ordersEl   = document.getElementById("metricOrders");

    if (revenueEl)  revenueEl.textContent  = App.formatMoney(totalRevenue);
    if (productsEl) productsEl.textContent = products.length;
    if (ordersEl)   ordersEl.textContent   = orders.length;
  }

  static renderProductsTable(productList) {
    const tbody = document.getElementById("adminProductsTbody");
    if (!tbody) return;

    const products = (Array.isArray(productList) && productList.length > 0) ? productList : ProductsAPI.getProducts();
    if (!products || products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-tbl">No products in catalog. Click "Upload New Product" to add.</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(p => {
      const isSoldOut = p.stock <= 0 || (p.badge && p.badge.toLowerCase().includes('sold out'));

      return `
      <tr style="${isSoldOut ? 'background:rgba(230,57,70,0.03);' : ''}">
        <td><img src="${p.image}" alt="${p.name}" onerror="this.src='images/logo.jpg'" /></td>
        <td>
          <div class="admin-prod-name">${p.name}</div>
          <div style="font-size:0.72rem; color:var(--grey-dim);">${p.sizes ? p.sizes.join(', ') : 'S, M, L, XL, 2XL'}</div>
        </td>
        <td>
          <span class="admin-cat">${p.category}</span>
          ${isSoldOut ? '<span style="display:inline-block; margin-left:4px; background:#e63946; color:#fff; padding:2px 7px; border-radius:var(--r-full); font-size:0.65rem; font-weight:700; text-transform:uppercase;">Sold Out</span>' : ''}
        </td>
        <td class="admin-price">${App.formatMoney(p.price)}</td>
        <td>
          ${isSoldOut
            ? '<span style="color:#e63946; font-weight:700; font-size:0.82rem;"><i class="fa-solid fa-ban"></i> 0</span> <span style="font-size:0.72rem; color:#e63946;">(Sold Out)</span>'
            : `<span style="color:${p.stock > 5 ? 'var(--white)' : '#f39c12'}; font-weight:700;">${p.stock}</span> <span style="font-size:0.75rem; color:var(--grey-dim);">in stock</span>`
          }
        </td>
        <td>
          <button type="button" onclick="openPreviewPermanentSizeChart('${p.name.replace(/'/g, "\\'")}')"
            style="display:inline-flex; align-items:center; gap:5px; background:rgba(197,160,89,0.12); border:1px solid var(--border-gold); color:var(--gold); padding:5px 12px; border-radius:var(--r-full); font-size:0.74rem; font-weight:700; cursor:pointer; font-family:var(--font-s); transition:var(--ease);"
            title="Permanent Standard Size Chart (Length, Shoulder, Sleeve, Chest in inches)">
            <i class="fa-solid fa-circle-check"></i> Standard Chart
          </button>
        </td>
        <td>
          <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
            <button class="btn btn-outline btn-sm" style="padding:4px 10px; font-size:0.72rem;" onclick="AdminManager.quickEditStock('${p.id}')" title="Edit Price & Stock">
              <i class="fa-solid fa-pen"></i> Edit
            </button>
            ${isSoldOut
              ? `<button class="btn btn-outline btn-sm" style="padding:4px 10px; font-size:0.72rem; color:#25D366; border-color:rgba(37,211,102,0.4);" onclick="AdminManager.restockProd('${p.id}')" title="Add new inventory stock">
                  <i class="fa-solid fa-boxes-packing"></i> Restock
                 </button>`
              : `<button class="btn btn-outline btn-sm" style="padding:4px 10px; font-size:0.72rem; color:#f39c12; border-color:rgba(243,156,18,0.4);" onclick="AdminManager.markSoldOut('${p.id}')" title="Set stock to 0 (Mark item as Sold Out)">
                  <i class="fa-solid fa-tag"></i> Sold Out
                 </button>`
            }
            <button class="del-btn" style="padding:5px 12px; font-size:0.74rem; display:inline-flex; align-items:center; gap:5px;" onclick="AdminManager.deleteProd('${p.id}')" title="Permanently delete from store catalog">
              <i class="fa-solid fa-trash-can"></i> Delete
            </button>
          </div>
        </td>
      </tr>
    `}).join('');
  }

  static renderOrdersTable(filterStatus = 'ALL', orderList = null) {
    const container = document.getElementById("ordersContainer");
    if (!container) return;

    this._activeFilter = filterStatus;
    const allOrders = (Array.isArray(orderList)) ? orderList : (typeof OrdersAPI !== "undefined" ? OrdersAPI.getOrders() : JSON.parse(localStorage.getItem("uv_orders_history") || "[]"));

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
          No customer orders recorded yet.<br>When customers submit orders via checkout, they will appear here live in real-time.
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
                    <select class="order-status-select" onchange="AdminManager.setOrderStatus('${o.id}', this.value)" style="border-color:${isCancelled ? '#e63946' : 'var(--border-gold)'};">
                      <option value="Payment Pending Confirmation" ${status === 'Payment Pending Confirmation' ? 'selected' : ''}>🟡 Payment Pending</option>
                      <option value="Payment Confirmed" ${status === 'Payment Confirmed' ? 'selected' : ''}>🟢 Payment Confirmed</option>
                      <option value="Processing / Packaging" ${status === 'Processing / Packaging' ? 'selected' : ''}>📦 Packaging / Processing</option>
                      <option value="Dispatched" ${status === 'Dispatched' ? 'selected' : ''}>🚚 Dispatched / In Transit</option>
                      <option value="Delivered" ${status === 'Delivered' ? 'selected' : ''}>✅ Delivered</option>
                      <option value="Cancelled by Customer" ${isCancelled ? 'selected' : ''}>❌ Cancelled</option>
                    </select>
                  </td>
                  <td>
                    <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
                      ${cleanPhone && !isCancelled ? `<a href="${waLink}" target="_blank" class="btn btn-gold btn-sm" style="padding:4px 10px; font-size:0.72rem; background:#25D366; color:#fff;" title="Chat customer on WhatsApp"><i class="fa-brands fa-whatsapp"></i> Chat</a>` : ''}
                      <button class="del-btn" style="padding:4px 8px; font-size:0.72rem;" onclick="AdminManager.deleteOrder('${o.id}')" title="Delete Order from records">
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

    ProductsAPI.updateProduct(id, { price: priceNum, stock: stockNum }).then(() => {
      App.showToast(`Updated "${prod.name}" across all devices!`);
      this.initAdminDashboard();
    });
  }

  static markSoldOut(id) {
    const prod = ProductsAPI.getProductById(id);
    if (!prod) return;

    if (confirm(`Mark "${prod.name}" as SOLD OUT?\n\nThis sets the stock to 0 and updates the storefront across all customer devices immediately.`)) {
      ProductsAPI.updateProduct(id, { stock: 0, badge: "Sold Out" }).then(() => {
        App.showToast(`"${prod.name}" is now marked as Sold Out.`);
        this.initAdminDashboard();
      });
    }
  }

  static restockProd(id) {
    const prod = ProductsAPI.getProductById(id);
    if (!prod) return;

    const input = prompt(`Enter new inventory quantity to restock for "${prod.name}":`, "15");
    if (input === null) return;

    const qty = Number(input);
    if (isNaN(qty) || qty <= 0) {
      App.showToast("Please enter a valid stock number greater than 0", "error");
      return;
    }

    ProductsAPI.updateProduct(id, { stock: qty, badge: "Available" }).then(() => {
      App.showToast(`"${prod.name}" restocked with ${qty} units!`);
      this.initAdminDashboard();
    });
  }

  static deleteProd(id) {
    const prod = ProductsAPI.getProductById(id);
    const prodName = prod ? prod.name : "this product";

    if (confirm(`Delete "${prodName}" from the store catalog?\n\n⚠️ This will permanently remove this item from the store across ALL devices and customers will no longer see it.`)) {
      ProductsAPI.deleteProduct(id).then(() => {
        App.showToast(`"${prodName}" has been deleted from the catalog across all devices`);
        this.initAdminDashboard();
      });
    }
  }

  static setOrderStatus(refId, newStatus) {
    if (typeof OrdersAPI !== "undefined") {
      OrdersAPI.updateOrderStatus(refId, newStatus).then(() => {
        App.showToast(`Order ${refId} status updated to "${newStatus}"`);
        this.initAdminDashboard();
      });
    } else {
      const orders = JSON.parse(localStorage.getItem("uv_orders_history") || "[]");
      const idx = orders.findIndex(o => o.id === refId);
      if (idx !== -1) {
        orders[idx].status = newStatus;
        localStorage.setItem("uv_orders_history", JSON.stringify(orders));
        App.showToast(`Order ${refId} status updated to "${newStatus}"`);
        this.initAdminDashboard();
      }
    }
  }

  static toggleOrderStatus(refId) {
    const orders = (typeof OrdersAPI !== "undefined") ? OrdersAPI.getOrders() : JSON.parse(localStorage.getItem("uv_orders_history") || "[]");
    const idx = orders.findIndex(o => o.id === refId);
    if (idx !== -1) {
      const statuses = ['Payment Pending Confirmation', 'Payment Confirmed', 'Processing / Packaging', 'Dispatched', 'Delivered', 'Cancelled by Customer'];
      const currentIdx = statuses.indexOf(orders[idx].status);
      const nextIdx = (currentIdx + 1) % statuses.length;
      const newStatus = statuses[nextIdx];
      this.setOrderStatus(refId, newStatus);
    }
  }

  static deleteOrder(refId) {
    if (!confirm(`Delete order "${refId}" from store records?\nThis will remove it from the sales log.`)) return;

    if (typeof OrdersAPI !== "undefined") {
      OrdersAPI.deleteOrder(refId).then(() => {
        App.showToast(`Order ${refId} deleted from records`);
        this.initAdminDashboard();
      });
    } else {
      let orders = JSON.parse(localStorage.getItem("uv_orders_history") || "[]");
      orders = orders.filter(o => o.id !== refId);
      localStorage.setItem("uv_orders_history", JSON.stringify(orders));
      App.showToast(`Order ${refId} deleted from records`);
      this.initAdminDashboard();
    }
  }

  static clearAllOrders() {
    if (typeof OrdersAPI !== "undefined") {
      OrdersAPI.clearAllOrders().then(() => {
        App.showToast("Orders history cleared");
        this.initAdminDashboard();
      });
    } else {
      localStorage.setItem("uv_orders_history", "[]");
      App.showToast("Orders history cleared");
      this.initAdminDashboard();
    }
  }
}
