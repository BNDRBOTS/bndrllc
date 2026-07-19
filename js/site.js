/* BNDR site runtime — rendering, vibes, galleries, purchase, motion.
   No frameworks. Content comes from js/content.js (window.BNDR_CONTENT),
   markdown renders via js/md.js, verified facts via js/facts.js.
   Draft mode: dashboard saves to localStorage; any page opened with
   ?draft=1 renders the draft instead of the shipped content. */
(function () {
  "use strict";

  var MD = window.BNDRMD;
  var FACTS = window.BNDRFACTS;

  /* ── content + draft overlay ──────────────────────────────── */
  var C = window.BNDR_CONTENT || {};
  var isDraft = /[?&]draft=1/.test(location.search);
  if (isDraft) {
    try {
      var d = localStorage.getItem("bndr.draft.v3");
      if (d) C = JSON.parse(d);
    } catch (e) { /* storage blocked — ship content renders */ }
  }
  window.BNDR_LIVE = C;

  function get(path, fallback) {
    var cur = C;
    var parts = path.split(".");
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return fallback;
      cur = cur[parts[i]];
    }
    return cur == null ? fallback : cur;
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function withDraft(href) {
    if (!isDraft) return href;
    return href + (href.indexOf("?") > -1 ? "&" : "?") + "draft=1";
  }

  /* ── data-md / data-text bindings ────────────────────────────── */
  document.querySelectorAll("[data-md]").forEach(function (n) {
    var v = get(n.getAttribute("data-md"));
    if (v != null) n.innerHTML = MD.render(v);
  });
  document.querySelectorAll("[data-text]").forEach(function (n) {
    var v = get(n.getAttribute("data-text"));
    if (v != null) n.textContent = MD.plain(v);
  });

  /* keep internal nav inside draft mode */
  if (isDraft) {
    document.querySelectorAll('a[href$=".html"], a[href^="post.html"]').forEach(function (a) {
      if (a.host === location.host) a.href = withDraft(a.getAttribute("href"));
    });
  }

  /* ── hero value chips ──────────────────────────────────────── */
  var heroVals = document.getElementById("hero-values");
  if (heroVals) {
    var hvList = get("hero.values");
    if (hvList && hvList.length) {
      heroVals.innerHTML = "";
      hvList.forEach(function (v) {
        var li = document.createElement("li");
        li.textContent = v;
        heroVals.appendChild(li);
      });
    }
  }

  /* ── nav current state ──────────────────────────────────────── */
  var here = location.pathname.split("/").pop() || "index.html";

  /* nav: console-managed when content carries nav.links */
  var navHost = document.querySelector(".nav-pill");
  var navLinks = C.nav && C.nav.links;
  if (navHost && navLinks && navLinks.length) {
    var navCta = navHost.querySelector(".nav-cta");
    navHost.innerHTML = "";
    navLinks.forEach(function (l) {
      if (!l || !l.label || !l.href) return;
      var a = document.createElement("a");
      a.href = l.href;
      a.textContent = l.label;
      navHost.appendChild(a);
    });
    if (navCta) navHost.appendChild(navCta);
  }

  /* per-page SEO overrides: console-managed when present */
  var seoPage = C.seo && C.seo.pages && C.seo.pages[here];
  if (seoPage) {
    if (seoPage.title) document.title = seoPage.title;
    if (seoPage.description) {
      var mdesc = document.querySelector('meta[name="description"]');
      if (mdesc) mdesc.setAttribute("content", seoPage.description);
    }
  }

  document.querySelectorAll(".nav-pill a").forEach(function (a) {
    var target = a.getAttribute("href").split("?")[0];
    if (target === here || (here === "post.html" && target === "blog.html")) a.setAttribute("aria-current", "page");
  });

  /* ── reveals ─────────────────────────────────────────────────── */
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function armReveals(scope) {
    var nodes = (scope || document).querySelectorAll(".io:not(.in)");
    if (reduced || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ── count-up ───────────────────────────────────────────────── */
  function armCounters() {
    var vals = document.querySelectorAll(".proof-value[data-final]");
    if (!vals.length) return;
    function run(nEl) {
      var final = nEl.getAttribute("data-final");
      var num = parseFloat(final.replace(/[^0-9.]/g, ""));
      if (reduced || isNaN(num)) { nEl.textContent = final; return; }
      var t0 = null, dur = 1100;
      var prefix = final.match(/^[^0-9]*/)[0];
      var suffix = final.replace(/^[^0-9]*[0-9.]+/, "");
      var dec = (final.match(/\.(\d+)/) || [, ""])[1].length;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 4);
        nEl.textContent = prefix + (num * eased).toFixed(dec) + suffix;
        if (p < 1) requestAnimationFrame(step); else nEl.textContent = final;
      }
      requestAnimationFrame(step);
    }
    if (!("IntersectionObserver" in window)) { vals.forEach(function (v) { v.textContent = v.getAttribute("data-final"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.4 });
    vals.forEach(function (v) { io.observe(v); });
  }

  /* ── vibe engine ────────────────────────────────────────────── */
  function setVibe(v) { document.body.setAttribute("data-vibe", v || "plasma"); }

  /* ── immersive modal ────────────────────────────────────────── */
  var imm = null, lastFocus = null;
  function immersive() {
    if (imm) return imm;
    imm = el("div", "immersive");
    imm.setAttribute("role", "dialog");
    imm.setAttribute("aria-modal", "true");
    imm.innerHTML =
      '<div class="immersive-bar">' +
      '<span class="dock-label">LIVE</span>' +
      '<span class="dock-title"></span>' +
      '<a class="imm-open" target="_blank" rel="noopener noreferrer">Open full ↗</a>' +
      '<button class="immersive-close" aria-label="Close preview">×</button>' +
      "</div>" +
      '<div class="immersive-stage"></div>';
    document.body.appendChild(imm);
    imm.querySelector(".immersive-close").addEventListener("click", closeImmersive);
    imm.addEventListener("click", function (e) { if (e.target === imm) closeImmersive(); });
    return imm;
  }
  function openImmersive(opts) {
    lastFocus = document.activeElement;
    var m = immersive();
    m.querySelector(".dock-title").textContent = opts.title || "";
    var openLink = m.querySelector(".imm-open");
    if (opts.url) { openLink.style.display = ""; openLink.href = opts.url; } else { openLink.style.display = "none"; }
    var stage = m.querySelector(".immersive-stage");
    stage.innerHTML = '<div class="stage-fallback">LOADING…</div>';
    if (opts.img) {
      var im = new Image();
      im.src = opts.img; im.alt = opts.title || "";
      im.onload = function () { stage.innerHTML = ""; stage.appendChild(im); };
      im.onerror = function () { stage.querySelector(".stage-fallback").textContent = "IMAGE UNAVAILABLE"; };
    } else if (opts.url) {
      var fr = document.createElement("iframe");
      fr.title = (opts.title || "Preview") + " — live preview";
      fr.loading = "eager";
      fr.addEventListener("load", function () { var f = stage.querySelector(".stage-fallback"); if (f) f.remove(); });
      fr.src = opts.url;
      stage.appendChild(fr);
      setTimeout(function () { var f = stage.querySelector(".stage-fallback"); if (f) f.textContent = "IF THE PREVIEW WON'T EMBED, USE “OPEN FULL” ↗"; }, 4000);
    }
    m.classList.add("open");
    document.documentElement.style.overflow = "hidden";
    m.querySelector(".immersive-close").focus();
  }
  function closeImmersive() {
    if (!imm) return;
    imm.classList.remove("open");
    imm.querySelector(".immersive-stage").innerHTML = "";
    document.documentElement.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeImmersive(); closePurchase(); }
  });

  /* ── purchase flow ───────────────────────────────────────────── */
  var purch = null;
  function purchase() {
    if (purch) return purch;
    purch = el("div", "purchase");
    purch.setAttribute("role", "dialog");
    purch.setAttribute("aria-modal", "true");
    purch.innerHTML =
      '<div class="purchase-sheet">' +
      '<div class="purchase-kicker"></div>' +
      '<h3 class="purchase-title"></h3>' +
      '<div class="purchase-price"></div>' +
      '<p class="purchase-note"></p>' +
      '<div class="purchase-actions"></div>' +
      '<button class="purchase-close">CLOSE</button>' +
      "</div>";
    document.body.appendChild(purch);
    purch.querySelector(".purchase-close").addEventListener("click", closePurchase);
    purch.addEventListener("click", function (e) { if (e.target === purch) closePurchase(); });
    return purch;
  }
  function closePurchase() { if (purch) { purch.classList.remove("open"); document.documentElement.style.overflow = ""; } }
  function openPurchase(item, kind) {
    var p = purchase();
    var email = get("meta.email", "bndr.labs@gmail.com");
    p.querySelector(".purchase-kicker").textContent = kind === "photo" ? "License this photograph" : "Own this build";
    p.querySelector(".purchase-title").textContent = item.title;
    p.querySelector(".purchase-price").textContent = item.price || "Priced per use";
    p.querySelector(".purchase-note").textContent = kind === "photo"
      ? "Full-resolution file, licensed direct from the maker. Delivered to your inbox after checkout — no stock house in the middle."
      : "You get the complete build — code and assets, owned unconditionally, same contract as every BNDR site.";
    var actions = p.querySelector(".purchase-actions");
    actions.innerHTML = "";
    if (item.paymentLink) {
      var pay = el("a", "btn btn-acc", "Checkout →");
      pay.href = item.paymentLink; pay.target = "_blank"; pay.rel = "noopener noreferrer";
      actions.appendChild(pay);
    }
    var subject = encodeURIComponent("[BNDR " + (kind === "photo" ? "PHOTO" : "APP") + "] " + item.title);
    var body = encodeURIComponent("I want to " + (kind === "photo" ? "license" : "buy") + " \"" + item.title + "\" (" + (item.price || "quote") + ").\n\nName:\nIntended use:");
    var mail = el("a", "btn " + (item.paymentLink ? "btn-ghost" : "btn-ink"), item.paymentLink ? "Order by email" : "Order by email →");
    mail.href = "mailto:" + email + "?subject=" + subject + "&body=" + body;
    actions.appendChild(mail);
    p.classList.add("open");
    document.documentElement.style.overflow = "hidden";
  }

  /* ── chips + filter ──────────────────────────────────────────── */
  function buildChips(host, cats, onPick) {
    host.innerHTML = "";
    var all = el("button", "chip", "All");
    all.setAttribute("aria-pressed", "true");
    host.appendChild(all);
    var buttons = [all];
    cats.forEach(function (c) {
      var b = el("button", "chip", c.title);
      b.setAttribute("aria-pressed", "false");
      b.dataset.cat = c.id;
      host.appendChild(b);
      buttons.push(b);
    });
    host.addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (!b) return;
      buttons.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      var cat = b.dataset.cat || null;
      var vibe = null;
      if (cat) cats.forEach(function (c) { if (c.id === cat) vibe = c.vibe; });
      setVibe(vibe);
      onPick(cat);
    });
  }

  /* ── PAGE: home ─────────────────────────────────────────────── */
  var proofGrid = document.getElementById("proof-grid");
  if (proofGrid && FACTS) {
    get("home.proofFacts", []).forEach(function (id) {
      var f = FACTS.byId(id);
      if (!f) return;
      var card = el("article", "proof-card");
      card.innerHTML =
        '<div class="proof-value" data-final="' + MD.esc(f.value) + '">' + MD.esc(f.value) + "</div>" +
        '<p class="proof-label">' + MD.esc(f.claim) + "</p>" +
        '<a class="proof-src" href="' + f.url + '" target="_blank" rel="noopener noreferrer">' + MD.esc(f.source) + " ↗</a>";
      proofGrid.appendChild(card);
    });
    armCounters();
  }

  var homeSections = document.getElementById("home-sections");
  if (homeSections) {
    get("home.sections", []).forEach(function (s, i) {
      var row = el("div", "glass-panel grid-2 io" + (i % 2 ? " d1" : ""));
      row.style.marginBottom = "16px";
      row.innerHTML =
        "<div>" + (s.badge ? "<div class=\"badge\">" + MD.esc(s.badge) + "</div>" : "") + "<h2 class=\"lead\">" + MD.esc(s.title) + "</h2></div>" +
        '<div class="prose">' + MD.render(s.bodyMd) +
        (s.link ? '<p style="margin-top:20px"><a class="btn btn-ghost" href="' + MD.esc(s.link) + '">' + MD.esc(s.linkLabel || "See more") + " →</a></p>" : "") +
        "</div>";
      homeSections.appendChild(row);
    });
  }

  var tiersHost = document.getElementById("pricing-tiers");
  if (tiersHost) {
    get("pricing.tiers", []).forEach(function (t) {
      var card = el("article", "proof-card");
      card.innerHTML = '<p class="proof-label" style="flex:0">' + MD.esc(t.title) + '</p><div class="proof-value">' + MD.esc(t.price) + "</div>";
      tiersHost.appendChild(card);
    });
  }

  var faqHost = document.getElementById("faq-list");
  if (faqHost) {
    get("faq", []).forEach(function (f) {
      var d = el("details", "item-card");
      d.style.cssText = "border:1px solid var(--line);background:var(--glass);color:var(--void);border-radius:14px;padding:16px 18px;margin-bottom:10px";
      d.innerHTML = "<summary style='font-weight:800;cursor:pointer;min-height:32px;display:flex;align-items:center'>" + MD.esc(f.q) + '</summary><div class="prose" style="margin-top:12px;font-size:15px">' + MD.render(f.aMd) + "</div>";
      faqHost.appendChild(d);
    });
  }

  /* ── PAGE: photos ────────────────────────────────────────────── */
  var photoGrid = document.getElementById("photo-grid");
  if (photoGrid) {
    var pcats = get("photos.categories", []);
    var pitems = get("photos.items", []);
    function renderPhotos(cat) {
      photoGrid.querySelectorAll(".card").forEach(function (c) {
        c.classList.toggle("is-hidden", !!cat && c.dataset.cat !== cat);
      });
    }
    pitems.forEach(function (it) {
      var catTitle = "";
      pcats.forEach(function (c) { if (c.id === it.cat) catTitle = c.title || c.name || ""; });
      var imgUrl = (it.img || it.src || "").replace(/'/g, "%27");
      var pIcon = it.icon ? '<span class="card-icon">' + MD.esc(it.icon) + "</span>" : "";
      var card = el("article", "card io");
      card.dataset.cat = it.cat;
      card.dataset.frame = it.frame || "square";
      card.innerHTML =
        '<div class="card-media" role="img" aria-label="' + MD.esc(it.title) + '"' + (imgUrl ? ' style="background-image:url(\'' + imgUrl + "')\"" : "") + "></div>" +
        '<div class="card-body">' +
        '<span class="card-kicker">' + pIcon + MD.esc(catTitle) + "</span>" +
        '<h3 class="card-title">' + MD.esc(it.title) + "</h3>" +
        '<p class="card-note">' + MD.plain(it.descMd || it.note || "") + "</p>" +
        '<div class="card-row"><span class="price-tag">' + MD.esc(it.price || "") + '</span><button class="buy-btn">License →</button></div>' +
        "</div>";
      var pMedia = card.querySelector(".card-media");
      function photoDefault() {
        pMedia.style.backgroundImage = "none";
        pMedia.classList.add("media-default");
        pMedia.innerHTML = '<span class="media-default-title">' + MD.esc(it.title) + "</span>";
      }
      if (imgUrl) {
        var pProbe = new Image();
        pProbe.onerror = photoDefault;
        pProbe.src = imgUrl;
      } else { photoDefault(); }
      pMedia.addEventListener("click", function () { if (imgUrl) openImmersive({ title: it.title, img: imgUrl }); });
      card.querySelector(".buy-btn").addEventListener("click", function (e) { e.stopPropagation(); openPurchase(it, "photo"); });
      photoGrid.appendChild(card);
    });
    buildChips(document.getElementById("photo-chips"), pcats, renderPhotos);
  }

  /* ── PAGE: apps ──────────────��───────────────────────────────── */
  var appGrid = document.getElementById("app-grid");
  if (appGrid) {
    var acats = get("apps.categories", []);
    var aitems = get("apps.items", []);
    var GRADS = {
      calm: "linear-gradient(135deg,#0a2a30 0%,#0a0a0b 70%)",
      play: "linear-gradient(135deg,#33001a 0%,#0a0a0b 70%)",
      tools: "linear-gradient(135deg,#26330a 0%,#0a0a0b 70%)"
    };
    aitems.forEach(function (it) {
      var catTitle = "";
      acats.forEach(function (c) { if (c.id === it.cat) catTitle = c.title || c.name || ""; });
      var aIcon = it.icon ? '<span class="card-icon">' + MD.esc(it.icon) + "</span>" : "";
      var aImg = (it.img || "").replace(/'/g, "%27");
      var defaultTile =
        '<div class="card-media" style="aspect-ratio:16/9;background:' + (GRADS[it.cat] || GRADS.tools) + ';display:flex;align-items:center;justify-content:center">' +
        '<span style="font-weight:900;font-style:italic;font-size:26px;color:var(--bone);opacity:0.9;padding:0 18px;text-align:center">' + MD.esc(it.title) + "</span></div>";
      var card = el("article", "card io");
      card.dataset.cat = it.cat;
      card.innerHTML =
        (aImg
          ? '<div class="card-media" role="img" aria-label="' + MD.esc(it.title) + '" style="aspect-ratio:16/9;background-image:url(\'' + aImg + "')\"></div>"
          : defaultTile) +
        '<div class="card-body">' +
        '<span class="card-kicker">' + aIcon + MD.esc(catTitle) + "</span>" +
        '<h3 class="card-title">' + MD.esc(it.title) + "</h3>" +
        '<p class="card-note">' + MD.plain(it.descMd || it.note || "") + "</p>" +
        '<div class="card-row"><span class="price-tag">' + MD.esc(it.price || "Live demo") + '</span>' +
        '<span style="display:flex;gap:8px"><button class="buy-btn run-btn" style="background:transparent;color:var(--bone);border:1px solid rgba(255,255,255,0.3)">Run it</button>' +
        '<button class="buy-btn own-btn">Own it</button></span></div>' +
        "</div>";
      if (aImg) {
        var aProbe = new Image();
        aProbe.onerror = function () {
          var m = card.querySelector(".card-media");
          var wrap = document.createElement("div");
          wrap.innerHTML = defaultTile;
          m.parentNode.replaceChild(wrap.firstChild, m);
        };
        aProbe.src = aImg;
      }
      card.querySelector(".run-btn").addEventListener("click", function (e) { e.stopPropagation(); openImmersive({ title: it.title, url: it.url }); });
      card.querySelector(".own-btn").addEventListener("click", function (e) { e.stopPropagation(); openPurchase(it, "app"); });
      card.addEventListener("click", function () { openImmersive({ title: it.title, url: it.url }); });
      appGrid.appendChild(card);
    });
    buildChips(document.getElementById("app-chips"), acats, function (cat) {
      appGrid.querySelectorAll(".card").forEach(function (c) {
        c.classList.toggle("is-hidden", !!cat && c.dataset.cat !== cat);
      });
    });
  }

  /* ── PAGE: sites ─────────────────────────────────────────────── */
  var siteList = document.getElementById("site-list");
  if (siteList) {
    var scats = get("sites.categories", []);
    var sitems = get("sites.items", []);
    /* live previews on every width; the designed cover holds the frame
       and persists only when the embed fails to load */
    sitems.forEach(function (it) {
      var catTitle = "";
      scats.forEach(function (c) { if (c.id === it.cat) catTitle = c.title || c.name || ""; });
      var row = el("article", "show-row io");
      row.dataset.cat = it.cat;
      row.innerHTML =
        '<div class="show-meta">' +
        '<span class="card-kicker" style="color:var(--magenta)">' + MD.esc(catTitle) + "</span>" +
        '<h3 class="show-title">' + MD.esc(it.title) + "</h3>" +
        '<p class="show-note">' + MD.plain(it.noteMd || it.note || "") + "</p>" +
        '<div class="show-actions"><button class="btn btn-ink imm-btn">Immerse</button>' +
        '<a class="btn btn-ghost" href="' + it.url + '" target="_blank" rel="noopener noreferrer">Visit ↗</a></div>' +
        "</div>" +
        '<div class="show-frame" data-url="' + it.url + '">' +
        '<div class="show-cover"><span class="cover-mono">' + MD.esc((it.title || "?").charAt(0)) + '</span><span class="cover-name">' + MD.esc(it.title) + '</span><span class="cover-state">LOADING PREVIEW…</span></div>' +
        "</div>";
      row.querySelector(".imm-btn").addEventListener("click", function (e) { e.stopPropagation(); openImmersive({ title: it.title, url: it.url }); });
      row.querySelector(".show-frame").addEventListener("click", function () { openImmersive({ title: it.title, url: it.url }); });
      siteList.appendChild(row);
    });
    /* lazy-load live previews when scrolled into view (all widths) */
    function armFrame(host) {
      var url = host.getAttribute("data-url");
      var probeOk = false, probeFailed = false, frameLoaded = false, settled = false;
      function showPlaceholder() {
        if (settled) return;
        settled = true;
        host.classList.remove("loaded");
        var st = host.querySelector(".cover-state");
        if (st) st.textContent = "PREVIEW UNAVAILABLE — TAP TO OPEN";
      }
      function showPreview() {
        if (settled) return;
        settled = true;
        host.classList.add("loaded");
      }
      /* the iframe load event fires even for browser error pages, so
         reachability is probed separately; both must succeed before the
         cover fades. no-cors keeps this working for cross-origin sites. */
      var settle = setTimeout(showPlaceholder, 8000);
      function maybeReveal() {
        if (probeOk && frameLoaded) { clearTimeout(settle); showPreview(); }
      }
      try {
        var ctrl = "AbortController" in window ? new AbortController() : null;
        var probeTimer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 7500);
        fetch(url, { mode: "no-cors", signal: ctrl ? ctrl.signal : undefined }).then(
          function () { clearTimeout(probeTimer); probeOk = true; maybeReveal(); },
          function () { clearTimeout(probeTimer); probeFailed = true; clearTimeout(settle); showPlaceholder(); }
        );
      } catch (e) {
        probeOk = true; /* ancient browser without fetch: fall back to load-event only */
      }
      var fr = document.createElement("iframe");
      fr.loading = "lazy";
      fr.title = "Live site preview";
      fr.tabIndex = -1;
      fr.addEventListener("load", function () {
        frameLoaded = true;
        maybeReveal();
      });
      fr.src = url;
      host.insertBefore(fr, host.firstChild);
    }
    if ("IntersectionObserver" in window) {
      var fio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          armFrame(en.target);
          fio.unobserve(en.target);
        });
      }, { rootMargin: "200px" });
      siteList.querySelectorAll(".show-frame").forEach(function (f) { fio.observe(f); });
    } else {
      siteList.querySelectorAll(".show-frame").forEach(armFrame);
    }
    buildChips(document.getElementById("site-chips"), scats, function (cat) {
      siteList.querySelectorAll(".show-row").forEach(function (r) {
        r.classList.toggle("is-hidden", !!cat && r.dataset.cat !== cat);
      });
    });
  }

  /* ── PAGE: blog index ────────────────────────────────────────── */
  var postList = document.getElementById("post-list");
  if (postList) {
    var posts = get("blog.posts", []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    posts.forEach(function (p) {
      var a = el("a", "post-item io");
      a.href = withDraft("post.html?p=" + encodeURIComponent(p.slug));
      a.innerHTML =
        '<span class="post-date">' + MD.esc(p.date) + "</span>" +
        "<h2>" + MD.esc(p.title) + "</h2>" +
        "<p>" + MD.plain(p.descMd) + "</p>" +
        '<div class="post-tags">' + (p.tags || []).map(function (t) { return "<span>" + MD.esc(t) + "</span>"; }).join("") + "</div>";
      postList.appendChild(a);
    });
  }

  /* ── PAGE: post ──────────────────────────────────────────────── */
  var articleHost = document.getElementById("article");
  if (articleHost) {
    var slug = new URLSearchParams(location.search).get("p");
    var post = null;
    get("blog.posts", []).forEach(function (p) { if (p.slug === slug) post = p; });
    if (!post) {
      articleHost.innerHTML = '<div class="article-head"><h1>Not found.</h1><p class="sub">That post doesn\'t exist — or it hasn\'t shipped yet.</p><p style="margin-top:20px"><a class="btn btn-ink" href="blog.html">← All posts</a></p></div>';
    } else {
      var base = get("meta.baseUrl", "");
      var desc = MD.plain(post.descMd, 158);
      document.title = post.title + " — " + get("meta.siteName", "BNDR LLC");
      function setMeta(sel, attr, val) {
        var n = document.querySelector(sel);
        if (n) n.setAttribute(attr, val);
      }
      setMeta('meta[name="description"]', "content", desc);
      setMeta('meta[property="og:title"]', "content", post.title);
      setMeta('meta[property="og:description"]', "content", desc);
      setMeta('meta[property="og:url"]', "content", base + "/post.html?p=" + post.slug);
      setMeta('link[rel="canonical"]', "href", base + "/post.html?p=" + post.slug);
      articleHost.innerHTML =
        '<div class="article-head io in">' +
        '<span class="post-date">' + MD.esc(post.date) + " · " + (post.tags || []).map(MD.esc).join(" · ") + "</span>" +
        "<h1>" + MD.esc(post.title) + "</h1>" +
        '<p class="sub">' + MD.plain(post.descMd) + "</p></div>" +
        '<div class="prose" id="article-body">' + MD.render(post.bodyMd) + "</div>" +
        '<p style="margin-top:44px"><a class="btn btn-ghost" href="' + withDraft("blog.html") + '">← All posts</a></p>';
      /* verified-facts layer — registry-only citations */
      if (FACTS) FACTS.inject(document.getElementById("article-body"), post.title + " " + post.descMd + " " + post.bodyMd);
      /* JSON-LD */
      var ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        datePublished: post.date,
        description: desc,
        author: { "@type": "Person", name: "Scott", worksFor: { "@type": "Organization", name: "BNDR LLC" } },
        publisher: { "@type": "Organization", name: "BNDR LLC", logo: { "@type": "ImageObject", url: get("meta.logo", "") } },
        mainEntityOfPage: base + "/post.html?p=" + post.slug
      });
      document.head.appendChild(ld);
    }
  }

  /* PAGE: estimate — tap-through intake + live flat-price quote.
     Config lives in content.intake (console-editable); hardcoded defaults
     below keep the page functional even with an older content.js. */
  var intakeRoot = document.getElementById("intake-root");
  if (intakeRoot) {
    var IK = get("intake", {}) || {};
    var IKD = {
      businessTypes: ["Home services / trades", "Med spa / salon / aesthetics", "Law / professional practice", "Restaurant / food", "Local shop / retail", "Personal brand / creative", "Something else"],
      needs: ["Brand-new site — nothing exists yet", "Redesign — my current site embarrasses me", "Landing page for a campaign or launch", "Not sure — tell me what I need"],
      sizes: [{ label: "Launch Site Special", detail: "One sharp page, fast", price: 599 }, { label: "One-Page Lander™", detail: "A single page engineered to convert", price: 2500 }, { label: "Three-Page Custom™", detail: "Home, work, contact — the full pitch", price: 4500 }, { label: "Small Business Site™", detail: "The complete presence", price: 6500 }],
      addons: [{ label: "Blog / field notes", price: 500 }, { label: "Photo or work gallery", price: 400 }, { label: "Copywriting help", price: 450 }, { label: "Logo / brand touch-up", price: 600 }],
      timelines: ["ASAP", "Within a month", "This quarter", "Just looking"],
      budgets: ["Under $1k", "$1k – $3k", "$3k – $6k", "$6k+", "Not sure yet"],
      hostingNote: "Flat build price. Hosting is $99/mo separate — covered in the FAQ below.",
      successMd: "**Got it — it's in my inbox.** You'll hear back from me directly, usually same day."
    };
    var ikGet = function (key) {
      var v = IK[key];
      if (v == null) return IKD[key];
      if (Array.isArray(v) && !v.length) return IKD[key];
      if (typeof v === "string" && !v.trim()) return IKD[key];
      return v;
    };
    var pick = { biz: null, need: null, size: null, addons: [], timeline: null, budget: null };
    var ikT0 = Date.now();
    function money(n) { return "$" + Number(n || 0).toLocaleString("en-US"); }
    function total() {
      var sizes = ikGet("sizes"), addons = ikGet("addons");
      var t = pick.size != null ? Number(sizes[pick.size].price) || 0 : 0;
      pick.addons.forEach(function (i) { t += Number(addons[i].price) || 0; });
      return t;
    }
    function stepNode(num, title, sub) {
      var s = el("div", "intake-step io");
      s.innerHTML = '<h3><span style="color:var(--magenta)">' + num + ".</span> " + MD.esc(title) + "</h3>" + (sub ? '<p class="step-sub">' + MD.esc(sub) + "</p>" : "");
      return s;
    }
    function optGroup(host, list, opts) {
      var grid = el("div", "opt-grid");
      grid.setAttribute("role", "group");
      list.forEach(function (item, i) {
        var label = typeof item === "string" ? item : (item.label || "");
        var b = el("button", "opt");
        b.type = "button";
        b.setAttribute("aria-pressed", "false");
        b.innerHTML = MD.esc(label) +
          (typeof item !== "string" && item.detail ? '<span class="opt-price" style="opacity:0.6;font-weight:600">' + MD.esc(item.detail) + "</span>" : "") +
          (typeof item !== "string" && item.price != null ? '<span class="opt-price">' + (opts.plus ? "+ " : "") + money(item.price) + "</span>" : "");
        b.addEventListener("click", function () {
          if (opts.multi) {
            b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"));
          } else {
            grid.querySelectorAll(".opt").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
            b.setAttribute("aria-pressed", "true");
          }
          opts.onPick(i, b.getAttribute("aria-pressed") === "true");
        });
        grid.appendChild(b);
      });
      host.appendChild(grid);
      return grid;
    }
    function summaryText() {
      var sizes = ikGet("sizes"), addons = ikGet("addons");
      return [
        "Business type: " + (pick.biz != null ? ikGet("businessTypes")[pick.biz] : "—"),
        "Need: " + (pick.need != null ? ikGet("needs")[pick.need] : "—"),
        "Size: " + (pick.size != null ? sizes[pick.size].label + " (" + money(sizes[pick.size].price) + ")" : "—"),
        "Add-ons: " + (pick.addons.length ? pick.addons.map(function (i) { return addons[i].label + " (+" + money(addons[i].price) + ")"; }).join(", ") : "none"),
        "Timeline: " + (pick.timeline != null ? ikGet("timelines")[pick.timeline] : "—"),
        "Budget comfort: " + (pick.budget != null ? ikGet("budgets")[pick.budget] : "—"),
        "Estimate shown: " + (pick.size != null ? money(total()) : "not locked")
      ].join("\n");
    }
    var s1 = stepNode(1, "What kind of business?", "This tunes the advice you get back — nothing else.");
    optGroup(s1, ikGet("businessTypes"), { onPick: function (i) { pick.biz = i; } });
    var s2 = stepNode(2, "What do you need?");
    optGroup(s2, ikGet("needs"), { onPick: function (i) { pick.need = i; } });
    var s3 = stepNode(3, "Pick a size", "Flat prices — the number you see is the number you pay.");
    optGroup(s3, ikGet("sizes"), { onPick: function (i) { pick.size = i; recalc(); } });
    var s4 = stepNode(4, "Add-ons", "Optional. Tap any that apply.");
    optGroup(s4, ikGet("addons"), { multi: true, plus: true, onPick: function (i, on) {
      var at = pick.addons.indexOf(i);
      if (on && at === -1) pick.addons.push(i);
      if (!on && at > -1) pick.addons.splice(at, 1);
      recalc();
    } });
    var s5 = stepNode(5, "When do you want it live?");
    optGroup(s5, ikGet("timelines"), { onPick: function (i) { pick.timeline = i; } });
    var s6 = stepNode(6, "Budget comfort zone", "So the recommendation fits reality — nothing is gated on it.");
    optGroup(s6, ikGet("budgets"), { onPick: function (i) { pick.budget = i; } });
    var quote = el("div", "intake-quote");
    quote.innerHTML = '<div><span class="q-label">Your flat price</span><span class="q-value" id="ik-total">Pick a size ↑</span></div><span class="q-note">' + MD.esc(ikGet("hostingNote")) + "</span>";
    function recalc() {
      quote.querySelector("#ik-total").textContent = pick.size == null ? "Pick a size ↑" : money(total());
    }
    var form = el("form", "intake-form io");
    form.setAttribute("novalidate", "novalidate");
    form.innerHTML =
      '<div class="if-grid">' +
      '<div class="intake-field"><label for="ik-name">Name *</label><input id="ik-name" name="name" maxlength="120" autocomplete="name" required /></div>' +
      '<div class="intake-field"><label for="ik-biz">Business name</label><input id="ik-biz" name="business" maxlength="160" autocomplete="organization" /></div>' +
      '<div class="intake-field"><label for="ik-email">Email *</label><input id="ik-email" name="email" type="email" maxlength="200" autocomplete="email" required /></div>' +
      '<div class="intake-field"><label for="ik-phone">Phone (optional)</label><input id="ik-phone" name="phone" type="tel" maxlength="40" autocomplete="tel" /></div>' +
      "</div>" +
      '<div class="intake-field"><label for="ik-notes">Anything else? (optional)</label><textarea id="ik-notes" name="notes" rows="3" maxlength="900"></textarea></div>' +
      '<div class="hp-wrap" aria-hidden="true"><label for="ik-hp">Leave this field empty</label><input id="ik-hp" name="_honey" type="text" tabindex="-1" autocomplete="off" /></div>' +
      '<button class="btn btn-ink" type="submit" style="font-size:16px;padding:16px 28px">Send it — get your reply direct →</button>' +
      '<p class="step-sub" style="margin-top:10px">No spam, no list, no drip campaign. This goes straight to the builder\'s inbox and nowhere else.</p>';
    var statusHost = el("div");
    form.appendChild(statusHost);
    var sending = false;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sending) return;
      function status(cls, html) {
        statusHost.innerHTML = '<div class="intake-status ' + cls + '">' + html + "</div>";
        if (statusHost.scrollIntoView) statusHost.scrollIntoView({ block: "nearest" });
      }
      var name = form.querySelector("#ik-name").value.trim();
      var email = form.querySelector("#ik-email").value.trim();
      /* honeypot: bots see success, nothing sends */
      if (form.querySelector("#ik-hp").value) { status("ok", MD.render(ikGet("successMd"))); return; }
      /* time trap: a real visitor taps options for longer than this */
      if (Date.now() - ikT0 < 4000) { status("err", "That was superhumanly fast — take one more look, then hit send again."); return; }
      if (!name) { status("err", "Your name is the one thing I actually need — add it and hit send."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { status("err", "That email doesn't look deliverable — double-check it and hit send."); return; }
      var btn = form.querySelector('button[type="submit"]');
      sending = true; btn.disabled = true; btn.textContent = "Sending…";
      var ownerEmail = get("meta.email", "bndr.labs@gmail.com");
      var endpoint = (IK.endpoint || "").trim() || "https://formsubmit.co/ajax/" + ownerEmail;
      var payload = {
        _subject: "[BNDR ESTIMATE] " + name + " — " + (pick.size != null ? money(total()) : "no size picked"),
        _template: "table",
        _captcha: "false",
        name: name,
        business: form.querySelector("#ik-biz").value.trim(),
        email: email,
        phone: form.querySelector("#ik-phone").value.trim(),
        project: summaryText(),
        notes: form.querySelector("#ik-notes").value.trim(),
        page: location.href.split("?")[0]
      };
      function fallback() {
        var mail = "mailto:" + ownerEmail + "?subject=" + encodeURIComponent(payload._subject) +
          "&body=" + encodeURIComponent(summaryText() + "\n\nName: " + name + "\nBusiness: " + payload.business + "\nEmail: " + email + "\nPhone: " + payload.phone + "\nNotes: " + payload.notes);
        status("err", 'The form service didn\'t answer, but nothing is lost — <a href="' + mail + '">send the same details by email in one tap →</a>');
        sending = false; btn.disabled = false; btn.textContent = "Send it — get your reply direct →";
      }
      try {
        fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(payload) })
          .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json().catch(function () { return {}; }); })
          .then(function () {
            status("ok", MD.render(ikGet("successMd")));
            form.querySelectorAll("input,textarea,button").forEach(function (n) { n.disabled = true; });
            if (window.gtag) { try { window.gtag("event", "generate_lead", { currency: "USD", value: pick.size != null ? total() : 0 }); } catch (e2) {} }
          })
          .catch(fallback);
      } catch (e3) { fallback(); }
    });
    var s7 = stepNode(7, "Where do I send the reply?", "That's the whole form — the reply comes from the person who builds it.");
    s7.appendChild(form);
    [s1, s2, s3, s4, s5, s6, quote, s7].forEach(function (n) { intakeRoot.appendChild(n); });
    /* FAQPage structured data — built from the same console-managed FAQ the page shows */
    var faqLd = get("faq", []);
    if (faqLd.length) {
      var ldf = document.createElement("script");
      ldf.type = "application/ld+json";
      ldf.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqLd.map(function (f) {
          return { "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: MD.plain(f.aMd) } };
        })
      });
      document.head.appendChild(ldf);
    }
  }

  /* ── PAGE: builder ──────────────────────────────────────────── */
  var pulse = document.getElementById("pulse-grid");
  if (pulse) {
    var cols = [
      { key: "shipped", label: "Shipped", state: "shipped" },
      { key: "motion", label: "In motion", state: "motion" },
      { key: "next", label: "Next", state: "next" }
    ];
    cols.forEach(function (cdef, i) {
      var col = el("div", "pulse-col io d" + (i + 1));
      col.dataset.state = cdef.state;
      col.innerHTML = "<h3><i></i>" + cdef.label + "</h3>";
      get("builder." + cdef.key, []).forEach(function (item) {
        var d = el("div", "pulse-item");
        d.innerHTML = "<b>" + MD.esc(item.name) + "</b><span>" + MD.esc(item.note) + "</span>";
        col.appendChild(d);
      });
      pulse.appendChild(col);
    });
  }

  /* ── contact links ──────────────────────────────────────────── */
  document.querySelectorAll("[data-mailto]").forEach(function (a) {
    a.href = "mailto:" + get("meta.email", "bndr.labs@gmail.com") + "?subject=" + encodeURIComponent(a.getAttribute("data-mailto"));
  });

  /* ── PHX clock ──────────────────────────────────────────────── */
  var clock = document.getElementById("phx-clock");
  if (clock) {
    function tick() {
      try {
        clock.textContent = "PHX " + new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "America/Phoenix" }).format(new Date());
      } catch (e) { clock.textContent = "PHX · AZ"; }
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ═══════════ v3.3 — physical layer ═══════════
     Orb physics, drag hint, tactile feedback. Fine pointers only —
     touch and reduced-motion keep the shipped calm behavior. */
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (finePointer && !reduced) (function () {

    /* ── tactile: tap ink on pills + buttons ── */
    document.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "touch") return;
      var host = e.target.closest(".btn, .buy-btn, .chip, .opt, .nav-pill a");
      if (!host) return;
      var r = host.getBoundingClientRect();
      var d = Math.max(r.width, r.height) * 2.2;
      var ink = el("span", "tap-ripple");
      ink.style.width = ink.style.height = d + "px";
      ink.style.left = (e.clientX - r.left - d / 2) + "px";
      ink.style.top = (e.clientY - r.top - d / 2) + "px";
      host.appendChild(ink);
      ink.addEventListener("animationend", function () { ink.remove(); });
    }, { passive: true });

    /* toggle pop — chips and estimator options answer the tap */
    document.addEventListener("click", function (e) {
      var t = e.target.closest(".chip, .opt, .hero-values li");
      if (!t) return;
      t.classList.remove("tap-pop");
      void t.offsetWidth; /* restart the keyframe */
      t.classList.add("tap-pop");
    });

    /* ── tactile: cursor-tracked glare + spring tilt on cards ── */
    var glareSel = ".card, .proof-card, .post-item, .show-row";
    var tiltEl = null, tiltPt = null, tiltRaf = 0;
    function tiltFrame() {
      tiltRaf = 0;
      if (!tiltEl || !tiltPt) return;
      var r = tiltEl.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var px = Math.min(1, Math.max(0, (tiltPt.x - r.left) / r.width));
      var py = Math.min(1, Math.max(0, (tiltPt.y - r.top) / r.height));
      tiltEl.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
      tiltEl.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      var isCard = tiltEl.classList.contains("card");
      if (isCard || tiltEl.classList.contains("proof-card")) {
        var lift = isCard ? -6 : -4;
        var rx = ((0.5 - py) * 4.5).toFixed(2);
        var ry = ((px - 0.5) * 5.5).toFixed(2);
        tiltEl.style.transform = "perspective(900px) translateY(" + lift + "px) rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
      }
    }
    function releaseTilt() {
      if (!tiltEl) return;
      tiltEl.classList.remove("is-tilt");
      tiltEl.style.transform = "";
      tiltEl = null;
      tiltPt = null;
    }
    document.addEventListener("pointerover", function (e) {
      var c = e.target.closest ? e.target.closest(glareSel) : null;
      if (!c || c === tiltEl) return;
      releaseTilt();
      tiltEl = c;
      c.classList.add("is-tilt");
    });
    document.addEventListener("pointermove", function (e) {
      if (!tiltEl) return;
      tiltPt = { x: e.clientX, y: e.clientY };
      if (!tiltRaf) tiltRaf = requestAnimationFrame(tiltFrame);
    }, { passive: true });
    document.addEventListener("pointerout", function (e) {
      if (!tiltEl) return;
      if (e.relatedTarget && tiltEl.contains(e.relatedTarget)) return;
      if (tiltEl === e.target || tiltEl.contains(e.target)) releaseTilt();
    });

    /* ── orb: a physical object (home hero only) ── */
    var wrap = document.querySelector(".hero .orb-wrap");
    var orb = wrap ? wrap.querySelector(".orb") : null;
    if (orb) (function () {
      var R = 150;          /* layout radius — the orb is 300px */
      var RC = 128;         /* collision radius — the plasma edge is soft */
      var textBlock = wrap.nextElementSibling;
      var homeX = 0, homeY = 0, maxX = 0, maxY = 0;
      var minX = R - 40, minY = 34;
      var obstacles = [];
      var pos = { x: 0, y: 0 }, vel = { x: 0, y: 0 };
      var t0 = performance.now();
      var seeded = false, holding = false, running = false, inView = false;
      var rafId = 0, lastT = 0, accT = 0, dragPt = null;
      var grab = { dx: 0, dy: 0 };
      var K = 0.0025, REST = 0.55;

      var shadow = el("div", "orb-shadow");
      wrap.insertBefore(shadow, orb);
      wrap.classList.add("orb-live");

      function inkRect(node, wr) {
        var rng = document.createRange();
        rng.selectNodeContents(node);
        var b = rng.getBoundingClientRect();
        if (!b.width) return null;
        return { l: b.left - wr.left, t: b.top - wr.top, r: b.right - wr.left, b: b.bottom - wr.top };
      }
      function childRect(box, wr, sel) {
        var b = box.getBoundingClientRect();
        if (!b.width) return null;
        var right = b.left;
        box.querySelectorAll(sel).forEach(function (n) { right = Math.max(right, n.getBoundingClientRect().right); });
        return { l: b.left - wr.left, t: b.top - wr.top, r: right - wr.left, b: b.bottom - wr.top };
      }
      function measure() {
        if (!wrap.clientWidth || wrap.offsetParent === null) { seeded = false; return false; }
        homeX = orb.offsetLeft + R;
        homeY = orb.offsetTop + R;
        maxX = wrap.clientWidth - R + 44;
        maxY = homeY + 30;
        obstacles = [];
        var wr = wrap.getBoundingClientRect();
        if (textBlock) {
          var tb = textBlock.getBoundingClientRect();
          if (tb.height) maxY = tb.bottom - wr.top - RC - 20;
          var h1 = textBlock.querySelector("h1");
          var desc = textBlock.querySelector(".hero-desc");
          var o;
          if (h1 && (o = inkRect(h1, wr))) obstacles.push(o);
          if (desc && (o = inkRect(desc, wr))) obstacles.push(o);
          var vals = textBlock.querySelector(".hero-values");
          if (vals && (o = childRect(vals, wr, "li"))) obstacles.push(o);
          var cta = textBlock.querySelector(".hero-cta");
          if (cta && (o = childRect(cta, wr, ".btn"))) obstacles.push(o);
        }
        return true;
      }
      function remeasure() {
        var wasSeeded = seeded, ox = homeX, oy = homeY;
        if (!measure()) return;
        if (wasSeeded) {
          pos.x += homeX - ox;
          pos.y += homeY - oy;
        } else {
          pos.x = homeX; pos.y = homeY;
          vel.x = vel.y = 0;
          t0 = performance.now();
          seeded = true;
        }
      }

      /* organic idle wander — biased up + sideways, eased in from rest */
      function driftTarget(t) {
        var s = t - t0;
        var a = Math.min(1, s / 5000);
        return {
          x: homeX + a * (26 * Math.sin(s * 0.00023) + 9 * Math.sin(s * 0.00052 + 1.7)),
          y: homeY + a * (-12 + 16 * Math.sin(s * 0.00017 + 0.6) + 6 * Math.sin(s * 0.00047 + 3.1))
        };
      }

      function collide(hard) {
        if (pos.x < minX) { pos.x = minX; if (vel.x < 0) vel.x *= -REST; }
        if (pos.x > maxX) { pos.x = maxX; if (vel.x > 0) vel.x *= -REST; }
        if (pos.y < minY) { pos.y = minY; if (vel.y < 0) vel.y *= -REST; }
        if (pos.y > maxY) { pos.y = maxY; if (vel.y > 0) vel.y *= -REST; }
        for (var i = 0; i < obstacles.length; i++) {
          var o = obstacles[i];
          var cx = Math.max(o.l + 6, Math.min(pos.x, o.r - 6));
          var cy = Math.max(o.t + 6, Math.min(pos.y, o.b - 6));
          var dx = pos.x - cx, dy = pos.y - cy;
          var d2 = dx * dx + dy * dy;
          if (d2 >= RC * RC) continue;
          var nx, ny, pen;
          if (d2 < 0.0001) {
            /* center swallowed by the rect — escape via the nearest edge */
            var eL = pos.x - o.l, eR = o.r - pos.x, eT = pos.y - o.t, eB = o.b - pos.y;
            var m = Math.min(eL, eR, eT, eB);
            nx = m === eL ? -1 : m === eR ? 1 : 0;
            ny = nx ? 0 : (m === eT ? -1 : 1);
            pen = RC + m;
          } else {
            var d = Math.sqrt(d2);
            nx = dx / d; ny = dy / d;
            pen = RC - d;
          }
          var push = hard ? pen : Math.min(pen, Math.max(1.5, pen * 0.3));
          pos.x += nx * push;
          pos.y += ny * push;
          var vn = vel.x * nx + vel.y * ny;
          if (vn < 0) { vel.x -= (1 + REST) * vn * nx; vel.y -= (1 + REST) * vn * ny; }
        }
      }

      function step(t) {
        if (holding && dragPt) {
          var tx = dragPt.x + grab.dx, ty = dragPt.y + grab.dy;
          vel.x = (tx - pos.x) * 0.55;
          vel.y = (ty - pos.y) * 0.55;
          pos.x += vel.x;
          pos.y += vel.y;
          collide(true);
          return;
        }
        var target = driftTarget(t);
        var sp = Math.hypot(vel.x, vel.y);
        vel.x += (target.x - pos.x) * K;
        vel.y += (target.y - pos.y) * K;
        var fr = sp > 5 ? 0.988 : 0.94; /* glide fast, settle slow */
        vel.x *= fr;
        vel.y *= fr;
        pos.x += vel.x;
        pos.y += vel.y;
        collide(false);
      }

      function render(t) {
        var sc = holding ? 1.03 : 1;
        var rot = Math.sin((t - t0) * 0.00013) * 4 + Math.max(-9, Math.min(9, vel.x * 0.35));
        orb.style.transform = "translate3d(" + (pos.x - homeX).toFixed(2) + "px," + (pos.y - homeY).toFixed(2) + "px,0) rotate(" + rot.toFixed(2) + "deg) scale(" + sc + ")";
        /* shadow: rides under the orb, stretches with speed, thins with lift */
        var sp = Math.hypot(vel.x, vel.y);
        var liftN = Math.max(0, Math.min(1, (homeY - pos.y) / 260));
        var s2 = 1 - liftN * 0.35 + (holding ? 0.06 : 0);
        var sx = s2 * (1 + Math.min(0.35, sp * 0.02));
        shadow.style.transform = "translate3d(" + (pos.x - 115).toFixed(2) + "px," + (pos.y + R * 0.58).toFixed(2) + "px,0) scale(" + sx.toFixed(3) + "," + s2.toFixed(3) + ")";
        shadow.style.opacity = (0.5 * s2 + (holding ? 0.1 : 0)).toFixed(3);
      }

      function loop(t) {
        rafId = running ? requestAnimationFrame(loop) : 0;
        if (!seeded) return;
        var dt = Math.min(64, t - (lastT || t));
        lastT = t;
        accT += dt;
        while (accT >= 16.6) { step(t); accT -= 16.6; }
        render(t);
      }
      function setRunning(on) {
        on = on && inView && !document.hidden;
        if (on === running) return;
        running = on;
        lastT = 0;
        accT = 0;
        if (on && !rafId) rafId = requestAnimationFrame(loop);
      }
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (en) {
          inView = en[0].isIntersecting;
          setRunning(true);
        }, { rootMargin: "120px" }).observe(wrap);
      } else { inView = true; setRunning(true); }
      document.addEventListener("visibilitychange", function () { setRunning(true); });

      /* grab / drag / throw */
      var trail = [];
      orb.addEventListener("pointerdown", function (e) {
        if (e.pointerType === "touch" || !seeded) return;
        holding = true;
        orb.classList.add("is-held");
        try { orb.setPointerCapture(e.pointerId); } catch (err) { /* no capture, drag still works */ }
        var wr = wrap.getBoundingClientRect();
        dragPt = { x: e.clientX - wr.left, y: e.clientY - wr.top };
        grab.dx = pos.x - dragPt.x;
        grab.dy = pos.y - dragPt.y;
        trail = [{ t: performance.now(), x: dragPt.x, y: dragPt.y }];
        hintDone();
        e.preventDefault();
      });
      orb.addEventListener("pointermove", function (e) {
        if (!holding) return;
        var wr = wrap.getBoundingClientRect();
        dragPt = { x: e.clientX - wr.left, y: e.clientY - wr.top };
        var now = performance.now();
        trail.push({ t: now, x: dragPt.x, y: dragPt.y });
        while (trail.length > 2 && now - trail[0].t > 120) trail.shift();
      });
      function release() {
        if (!holding) return;
        holding = false;
        orb.classList.remove("is-held");
        dragPt = null;
        /* flick velocity from the last ~120ms of pointer travel — truer
           to a fast throw than the follow-lag velocity alone */
        if (trail.length > 1) {
          var a = trail[0], b = trail[trail.length - 1];
          var dt = b.t - a.t;
          if (dt >= 2) {
            var fx = (b.x - a.x) / dt * 16.7;
            var fy = (b.y - a.y) / dt * 16.7;
            if (Math.hypot(fx, fy) > Math.hypot(vel.x, vel.y)) { vel.x = fx; vel.y = fy; }
          }
        }
        trail = [];
        vel.x *= 1.15; vel.y *= 1.15; /* let the throw carry */
        var sp = Math.hypot(vel.x, vel.y);
        if (sp > 46) { vel.x *= 46 / sp; vel.y *= 46 / sp; }
      }
      orb.addEventListener("pointerup", release);
      orb.addEventListener("pointercancel", release);

      /* ── drag hint — quiet micro-label invitation ── */
      var HKEY = "bndr.orbHint.v33";
      var hint = null, seen = false;
      try { seen = sessionStorage.getItem(HKEY) === "1"; } catch (e) { /* storage blocked — show it */ }
      if (!seen) {
        hint = el("div", "orb-hint",
          '<span class="orb-hint-breath"><span class="orb-hint-label">Grab it — it answers back</span><span class="orb-hint-arrow">→</span></span>');
        wrap.appendChild(hint);
        window.addEventListener("scroll", function () {
          if (hint) hint.classList.toggle("is-away", window.scrollY > 70);
        }, { passive: true });
      }
      function hintDone() {
        if (!hint) return;
        try { sessionStorage.setItem(HKEY, "1"); } catch (e) { /* fine — hides this page-view only */ }
        var h = hint;
        hint = null;
        h.classList.add("is-away");
        setTimeout(function () { h.remove(); }, 750);
      }

      /* first layout, then re-measure once webfonts settle the headline */
      remeasure();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
      window.addEventListener("load", remeasure);
      var rzT;
      window.addEventListener("resize", function () {
        clearTimeout(rzT);
        rzT = setTimeout(remeasure, 140);
      });
    })();
  })();

  /* math upgrade: no-op unless the page carries math */
  if (MD.mathUpgrade) MD.mathUpgrade(document);

  armReveals();
})();
