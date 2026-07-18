/* BNDR app core — extracted from the v1 build, hardened, extended. */
(function () {
  /* Draft bootstrap — dashboard previews only ever run with ?draft=1. */
  function bndrDeepMerge(t, s) {
    if (!t || !s) return t;
    Object.keys(s).forEach(function (k) {
      var sv = s[k];
      if (
        sv && typeof sv === "object" && !Array.isArray(sv) &&
        t[k] && typeof t[k] === "object" && !Array.isArray(t[k])
      )
        bndrDeepMerge(t[k], sv);
      else t[k] = sv;
    });
    return t;
  }
  try {
    if (/[?&]draft=1/.test(window.location.search)) {
      var bndrDraft = JSON.parse(
        window.localStorage.getItem("bndr:draft") || "null",
      );
      if (bndrDraft && window.BNDR_CONTENT) {
        bndrDeepMerge(window.BNDR_CONTENT, bndrDraft);
        window.__BNDR_DRAFT = true;
      }
    }
  } catch (e) {}


      const AppState = (window.BNDRAppState = {
        ready: false,
        goalScrollProgress: 0,
        currentScrollProgress: 0,
        isScrolling: false,
        currentPath: "/home",
      });

      const SurfaceController = {
        activeSurface: null,
        lastFocus: null,
        savedScrollY: 0,
        setup() {
          document
            .querySelectorAll(".modal-close, .modal-overlay")
            .forEach((el) => {
              el.addEventListener("click", (e) => {
                if (
                  e.target === el ||
                  e.currentTarget.classList.contains("modal-close")
                ) {
                  this.close();
                }
              });
            });
          document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && this.activeSurface) this.close();
          });
        },
        open(surfaceId, triggerBtn) {
          if (this.activeSurface) this.close();
          this.activeSurface = document.getElementById(surfaceId);
          if (!this.activeSurface) return;

          this.lastFocus = triggerBtn || document.activeElement;
          if (triggerBtn && triggerBtn.setAttribute)
            triggerBtn.setAttribute("aria-expanded", "true");

          this.savedScrollY = window.scrollY;

          const activeLayer =
            document.querySelector('.page-layer[style*="display: block"]') ||
            document.getElementById("home-layer");

          if (activeLayer) {
            activeLayer.style.position = "fixed";
            activeLayer.style.width = "100%";
            activeLayer.style.top = `-${this.savedScrollY}px`;
            activeLayer.style.touchAction = "none";
          }

          this.activeSurface.classList.add("active");
          document.body.style.overflow = "hidden";

          flashUI();
          const firstFocusable = this.activeSurface.querySelector(
            "button, input, textarea, a",
          );
          if (firstFocusable) {
            setTimeout(() => firstFocusable.focus(), 50);
          }
        },
        close() {
          if (!this.activeSurface) return;
          this.activeSurface.classList.remove("active");
          document.body.style.overflow = "";

          const activeLayer =
            document.querySelector('.page-layer[style*="display: block"]') ||
            document.getElementById("home-layer");
          if (activeLayer) {
            activeLayer.style.position = "";
            activeLayer.style.width = "";
            activeLayer.style.top = "";
            activeLayer.style.touchAction = "";
          }
          window.scrollTo(0, this.savedScrollY);

          if (this.lastFocus && this.lastFocus.setAttribute) {
            this.lastFocus.setAttribute("aria-expanded", "false");
            this.lastFocus.focus();
          }

          if (this.activeSurface.id === "preview-modal") {
            const frame = document.getElementById("preview-frame");
            const modal = this.activeSurface;
            modal.addEventListener(
              "transitionend",
              function handler(e) {
                if (
                  e.propertyName === "opacity" &&
                  !modal.classList.contains("active")
                ) {
                  frame.src = "";
                  modal.removeEventListener("transitionend", handler);
                }
              },
              { once: true },
            );
          }
          this.activeSurface = null;
        },
      };

      const galleryCategories =
        (window.BNDR_CONTENT &&
          window.BNDR_CONTENT.gallery &&
          window.BNDR_CONTENT.gallery.categories) ||
        [];

      function renderGalleryItems() {
        var container = document.getElementById("clinical-gallery-container");
        if (!container) return;
        container.innerHTML = "";
        var globalIndex = 1;
        var blocks = [];

        galleryCategories.forEach(function (category, ci) {
          var block = document.createElement("div");
          block.className = "gallery-block";
          block.dataset.cat = String(ci);

          var headerBlock = document.createElement("div");
          headerBlock.className = "section-header";
          headerBlock.style.marginTop = "48px";
          headerBlock.style.marginBottom = "24px";
          var badge = document.createElement("div");
          badge.className = "section-badge";
          badge.style.background = "rgba(2,2,2,0.03)";
          badge.style.borderColor = "rgba(2,2,2,0.05)";
          badge.textContent = category.title;
          headerBlock.appendChild(badge);
          block.appendChild(headerBlock);

          var grid = document.createElement("div");
          grid.className = "gallery-grid";
          (category.items || []).forEach(function (project) {
            var numStr = (globalIndex++).toString().padStart(3, "0");
            var a = document.createElement("a");
            a.href = project.url;
            a.className = "gallery-card gallery-preview-trigger";
            var meta = document.createElement("div");
            var metaTop = document.createElement("div");
            metaTop.className = "gallery-card-meta";
            metaTop.textContent = "IDX_" + numStr + " // PREVIEW";
            var h = document.createElement("h2");
            h.className = "gallery-title";
            h.textContent = project.name;
            meta.appendChild(metaTop);
            meta.appendChild(h);
            var arrow = document.createElement("div");
            arrow.className = "gallery-card-arrow";
            arrow.textContent = "[ VIEW ]";
            a.appendChild(meta);
            a.appendChild(arrow);
            grid.appendChild(a);
          });
          block.appendChild(grid);
          container.appendChild(block);
          blocks.push(block);
        });

        /* Category filter chips. */
        var chipsWrap = document.getElementById("gallery-filters");
        if (chipsWrap) {
          chipsWrap.innerHTML = "";
          var chips = [];
          var mkChip = function (label, key) {
            var b = document.createElement("button");
            b.type = "button";
            b.className = "filter-chip";
            b.textContent = label;
            b.dataset.filter = key;
            chipsWrap.appendChild(b);
            chips.push(b);
            return b;
          };
          mkChip("All", "*");
          galleryCategories.forEach(function (c, ci) {
            mkChip(c.title, String(ci));
          });
          var setFilter = function (key) {
            chips.forEach(function (c) {
              c.classList.toggle("is-active", c.dataset.filter === key);
            });
            blocks.forEach(function (b) {
              b.classList.toggle(
                "is-filtered-out",
                key !== "*" && b.dataset.cat !== key,
              );
            });
            if (typeof flashUI === "function") flashUI();
          };
          chips.forEach(function (c) {
            c.addEventListener("click", function () {
              setFilter(c.dataset.filter);
            });
          });
          setFilter("*");
        }

        /* Live hover preview dock (desktop, fine pointers only). */
        var dock = document.getElementById("preview-dock");
        var dockFrame = dock ? dock.querySelector("iframe") : null;
        var dockLabel = dock ? dock.querySelector(".dock-label") : null;
        var dockStatus = dock ? dock.querySelector(".dock-status") : null;
        var dockOk = !!(
          dock &&
          dockFrame &&
          window.matchMedia &&
          window.matchMedia("(pointer: fine)").matches &&
          window.innerWidth > 1100
        );
        var hoverTimer = null;
        var hideTimer = null;
        var dockToken = 0;

        function dockShow(name, url) {
          if (!dockOk) return;
          var token = ++dockToken;
          if (dockLabel) dockLabel.textContent = name;
          if (dockStatus) dockStatus.textContent = "LOADING\u2026";
          dock.classList.add("is-live");
          dock.setAttribute("aria-hidden", "false");
          dockFrame.onload = function () {
            if (token === dockToken && dockStatus)
              dockStatus.textContent = "LIVE";
          };
          dockFrame.src = url;
          setTimeout(function () {
            if (
              token === dockToken &&
              dockStatus &&
              dockStatus.textContent === "LOADING\u2026"
            )
              dockStatus.textContent = "CLICK CARD TO OPEN";
          }, 7000);
        }
        function dockHide() {
          if (!dockOk) return;
          dockToken++;
          dock.classList.remove("is-live");
          dock.setAttribute("aria-hidden", "true");
          setTimeout(function () {
            if (!dock.classList.contains("is-live"))
              dockFrame.src = "about:blank";
          }, 400);
        }

        document
          .querySelectorAll(".gallery-preview-trigger")
          .forEach(function (link) {
            link.addEventListener("click", function (e) {
              e.preventDefault();
              dockHide();
              var titleEl = link.querySelector("h2.gallery-title");
              var name = titleEl ? titleEl.textContent : "Preview";
              var pt = document.getElementById("preview-title");
              if (pt) pt.textContent = name;
              var pf = document.getElementById("preview-frame");
              if (pf) pf.src = link.href;
              var ext = document.getElementById("preview-external-link");
              if (ext) ext.href = link.href;
              SurfaceController.open("preview-modal", link);
            });
            if (dockOk) {
              link.addEventListener("mouseenter", function () {
                clearTimeout(hoverTimer);
                clearTimeout(hideTimer);
                var titleEl = link.querySelector("h2.gallery-title");
                var name = titleEl ? titleEl.textContent : "Preview";
                hoverTimer = setTimeout(function () {
                  dockShow(name, link.href);
                }, 300);
              });
              link.addEventListener("mouseleave", function () {
                clearTimeout(hoverTimer);
                hideTimer = setTimeout(dockHide, 350);
              });
            }
          });
      }

      function setupRouting() {
        const layers = {
          "/home": document.getElementById("home-layer"),
          "/gallery": document.getElementById("gallery-layer"),
          "/art": document.getElementById("art-layer"),
          "/about": document.getElementById("about-layer"),
          "/faq": document.getElementById("faq-layer"),
          "/pricing": document.getElementById("pricing-layer"),
        };
        const webgl = document.getElementById("webgl-container");

        function navigateTo(path, push = true) {
          if (!layers[path]) path = "/home";
          AppState.currentPath = path;

          Object.values(layers).forEach((layer) => {
            if (layer) layer.style.display = "none";
          });
          if (layers[path]) layers[path].style.display = "block";

          if (webgl) {
            webgl.style.opacity = path === "/home" ? "1" : "0.05";
          }

          const dragHint = document.getElementById("drag-hint");
          if (dragHint) {
            if (
              path !== "/home" ||
              window.scrollY > 10 ||
              document.body.classList.contains("is-dragging-3d")
            ) {
              dragHint.classList.add("is-hidden");
            } else {
              dragHint.classList.remove("is-hidden");
            }
          }

          window.scrollTo(0, 0);

          if (push) {
            try {
              history.pushState(
                { path: path },
                "",
                path === "/home" ? "/" : "/#" + path.slice(1),
              );
            } catch (error) {
              console.warn(
                "history.pushState blocked by restricted iframe environment. State updated internally.",
                error,
              );
            }
          }
        }

        document.querySelectorAll(".route-btn").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            navigateTo(btn.getAttribute("data-route"));
          });
        });

        window.addEventListener("popstate", (e) => {
          if (e.state && e.state.path) {
            navigateTo(e.state.path, false);
          } else {
            navigateTo("/home", false);
          }
        });

        function getRouteFromLocation() {
          const hash = window.location.hash.replace("#", "").trim();

          if (hash) {
            return "/" + hash.replace(/^\/+/, "");
          }

          return "/home";
        }

        const loadRoute = () => navigateTo(getRouteFromLocation(), false);

        loadRoute();
        setTimeout(loadRoute, 50);

        window.addEventListener("hashchange", loadRoute);
      }

      function applyTextStagger(selector) {
        const el = document.querySelector(selector);
        if (!el) return;
        if (el.querySelector(".dot")) return;
        const words = el.innerText.split(" ");
        el.innerHTML = "";
        words.forEach((word, index) => {
          const wrap = document.createElement("span");
          wrap.className = "word-wrap";
          const inner = document.createElement("span");
          inner.className = "word-inner";
          inner.innerText = word + " ";
          inner.style.transitionDelay = `${index * 0.04}s`;
          wrap.appendChild(inner);
          el.appendChild(wrap);
        });
      }

      document.addEventListener("DOMContentLoaded", () => {
        applyTextStagger("#hero-desc");
        applyTextStagger("#work-lead");
        renderGalleryItems();
        setupRouting();

        document.querySelectorAll('[data-open="external"]').forEach((el) => {
          el.addEventListener("click", (e) => {
            if (el.classList.contains("gallery-preview-trigger")) return;
            e.preventDefault();
            window.open(el.href, "_blank", "noopener,noreferrer");
          });
        });

        const navPill = document.getElementById("main-nav");
        const mobileToggle = document.getElementById("mobile-nav-toggle");

        if (mobileToggle && navPill) {
          mobileToggle.addEventListener("click", () => {
            navPill.classList.toggle("is-open");
            mobileToggle.setAttribute(
              "aria-expanded",
              navPill.classList.contains("is-open"),
            );
          });

          navPill
            .querySelectorAll(".route-btn, #nav-contact-btn")
            .forEach((btn) => {
              btn.addEventListener("click", () => {
                navPill.classList.remove("is-open");
                mobileToggle.setAttribute("aria-expanded", "false");
              });
            });
        }
      });

      function bootloader() {
        if (AppState.ready) return;
        AppState.ready = true;
        runEntranceAnimation();
        setupDOM();
        const initWebGL = () => {
          const reduce =
            window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          const fallback = () => {
            if (window.BNDRScene) window.BNDRScene.fallback();
          };
          if (reduce || window.__THREE_FAILED) {
            fallback();
            return;
          }
          if (typeof THREE !== "undefined") {
            if (window.BNDRScene) window.BNDRScene.init();
            return;
          }
          let tries = 0;
          const poll = setInterval(() => {
            if (typeof THREE !== "undefined") {
              clearInterval(poll);
              if (window.BNDRScene) window.BNDRScene.init();
            } else if (++tries > 50 || window.__THREE_FAILED) {
              clearInterval(poll);
              fallback();
            }
          }, 100);
        };

        if ("requestIdleCallback" in window) {
          requestIdleCallback(initWebGL, { timeout: 2000 });
        } else {
          setTimeout(initWebGL, 300);
        }
      }

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootloader);
      } else {
        bootloader();
      }

      function setupDOM() {
        const observerOptions = {
          root: null,
          rootMargin: "0px",
          threshold: 0.15,
        };
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        }, observerOptions);
        document
          .querySelectorAll(".io-element")
          .forEach((el) => observer.observe(el));

        SurfaceController.setup();

        document
          .getElementById("nav-contact-btn")
          .addEventListener("click", function () {
            SurfaceController.open("contact-modal", this);
          });
        document.querySelectorAll(".connect-section-trigger").forEach((btn) =>
          btn.addEventListener("click", function () {
            SurfaceController.open("contact-modal", this);
          }),
        );

        const floatBtn = document.getElementById("floating-contact-btn");
        const contactFooter = document.getElementById("bndr-core-footer");

        if (floatBtn && contactFooter) {
          const footerObserver = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  floatBtn.classList.add("is-active");
                } else {
                  floatBtn.classList.remove("is-active");
                }
              });
            },
            { threshold: 0.05, rootMargin: "0px 0px 50px 0px" },
          );
          footerObserver.observe(contactFooter);

          floatBtn.addEventListener("click", function () {
            SurfaceController.open("contact-modal", this);
          });
        }

        let isFormSubmitted = false;
        const contactForm = document.getElementById("contact-form");
        const hiddenIframe = document.getElementById("formsubmit_target");

        if (contactForm && hiddenIframe) {
          contactForm.addEventListener("submit", () => {
            isFormSubmitted = true;
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = "Sending...";
            btn.disabled = true;

            hiddenIframe.onload = function () {
              if (isFormSubmitted) {
                btn.textContent = "Request Sent";
                btn.style.backgroundColor = "var(--bone)";
                btn.style.color = "var(--charcoal)";
                setTimeout(() => {
                  SurfaceController.close();
                  setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.backgroundColor = "";
                    btn.style.color = "";
                    btn.disabled = false;
                    contactForm.reset();
                    isFormSubmitted = false;
                  }, 600);
                }, 1200);
              }
            };
          });
        }

        const nav = document.getElementById("main-nav");
        let lastScroll = 0;
        let scrollEndTimer = null;

        let cachedMaxScroll = Math.max(
          1,
          document.body.scrollHeight - window.innerHeight,
        );
        window.addEventListener(
          "resize",
          () => {
            cachedMaxScroll = Math.max(
              1,
              document.body.scrollHeight - window.innerHeight,
            );
          },
          { passive: true },
        );

        window.addEventListener(
          "scroll",
          () => {
            AppState.isScrolling = true;
            clearTimeout(scrollEndTimer);
            scrollEndTimer = setTimeout(() => {
              AppState.isScrolling = false;
            }, 150);

            const currentScroll = window.scrollY;
            if (currentScroll > 150 && currentScroll > lastScroll) {
              nav.classList.add("hidden");
            } else {
              nav.classList.remove("hidden");
            }
            lastScroll = currentScroll;

            const dragHint = document.getElementById("drag-hint");
            if (dragHint) {
              if (
                currentScroll > 10 ||
                AppState.currentPath !== "/home" ||
                document.body.classList.contains("is-dragging-3d")
              ) {
                dragHint.classList.add("is-hidden");
              } else {
                dragHint.classList.remove("is-hidden");
              }
            }

            AppState.goalScrollProgress = Math.min(
              1,
              Math.max(0, currentScroll / cachedMaxScroll),
            );
          },
          { passive: true },
        );
      }

      function flashUI() {
        const flash = document.getElementById("ui-flash");
        if (!flash) return;
        flash.style.opacity = "1";
        flash.style.transition = "none";
        requestAnimationFrame(() => {
          flash.style.transition =
            "opacity 0.4s cubic-bezier(0.19, 1, 0.22, 1)";
          flash.style.opacity = "0";
        });
      }

      function runEntranceAnimation() {
        document.body.style.opacity = "1";
        setTimeout(() => {
          const heroContent = document.querySelector(".hero-content");
          if (heroContent) heroContent.classList.add("is-visible");
        }, 500);
        setTimeout(() => {
          const mainNav = document.querySelector("#main-nav");
          if (mainNav) mainNav.classList.add("is-loaded");
        }, 800);
        const webgl = document.getElementById("webgl-container");
        if (webgl) {
          webgl.style.transition = "opacity 2.5s cubic-bezier(0.16, 1, 0.3, 1)";
          webgl.style.opacity = AppState.currentPath === "/home" ? "1" : "0.05";
        }
      }

      

      /* ============================================================
         BNDR v2 addons — content hydration, proof counters, audio
         feedback, live clock, modal focus trap, image fail-safes.
         All additive. All guarded. Nothing here can take the site down.
         ============================================================ */

      function bndrGetByPath(obj, path) {
        try {
          return path.split(".").reduce(function (a, k) {
            return a == null ? undefined : a[k];
          }, obj);
        } catch (e) {
          return undefined;
        }
      }

      function bndrHydrate() {
        var C = window.BNDR_CONTENT;
        if (!C) return;
        if (C.edited !== true && window.__BNDR_DRAFT !== true) return;
        try {
          var hd = document.getElementById("hero-desc");
          if (hd && C.hero && typeof C.hero.desc === "string" && C.hero.desc)
            hd.textContent = C.hero.desc;
          document.querySelectorAll("[data-bndr]").forEach(function (el) {
            var v = bndrGetByPath(C, el.getAttribute("data-bndr"));
            if (typeof v !== "string" || !v.length) return;
            if (v.indexOf("<br") !== -1) {
              el.innerHTML = v.replace(/<(?!br\s*\/?\s*>)[^>]*>/gi, "");
            } else {
              el.textContent = v;
            }
          });
          if (C.pricing && Array.isArray(C.pricing.tiers)) {
            var titles = document.querySelectorAll(
              ".pricing-card-mini .pricing-title",
            );
            var prices = document.querySelectorAll(
              ".pricing-card-mini .price-tag",
            );
            C.pricing.tiers.forEach(function (t, i) {
              if (t && titles[i] && typeof t.title === "string" && t.title)
                titles[i].textContent = t.title;
              if (t && prices[i] && typeof t.price === "string" && t.price)
                prices[i].textContent = t.price;
            });
          }
          if (Array.isArray(C.faq)) {
            document.querySelectorAll(".faq-item").forEach(function (item, i) {
              var f = C.faq[i];
              if (!f) return;
              var q = item.querySelector(".faq-title");
              var a = item.querySelector("p");
              if (q && typeof f.q === "string" && f.q) q.textContent = f.q;
              if (a && typeof f.a === "string" && f.a) a.textContent = f.a;
            });
          }
          document
            .querySelectorAll(".proof-value[data-bndr]")
            .forEach(function (el) {
              var txt = el.textContent || "";
              var num = parseFloat(txt.replace(/[^0-9.]/g, ""));
              if (!isNaN(num)) el.setAttribute("data-count", String(num));
              var m = txt.match(/^([^0-9]*)[0-9.,\s]*[0-9](.*)$/);
              if (m) {
                el.setAttribute("data-prefix", m[1]);
                el.setAttribute("data-suffix", m[2]);
              }
            });
        } catch (e) {
          console.warn("BNDR hydrate skipped:", e);
        }
      }
      bndrHydrate();

      /* Proof counters — numbers count up when they enter the viewport. */
      (function () {
        var els = document.querySelectorAll(".proof-value[data-count]");
        if (!els.length) return;
        var reduce =
          window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        function finish(el, target, prefix, suffix, dec) {
          el.textContent = prefix + target.toFixed(dec) + suffix;
        }
        function run(el) {
          var raw = el.getAttribute("data-count");
          var target = parseFloat(raw);
          if (isNaN(target)) return;
          var prefix = el.getAttribute("data-prefix") || "";
          var suffix = el.getAttribute("data-suffix") || "";
          var dec = (raw.split(".")[1] || "").length;
          if (reduce) return finish(el, target, prefix, suffix, dec);
          var t0 = null;
          var dur = 1400;
          function step(ts) {
            if (!t0) t0 = ts;
            var p = Math.min(1, (ts - t0) / dur);
            var e = 1 - Math.pow(2, -10 * p);
            el.textContent = prefix + (target * e).toFixed(dec) + suffix;
            if (p < 1) requestAnimationFrame(step);
            else finish(el, target, prefix, suffix, dec);
          }
          requestAnimationFrame(step);
        }
        try {
          var io = new IntersectionObserver(
            function (entries) {
              entries.forEach(function (en) {
                if (en.isIntersecting) {
                  run(en.target);
                  io.unobserve(en.target);
                }
              });
            },
            { threshold: 0.4 },
          );
          els.forEach(function (el) {
            io.observe(el);
          });
        } catch (e) {
          els.forEach(run);
        }
      })();

      /* Audio feedback — the site answers back. Tiny, tasteful, optional. */
      var BNDRSnd = (function () {
        var KEY = "bndr:snd";
        var enabled = true;
        var unlocked = false;
        var ctx = null;
        try {
          enabled = window.localStorage.getItem(KEY) !== "off";
        } catch (e) {}
        function ensure() {
          if (ctx) return ctx;
          try {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (AC) ctx = new AC();
          } catch (e) {
            ctx = null;
          }
          return ctx;
        }
        function tone(freq, dur, gain, type, delay) {
          if (!enabled || !unlocked) return;
          try {
            var c = ensure();
            if (!c) return;
            if (c.state === "suspended") c.resume();
            var t = c.currentTime + (delay || 0);
            var o = c.createOscillator();
            var g = c.createGain();
            o.type = type || "square";
            o.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(gain || 0.015, t + 0.006);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g);
            g.connect(c.destination);
            o.start(t);
            o.stop(t + dur + 0.03);
          } catch (e) {}
        }
        function unlock() {
          unlocked = true;
          ensure();
        }
        window.addEventListener("pointerdown", unlock, {
          once: true,
          passive: true,
        });
        window.addEventListener("keydown", unlock, { once: true });
        return {
          tick: function () {
            tone(2600, 0.03, 0.01);
          },
          route: function () {
            tone(1250, 0.05, 0.016);
            tone(1900, 0.06, 0.014, "square", 0.055);
          },
          send: function () {
            tone(880, 0.07, 0.02, "sine");
            tone(1320, 0.08, 0.02, "sine", 0.09);
            tone(1760, 0.1, 0.02, "sine", 0.18);
          },
          isOn: function () {
            return enabled;
          },
          setOn: function (v) {
            enabled = !!v;
            try {
              window.localStorage.setItem(KEY, enabled ? "on" : "off");
            } catch (e) {}
            if (enabled) {
              unlocked = true;
              this.route();
            }
          },
        };
      })();

      (function () {
        var fine =
          window.matchMedia && window.matchMedia("(pointer: fine)").matches;
        var lastTick = 0;
        if (fine) {
          document.addEventListener(
            "mouseover",
            function (e) {
              var t =
                e.target &&
                e.target.closest &&
                e.target.closest(
                  ".route-btn, .btn-primary, .gallery-card, .filter-chip, .f-util, #nav-contact-btn",
                );
              if (!t) return;
              var now = Date.now();
              if (now - lastTick < 90) return;
              lastTick = now;
              BNDRSnd.tick();
            },
            { passive: true },
          );
        }
        document.addEventListener("click", function (e) {
          if (
            e.target &&
            e.target.closest &&
            e.target.closest(".route-btn, #brand-mark")
          )
            BNDRSnd.route();
        });
        var form = document.getElementById("contact-form");
        if (form)
          form.addEventListener("submit", function () {
            BNDRSnd.send();
          });        var btn = document.getElementById("snd-toggle");
        if (btn) {
          var paint = function () {
            btn.textContent = BNDRSnd.isOn() ? "SND ON" : "SND OFF";
            btn.setAttribute("aria-pressed", BNDRSnd.isOn() ? "true" : "false");
          };
          paint();
          btn.addEventListener("click", function () {
            BNDRSnd.setOn(!BNDRSnd.isOn());
            paint();
          });
        }
      })();

      /* Live Phoenix clock in the footer. */
      (function () {
        var el = document.getElementById("f-time");
        if (!el) return;
        var fmt = null;
        try {
          fmt = new Intl.DateTimeFormat("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
            timeZone: "America/Phoenix",
          });
        } catch (e) {}
        function tick() {
          try {
            el.textContent =
              (fmt ? fmt.format(new Date()) : new Date().toLocaleTimeString()) +
              " PHX";
          } catch (e) {}
        }
        tick();
        setInterval(tick, 1000);
      })();

      /* Focus trap while a modal surface is open. */
      document.addEventListener("keydown", function (e) {
        if (e.key !== "Tab") return;
        var s = SurfaceController && SurfaceController.activeSurface;
        if (!s) return;
        var items = s.querySelectorAll(
          'button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
        );
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      });

      /* Image fail-safes — the brand never disappears. */
      (function () {
        function guard(img, cls) {
          if (!img) return;
          var swap = function () {
            var s = document.createElement("span");
            s.className = cls;
            s.textContent = "BNDR\u2122";
            img.replaceWith(s);
          };
          if (img.complete && img.naturalWidth === 0) swap();
          else img.addEventListener("error", swap, { once: true });
        }
        guard(document.querySelector(".hero-logo-img"), "logo-text-fallback");
        guard(document.getElementById("brand-logo-img"), "brand-text-fallback");
        var banner = document.querySelector("#about-layer img");
        if (banner)
          banner.addEventListener(
            "error",
            function () {
              banner.style.display = "none";
            },
            { once: true },
          );
      })();

      /* Park the live preview dock when the route changes. */
      window.addEventListener("hashchange", function () {
        var d = document.getElementById("preview-dock");
        if (d && d.classList.contains("is-live")) {
          d.classList.remove("is-live");
          var f = d.querySelector("iframe");
          if (f) f.src = "about:blank";
        }
      });

})();
