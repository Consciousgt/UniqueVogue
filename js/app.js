/* ==========================================================================
   UNIFIED VOGUE - CORE APP CONTROLLER
   ========================================================================== */

class App {
  static formatMoney(amount) {
    return "₦" + Number(amount).toLocaleString('en-NG');
  }

  static showToast(message, type = 'success') {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const icon = type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check';
    const toast = document.createElement("div");
    toast.className = "toast-item";
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideToast 0.3s reverse forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  static copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast(`Copied: ${text}`);
      });
    } else {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      this.showToast(`Copied: ${text}`);
    }
  }
}

// Mark active nav link based on current page
document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(link => {
    const href = link.getAttribute("href");
    if (href && href.split("?")[0] === currentPage) {
      link.classList.add("active");
    }
  });
});
