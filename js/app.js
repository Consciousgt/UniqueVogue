/* ==========================================================================
   UNIFIED VOGUE — CORE APP CONTROLLER & GLOBAL UTILITIES
   ========================================================================== */

class App {
  static formatMoney(amount) {
    return "₦" + Number(amount || 0).toLocaleString('en-NG');
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
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      this.showToast(`Copied: ${text}`);
    }
  }

  /* ── Universal Mobile Navigation Controller ── */
  static initNavigation() {
    const toggle = document.getElementById('navToggle');
    const links  = document.getElementById('navLinks');
    const close  = document.getElementById('navClose');

    if (toggle && links) {
      toggle.onclick = (e) => {
        e.stopPropagation();
        links.classList.add('open');
        document.body.style.overflow = 'hidden';
      };

      if (close) {
        close.onclick = (e) => {
          e.stopPropagation();
          links.classList.remove('open');
          document.body.style.overflow = '';
        };
      }

      links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          links.classList.remove('open');
          document.body.style.overflow = '';
        });
      });

      document.addEventListener('click', (e) => {
        if (links.classList.contains('open') && !links.contains(e.target) && !toggle.contains(e.target)) {
          links.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
    }
  }
}

// Global initialization
document.addEventListener("DOMContentLoaded", () => {
  App.initNavigation();

  // Highlight active nav item
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(link => {
    const href = link.getAttribute("href");
    if (href && href.split("?")[0] === currentPage) {
      link.classList.add("active");
    }
  });
});
