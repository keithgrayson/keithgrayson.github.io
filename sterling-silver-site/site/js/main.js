/* =========================================================
   MAIN.JS
   Shared chrome rendering + small interactive behaviors.
   No frameworks, no build step — safe to drop into any
   static host including GitHub Pages.
   ========================================================= */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    renderMasthead();
    renderNav();
    renderPromo();
    renderFooter();
    initNavInteractions();

    // Page-specific hooks (each page tells main.js what it wants rendered)
    if (window.PAGE_INIT && typeof window.PAGE_INIT === "function") {
      window.PAGE_INIT();
    }
  });

  // ---------------------------------------------------------------
  // Chrome: masthead / nav / promo / footer
  // ---------------------------------------------------------------

  function renderMasthead() {
    var el = document.getElementById("site-masthead");
    if (!el || !window.SITE) return;

    el.innerHTML =
      '<div class="container">' +
        '<div class="site-id">' +
          '<span class="site-id__mark"><a href="index.html">' + escapeHtml(SITE.siteName) + '</a></span>' +
          '<span class="site-id__tag">' + escapeHtml(SITE.tagline) + '</span>' +
        '</div>' +
        '<div class="masthead__affiliate">' +
          '<a href="' + escapeAttr(SITE.affiliate.url) + '" target="_blank" rel="noopener noreferrer">' +
            escapeHtml(SITE.affiliate.text) +
          '</a>' +
        '</div>' +
      '</div>';
  }

  function renderNav() {
    var nav = document.getElementById("site-nav");
    if (!nav || !window.SITE) return;

    var currentPage = document.body.getAttribute("data-page") || "";

    var html = '<div class="container">';
    html += '<button type="button" class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="nav-list">Menu \u2630</button>';
    html += '<ul class="nav-list" id="nav-list" role="menubar">';

    SITE.nav.forEach(function (item) {
      var hasChildren = item.children && item.children.length;
      var isActive = item.id === currentPage;

      html += '<li' + (hasChildren ? ' class="has-children"' : '') + '>';

      if (hasChildren) {
        html += '<span class="nav-parent" role="button" tabindex="0" aria-haspopup="true" aria-expanded="false">' +
          escapeHtml(item.label) + '</span>';
        html += '<ul class="nav-children">';
        item.children.forEach(function (child) {
          html += '<li><a href="' + escapeAttr(child.href) + '">' + escapeHtml(child.label) + '</a></li>';
        });
        html += '</ul>';
      } else {
        html += '<a href="' + escapeAttr(item.href) + '"' + (isActive ? ' class="is-active" aria-current="page"' : '') + '>' +
          escapeHtml(item.label) + '</a>';
      }

      html += '</li>';
    });

    html += '</ul></div>';
    nav.innerHTML = html;
  }

  function renderPromo() {
    var el = document.getElementById("promo-banner");
    if (!el || !window.SITE) return;

    el.innerHTML =
      '<div class="promo__text">' +
        '<h2>' + escapeHtml(SITE.promo.heading) + '</h2>' +
        '<p>' + escapeHtml(SITE.promo.body) + '</p>' +
      '</div>' +
      '<a class="promo__cta" href="' + escapeAttr(SITE.promo.url) + '" target="_blank" rel="noopener noreferrer">' +
        escapeHtml(SITE.promo.ctaText) +
      '</a>';
  }

  function renderFooter() {
    var el = document.getElementById("site-footer");
    if (!el || !window.SITE) return;

    var year = new Date().getFullYear();

    el.innerHTML =
      '<div class="container">' +
        '<p>&copy; ' + year + ' ' + escapeHtml(SITE.footer.copyrightHolder) + '. ' + escapeHtml(SITE.footer.note) + '</p>' +
        '<p><a href="' + escapeAttr(SITE.affiliate.url) + '" target="_blank" rel="noopener noreferrer">' +
          escapeHtml(SITE.affiliate.text) + '</a></p>' +
      '</div>';
  }

  function initNavInteractions() {
    var nav = document.getElementById("site-nav");
    var toggle = document.getElementById("nav-toggle");
    if (!nav || !toggle) return;

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // touch/keyboard support for the "Services" dropdown
    var parents = nav.querySelectorAll(".nav-parent");
    parents.forEach(function (parent) {
      parent.addEventListener("click", function () {
        var li = parent.closest("li");
        var isOpen = li.classList.toggle("is-open");
        parent.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
      parent.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          parent.click();
        }
      });
    });
  }

  // ---------------------------------------------------------------
  // Item lists: paginated (full list pages) + teaser (homepage)
  // ---------------------------------------------------------------

  /**
   * Renders a paginated list of news or video items with Previous/Next
   * controls, mirroring the original site's ListView pager without
   * any server postbacks.
   */
  function renderPaginatedList(containerId, items, opts) {
    var container = document.getElementById(containerId);
    if (!container) return;

    opts = opts || {};
    var perPage = opts.perPage || 5;
    var type = opts.type || "news"; // "news" | "video"
    var page = 0;
    var totalPages = Math.max(1, Math.ceil(items.length / perPage));

    var listEl = document.createElement("ul");
    listEl.className = "item-list";

    var pagerEl = document.createElement("div");
    pagerEl.className = "pager";
    pagerEl.innerHTML =
      '<button type="button" data-dir="prev">Previous</button>' +
      '<span class="pager__status"></span>' +
      '<button type="button" data-dir="next">Next</button>';

    container.appendChild(listEl);
    container.appendChild(pagerEl);

    var prevBtn = pagerEl.querySelector('[data-dir="prev"]');
    var nextBtn = pagerEl.querySelector('[data-dir="next"]');
    var statusEl = pagerEl.querySelector(".pager__status");

    prevBtn.addEventListener("click", function () { goTo(page - 1); });
    nextBtn.addEventListener("click", function () { goTo(page + 1); });

    function goTo(newPage) {
      page = Math.min(Math.max(newPage, 0), totalPages - 1);
      render();
      container.scrollIntoView({ block: "nearest" });
    }

    function render() {
      var start = page * perPage;
      var pageItems = items.slice(start, start + perPage);

      listEl.innerHTML = pageItems.map(function (item) {
        return type === "video" ? videoItemHtml(item) : newsItemHtml(item);
      }).join("");

      statusEl.textContent = "Page " + (page + 1) + " of " + totalPages;
      prevBtn.disabled = page === 0;
      nextBtn.disabled = page >= totalPages - 1;
    }

    render();
  }

  /**
   * Renders a short, non-paginated teaser (used on the homepage) with
   * a "see more" link to the full list page.
   */
  function renderTeaserList(containerId, items, count, type) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var listEl = document.createElement("ul");
    listEl.className = "item-list";
    listEl.innerHTML = items.slice(0, count).map(function (item) {
      return type === "video" ? videoItemHtml(item) : newsItemHtml(item);
    }).join("");

    container.appendChild(listEl);
  }

  function newsItemHtml(item) {
    return (
      '<li>' +
        '<div class="item-body">' +
          '<h3><a href="' + escapeAttr(item.url) + '" target="_blank" rel="noopener noreferrer">' +
            escapeHtml(item.title) + '</a></h3>' +
          '<p>' + escapeHtml(item.excerpt) + '</p>' +
          '<p class="item-continued"><a href="' + escapeAttr(item.url) + '" target="_blank" rel="noopener noreferrer">continued..</a></p>' +
        '</div>' +
      '</li>'
    );
  }

  function videoItemHtml(item) {
    var watchUrl = "https://www.youtube.com/watch?v=" + encodeURIComponent(item.videoId);
    var thumbUrl = "https://img.youtube.com/vi/" + encodeURIComponent(item.videoId) + "/hqdefault.jpg";

    return (
      '<li>' +
        '<a class="item-thumb" href="' + escapeAttr(watchUrl) + '" target="_blank" rel="noopener noreferrer" aria-hidden="true" tabindex="-1">' +
          '<img src="' + escapeAttr(thumbUrl) + '" alt="" loading="lazy">' +
        '</a>' +
        '<div class="item-body">' +
          '<h3><a href="' + escapeAttr(watchUrl) + '" target="_blank" rel="noopener noreferrer">' +
            escapeHtml(item.title) + '</a></h3>' +
          '<p>' + escapeHtml(item.excerpt) + '</p>' +
          '<p class="item-continued"><a href="' + escapeAttr(watchUrl) + '" target="_blank" rel="noopener noreferrer">continued..</a></p>' +
        '</div>' +
      '</li>'
    );
  }

  // ---------------------------------------------------------------
  // utils
  // ---------------------------------------------------------------

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, "&quot;");
  }

  // expose the list renderers for page-specific scripts
  window.renderPaginatedList = renderPaginatedList;
  window.renderTeaserList = renderTeaserList;
})();
