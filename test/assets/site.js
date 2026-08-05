/* ---------------------------------------------------------
   Cowboys of Cloud 9 - shared site behavior
   Plain HTML/CSS/JS, no build step, no Jekyll dependency.
   Include on every page as: <script src="assets/site.js" defer></script>
--------------------------------------------------------- */

(function () {
  "use strict";

  // ---------- Partial include helper ----------
  // Looks for elements like <div data-include="partials/nav.html"></div>
  // and replaces them with the fetched HTML.
  function loadIncludes() {
    const targets = document.querySelectorAll("[data-include]");
    const jobs = Array.from(targets).map((el) => {
      const src = el.getAttribute("data-include");
      return fetch(src)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load " + src);
          return res.text();
        })
        .then((html) => {
          el.outerHTML = html;
        })
        .catch((err) => {
          console.error(err);
        });
    });
    return Promise.all(jobs);
  }

  // ---------- Nav active-state highlighting ----------
  function highlightNav() {
    const current = (location.pathname.split("/").pop() || "index.html");
    document.querySelectorAll(".nav-link").forEach((link) => {
      if (link.getAttribute("data-page") === current) {
        link.classList.add("active");
      }
    });
  }

  // ---------- Mobile nav dropdown toggle ----------
  function initNavToggle() {
    const toggle = document.getElementById("nav-toggle");
    const menu = document.getElementById("nav-menu");
    if (!toggle || !menu) return;

    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    menu.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && !toggle.contains(e.target)) {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // ---------- Landing page: trail scroll-reveal + fill ----------
  function initTrail() {
    const trailWrap = document.querySelector(".trail-wrap");
    if (!trailWrap) return;

    const chapters = document.querySelectorAll(".chapter");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("in-view");
        });
      },
      { threshold: 0.2 }
    );
    chapters.forEach((c) => io.observe(c));

    const trailLine = document.getElementById("trailLine");
    if (!trailLine) return;

    function updateTrail() {
      const rect = trailWrap.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const total = rect.height;
      const scrolled = Math.min(Math.max(viewportH - rect.top, 0), total);
      const pct = total > 0 ? (scrolled / total) * 100 : 0;
      trailLine.style.setProperty("--trail-progress", pct + "%");
    }
    window.addEventListener("scroll", updateTrail, { passive: true });
    window.addEventListener("resize", updateTrail);
    updateTrail();
  }

  // ---------- Album pages: single shared playlist player ----------
  function initPlayer() {
    const rows = document.querySelectorAll(".track-row");
    const bar = document.getElementById("player-bar");
    if (!rows.length || !bar) return;

    const tracks = Array.from(rows).map((row) => ({
      row,
      title: row.getAttribute("data-title") || "Untitled",
      src: row.getAttribute("data-src"),
      lenEl: row.querySelector(".t-len"),
      btn: row.querySelector(".play-btn"),
    }));

    const audio = new Audio();
    let currentIndex = -1;

    const titleEl = bar.querySelector(".pb-title");
    const toggleBtn = bar.querySelector(".pb-toggle");
    const prevBtn = bar.querySelector(".pb-prev");
    const nextBtn = bar.querySelector(".pb-next");
    const closeBtn = bar.querySelector(".pb-close");
    const seek = bar.querySelector(".pb-seek");
    const timeEl = bar.querySelector(".pb-time");

    function formatTime(sec) {
      if (!isFinite(sec) || sec < 0) return "0:00";
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60)
        .toString()
        .padStart(2, "0");
      return m + ":" + s;
    }

    // Preload metadata for every track up front so durations show
    // consistently before anything has been played (fixes the
    // "some rows show length, some don't" inconsistency).
    tracks.forEach((t) => {
      if (!t.src || !t.lenEl) return;
      const probe = new Audio();
      probe.preload = "metadata";
      probe.src = t.src;
      probe.addEventListener("loadedmetadata", () => {
        t.lenEl.textContent = formatTime(probe.duration);
      });
      probe.addEventListener("error", () => {
        t.lenEl.textContent = "";
      });
    });

    function setActiveRow(index) {
      tracks.forEach((t, i) => {
        t.row.classList.toggle("playing", i === index);
        if (t.btn) {
          t.btn.classList.toggle("is-playing", i === index);
          t.btn.textContent = i === index ? "\u23F8" : "\u25B6";
        }
      });
    }

    function playTrack(index) {
      if (index < 0 || index >= tracks.length) return;
      currentIndex = index;
      const t = tracks[index];
      audio.src = t.src;
      audio.play().catch((err) => console.error("Playback failed:", err));
      titleEl.textContent = t.title;
      setActiveRow(index);
      bar.classList.add("active");
      document.body.classList.add("player-active");
    }

    tracks.forEach((t, i) => {
      if (t.btn) {
        t.btn.textContent = "\u25B6";
        t.btn.addEventListener("click", () => {
          if (currentIndex === i && !audio.paused) {
            audio.pause();
          } else if (currentIndex === i && audio.paused) {
            audio.play();
          } else {
            playTrack(i);
          }
        });
      }
    });

    toggleBtn.addEventListener("click", () => {
      if (currentIndex === -1) {
        if (tracks.length) playTrack(0);
        return;
      }
      if (audio.paused) audio.play();
      else audio.pause();
    });

    prevBtn.addEventListener("click", () => {
      if (currentIndex > 0) playTrack(currentIndex - 1);
    });
    nextBtn.addEventListener("click", () => {
      if (currentIndex < tracks.length - 1) playTrack(currentIndex + 1);
    });
    closeBtn.addEventListener("click", () => {
      audio.pause();
      audio.currentTime = 0;
      bar.classList.remove("active");
      document.body.classList.remove("player-active");
      setActiveRow(-1);
      currentIndex = -1;
    });

    audio.addEventListener("play", () => {
      toggleBtn.innerHTML = "&#10074;&#10074;";
      if (currentIndex > -1 && tracks[currentIndex].btn) {
        tracks[currentIndex].btn.textContent = "\u23F8";
      }
    });
    audio.addEventListener("pause", () => {
      toggleBtn.innerHTML = "&#9658;";
      if (currentIndex > -1 && tracks[currentIndex].btn) {
        tracks[currentIndex].btn.textContent = "\u25B6";
      }
    });
    audio.addEventListener("timeupdate", () => {
      if (!audio.duration) return;
      seek.value = (audio.currentTime / audio.duration) * 100;
      timeEl.textContent =
        formatTime(audio.currentTime) + " / " + formatTime(audio.duration);
    });
    audio.addEventListener("ended", () => {
      if (currentIndex < tracks.length - 1) playTrack(currentIndex + 1);
      else closeBtn.click();
    });
    seek.addEventListener("input", () => {
      if (!audio.duration) return;
      audio.currentTime = (seek.value / 100) * audio.duration;
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadIncludes().then(() => {
      highlightNav();
      initNavToggle();
      initTrail();
      initPlayer();
    });
  });
})();
