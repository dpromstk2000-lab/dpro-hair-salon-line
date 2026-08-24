/* DPRO TUTORIAL HAIR / R3 FIRST10 V1.1 DRAG CARD
   R2 FINAL LOCK consumer. Additive / mutation-zero. */
(() => {
  "use strict";

  const VERSION = "HAIR-R3-FIRST10-V1.1-DRAG-CARD-20260824";
  const CONTENT_URL = "CONTENT_PACKAGE.json";
  const EXPECTED_CONTENT_SHA256 = "7b931958aac74ab7406ee2efeb54e462243f4f32574462ab2da25f5bfa94f143";
  const EXPECTED_SOURCE_COMMIT = "682b48772f5859199ae98cf87ef72d7e43bf389c";
  const STORAGE_KEY = "dpro_hair_tutorial_first10_v1";

  const TARGETS = Object.freeze({
    TUTORIAL_LAUNCHER: "#dproTutorialLauncher",
    OWNER_NAV: ".nav",
    OWNER_ADMIN_AREA: "#topAdminCodeArea",
    OWNER_ADMIN_CLEAR: "#topAdminCodeClear",
    OWNER_TODAY_NAV: '[data-view="today"]',
    OWNER_TODAY_STATS: "#todayStats",
    OWNER_STATUS_PIPELINE: "#statusPipeline",
    OWNER_TODAY_RESERVATIONS: "#todayReservationTable",
    OWNER_ATTENTION: "#attentionList",
    OWNER_MANUAL_ENTRY: '[data-action="open-manual"]',
    OWNER_RESERVATIONS_NAV: '[data-view="reservations"]',
    OWNER_RESERVATION_STATUS: "#reservationStatusFilter",
    OWNER_RESERVATION_LIST: "#reservationPageList",
    OWNER_CUSTOMERS_NAV: '[data-view="customers"]',
    OWNER_CUSTOMER_SEARCH: "#customerSearchInput",
    OWNER_CUSTOMER_DETAIL: "#customerDetailCard",
    OWNER_CARTE_NAV: '[data-view="carte"]',
    OWNER_CARTE_CONTENT: "#carteContent",
    OWNER_CARTE_RECORD: "#carteAddRecord",
    OWNER_SIDEFOOT: ".sidefoot__links",
    OWNER_FOLLOW_NAV: '[data-view="follow"]',
    OWNER_FOLLOW_LIST: "#followTaskList",
    OWNER_PROPOSAL_LIST: "#proposalList",
    GUIDE_CENTER_LINK: "#dproGuideCenterLink"
  });

  const CARD_VIEW = Object.freeze({
    "F10-03": "today",
    "F10-04": "today",
    "F10-05": "today",
    "F10-06": "today",
    "F10-08": "reservations",
    "F10-09": "customers",
    "F10-10": "carte",
    "F10-12": "follow"
  });

  const PRIMARY_TARGET = Object.freeze({
    "F10-01": "TUTORIAL_LAUNCHER",
    "F10-02": "OWNER_ADMIN_AREA",
    "F10-03": "OWNER_TODAY_NAV",
    "F10-04": "OWNER_TODAY_STATS",
    "F10-05": "OWNER_STATUS_PIPELINE",
    "F10-06": "OWNER_ATTENTION",
    "F10-07": "OWNER_MANUAL_ENTRY",
    "F10-08": "OWNER_RESERVATION_LIST",
    "F10-09": "OWNER_CUSTOMER_SEARCH",
    "F10-10": "OWNER_CARTE_CONTENT",
    "F10-11": "OWNER_SIDEFOOT",
    "F10-12": "OWNER_FOLLOW_LIST",
    "F10-13": "OWNER_SIDEFOOT",
    "F10-14": "OWNER_ADMIN_CLEAR",
    "F10-15": "GUIDE_CENTER_LINK"
  });

  const state = {
    content: null,
    cards: [],
    chapters: new Map(),
    index: 0,
    open: false,
    initialView: null,
    launcher: null,
    guideLink: null,
    shield: null,
    highlight: null,
    card: null,
    toast: null,
    lastFocused: null,
    loadError: null,
    dragState: null,
    manuallyPlaced: false
  };

  function q(selector) {
    try { return document.querySelector(selector); } catch (_) { return null; }
  }

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 1 && rect.height > 1;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  async function sha256Hex(text) {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join("");
  }

  function validateContent(data) {
    if (!data || data.industry_code !== "HAIR") throw new Error("HAIR contentではありません。");
    if (data.source_lock?.commit !== EXPECTED_SOURCE_COMMIT) throw new Error("SOURCE LOCKが一致しません。");
    if (!Array.isArray(data.first10) || data.first10.length !== 15) throw new Error("FIRST10は15カード必要です。");
    const ids = data.first10.map(x => x.id);
    if (new Set(ids).size !== 15 || ids[0] !== "F10-01" || ids[14] !== "F10-15") {
      throw new Error("FIRST10カードIDがR2 FINAL LOCKと一致しません。");
    }
    const customerText = JSON.stringify(data.first10);
    ["system-check", "demo_prepare", "Worker/DB/API internal inspection"].forEach(term => {
      if (customerText.includes(term)) throw new Error(`顧客Tutorial禁止語を検出: ${term}`);
    });
    data.first10.forEach(card => {
      if (!Array.isArray(card.targets) || !card.targets.length) throw new Error(`${card.id}: targetなし`);
      card.targets.forEach(targetId => {
        if (!TARGETS[targetId]) throw new Error(`${card.id}: 未実装target ${targetId}`);
      });
    });
  }

  async function loadContent() {
    const response = await fetch(CONTENT_URL, { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) throw new Error(`CONTENT_PACKAGE読込失敗: HTTP ${response.status}`);
    const text = await response.text();
    const digest = await sha256Hex(text);
    if (digest !== EXPECTED_CONTENT_SHA256) throw new Error("CONTENT_PACKAGE SHA256不一致");
    const data = JSON.parse(text);
    validateContent(data);
    state.content = data;
    state.cards = data.first10;
    state.chapters = new Map([
      ["F10-C01", "最初に覚える3つ"],
      ["F10-C02", "毎日の基本フロー"],
      ["F10-C03", "予約・顧客検索"],
      ["F10-C04", "美容カルテ・スタッフ施術"],
      ["F10-C05", "再来店フォロー"],
      ["F10-C06", "役割分担と安全終了"],
      ["F10-C07", "困った時と復習"]
    ]);
  }

  function loadProgress() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!parsed || typeof parsed !== "object") return null;
      if (!Number.isInteger(parsed.index) || parsed.index < 0 || parsed.index > 14) return null;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function saveProgress(status = "in_progress") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        index: state.index,
        status,
        version: VERSION,
        updatedAt: new Date().toISOString()
      }));
    } catch (_) {}
    updateLauncherLabel();
  }

  function updateLauncherLabel() {
    if (!state.launcher) return;
    if (state.loadError) {
      state.launcher.textContent = "チュートリアル読込エラー";
      state.launcher.disabled = true;
      return;
    }
    state.launcher.disabled = !state.cards.length;
    const progress = loadProgress();
    if (progress?.status === "in_progress" && progress.index > 0) {
      state.launcher.textContent = "チュートリアルを続ける";
    } else if (progress?.status === "completed") {
      state.launcher.textContent = "チュートリアルをもう一度";
    } else {
      state.launcher.textContent = "10分チュートリアル";
    }
  }

  function showToast(message) {
    if (!state.toast) return;
    state.toast.textContent = message;
    state.toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { if (state.toast) state.toast.hidden = true; }, 3600);
  }

  function installEntryUI() {
    if (q("#dproTutorialLauncher")) return;
    const host = q(".topbar__right") || q(".topbar") || document.body;
    const wrap = document.createElement("div");
    wrap.className = "dpro-tutorial-actions";
    wrap.dataset.dproTutorialVersion = VERSION;

    const launcher = document.createElement("button");
    launcher.type = "button";
    launcher.id = "dproTutorialLauncher";
    launcher.className = "dpro-tutorial-launcher";
    launcher.textContent = "10分チュートリアル";
    launcher.setAttribute("aria-haspopup", "dialog");
    launcher.disabled = true;

    const guide = document.createElement("button");
    guide.type = "button";
    guide.id = "dproGuideCenterLink";
    guide.className = "dpro-guide-center-link";
    guide.dataset.r4Pending = "true";
    guide.textContent = "操作ガイド";
    guide.title = "Guide CenterはR4で公開予定です";

    wrap.append(launcher, guide);
    host.append(wrap);

    const toast = document.createElement("div");
    toast.className = "dpro-tutorial-toast";
    toast.id = "dproTutorialToast";
    toast.hidden = true;
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.append(toast);

    state.launcher = launcher;
    state.guideLink = guide;
    state.toast = toast;

    launcher.addEventListener("click", () => openTutorial());
    guide.addEventListener("click", () => {
      showToast("操作ガイド（Guide Center）はR4で公開します。FIRST10は現在利用できます。");
    });
  }

  function createOverlay() {
    if (state.shield) return;
    const shield = document.createElement("div");
    shield.className = "dpro-tutorial-shield";
    shield.id = "dproTutorialShield";
    shield.setAttribute("aria-hidden", "true");

    const highlight = document.createElement("div");
    highlight.className = "dpro-tutorial-highlight";
    highlight.id = "dproTutorialHighlight";
    highlight.hidden = true;
    highlight.setAttribute("aria-hidden", "true");

    const card = document.createElement("section");
    card.className = "dpro-tutorial-card";
    card.id = "dproTutorialCard";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", "dproTutorialTitle");
    card.setAttribute("aria-describedby", "dproTutorialBody");

    document.body.append(shield, highlight, card);
    state.shield = shield;
    state.highlight = highlight;
    state.card = card;

    shield.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
    }, true);
    shield.addEventListener("pointerdown", e => {
      e.preventDefault();
      e.stopPropagation();
    }, true);
  }

  function currentView() {
    return q('[data-view][aria-current="page"]')?.dataset.view || null;
  }

  function switchViewForCard(card) {
    const view = CARD_VIEW[card.id];
    if (!view) return;
    const nav = q(`[data-view="${view}"]`);
    if (nav && nav.getAttribute("aria-current") !== "page") {
      // Existing navigation only; does not submit/save business data.
      nav.click();
    }
  }

  function candidateElements(card) {
    const ids = [];
    if (PRIMARY_TARGET[card.id]) ids.push(PRIMARY_TARGET[card.id]);
    [...card.targets].reverse().forEach(id => { if (!ids.includes(id)) ids.push(id); });

    const elements = [];
    ids.forEach(id => {
      const selector = TARGETS[id];
      const el = selector ? q(selector) : null;
      if (el && !elements.includes(el)) elements.push(el);
    });

    if (card.id === "F10-02") {
      const fallback = q("#adminCodeChip");
      if (fallback && !elements.includes(fallback)) elements.push(fallback);
    }
    if (card.id === "F10-14") {
      const fallback = q("#adminCodeChip");
      if (fallback && !elements.includes(fallback)) elements.push(fallback);
    }
    return elements;
  }

  function findVisibleTarget(card) {
    return candidateElements(card).find(isVisible) || null;
  }

  function positionHighlight(target) {
    if (!state.highlight) return;
    if (!target || !isVisible(target)) {
      state.highlight.hidden = true;
      return;
    }
    const rect = target.getBoundingClientRect();
    const pad = 6;
    state.highlight.style.left = `${Math.max(4, rect.left - pad)}px`;
    state.highlight.style.top = `${Math.max(4, rect.top - pad)}px`;
    state.highlight.style.width = `${Math.min(innerWidth - 8, rect.width + pad * 2)}px`;
    state.highlight.style.height = `${Math.min(innerHeight - 8, rect.height + pad * 2)}px`;
    state.highlight.hidden = false;
  }

  function viewportBox() {
    const vv = window.visualViewport;
    return { left: vv?.offsetLeft || 0, top: vv?.offsetTop || 0, width: vv?.width || innerWidth, height: vv?.height || innerHeight };
  }

  function clampDraggedCard(card = state.card, left = null, top = null) {
    if (!card) return null;
    const margin = matchMedia("(max-width:760px)").matches ? 8 : 12;
    const vp = viewportBox();
    const r = card.getBoundingClientRect();
    const rawLeft = left == null ? r.left : left;
    const rawTop = top == null ? r.top : top;
    const maxLeft = vp.left + Math.max(margin, vp.width - r.width - margin);
    const maxTop = vp.top + Math.max(margin, vp.height - r.height - margin);
    const nextLeft = Math.min(Math.max(rawLeft, vp.left + margin), maxLeft);
    const nextTop = Math.min(Math.max(rawTop, vp.top + margin), maxTop);
    card.style.setProperty("left", `${Math.round(nextLeft)}px`, "important");
    card.style.setProperty("top", `${Math.round(nextTop)}px`, "important");
    card.style.setProperty("right", "auto", "important");
    card.style.setProperty("bottom", "auto", "important");
    return { left: nextLeft, top: nextTop };
  }

  function endCardDrag(pointerId = null) {
    if (!state.dragState) return;
    if (pointerId != null && state.dragState.pointerId !== pointerId) return;
    const { handle, pointerId: activePointerId } = state.dragState;
    state.dragState = null;
    state.card?.classList.remove("is-dragging");
    try { if (handle?.hasPointerCapture?.(activePointerId)) handle.releasePointerCapture(activePointerId); } catch (_) {}
  }

  function resetCardDrag() {
    endCardDrag();
    state.manuallyPlaced = false;
    if (!state.card) return;
    state.card.classList.remove("is-dragged", "is-dragging");
    ["left","top","right","bottom","width"].forEach(prop => state.card.style.removeProperty(prop));
  }

  function enableCardDrag(card = state.card) {
    const handle = card?.querySelector("[data-drag-handle]");
    if (!card || !handle) return;
    handle.addEventListener("pointerdown", event => {
      if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
      const r = card.getBoundingClientRect();
      state.manuallyPlaced = true;
      card.classList.add("is-dragged", "is-dragging");
      card.style.setProperty("width", `${Math.min(r.width, viewportBox().width - 16)}px`, "important");
      const start = clampDraggedCard(card, r.left, r.top);
      state.dragState = { pointerId: event.pointerId, handle, offsetX: event.clientX - start.left, offsetY: event.clientY - start.top };
      try { handle.setPointerCapture(event.pointerId); } catch (_) {}
      event.preventDefault();
      event.stopPropagation();
    });
    handle.addEventListener("pointermove", event => {
      if (!state.dragState || state.dragState.pointerId !== event.pointerId) return;
      clampDraggedCard(card, event.clientX - state.dragState.offsetX, event.clientY - state.dragState.offsetY);
      event.preventDefault();
      event.stopPropagation();
    });
    const finish = event => {
      if (!state.dragState || state.dragState.pointerId !== event.pointerId) return;
      clampDraggedCard(card);
      endCardDrag(event.pointerId);
      event.preventDefault();
      event.stopPropagation();
    };
    handle.addEventListener("pointerup", finish);
    handle.addEventListener("pointercancel", finish);
    handle.addEventListener("lostpointercapture", event => endCardDrag(event.pointerId));
  }

  function positionCard(target) {
    if (!state.card) return;
    if (state.manuallyPlaced) { clampDraggedCard(state.card); return; }
    if (matchMedia("(max-width:760px)").matches) {
      state.card.style.left = "8px";
      state.card.style.top = "auto";
      return;
    }
    const cardRect = state.card.getBoundingClientRect();
    const margin = 12;
    let left = Math.max(margin, (innerWidth - cardRect.width) / 2);
    let top = Math.max(margin, (innerHeight - cardRect.height) / 2);

    if (target && isVisible(target)) {
      const r = target.getBoundingClientRect();
      const below = r.bottom + margin;
      const above = r.top - cardRect.height - margin;
      top = below + cardRect.height <= innerHeight - margin ? below
        : above >= margin ? above
        : Math.max(margin, innerHeight - cardRect.height - margin);
      left = Math.min(
        Math.max(margin, r.left + (r.width - cardRect.width) / 2),
        Math.max(margin, innerWidth - cardRect.width - margin)
      );
    }
    state.card.style.left = `${Math.round(left)}px`;
    state.card.style.top = `${Math.round(top)}px`;
  }

  function scrollTargetIntoView(target) {
    if (!target || !isVisible(target)) return;
    const r = target.getBoundingClientRect();
    const safeTop = 90;
    const safeBottom = innerHeight - 260;
    if (r.top < safeTop || r.bottom > safeBottom) {
      target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    }
  }

  function renderCard() {
    if (!state.open || !state.cards[state.index]) return;
    const item = state.cards[state.index];
    switchViewForCard(item);

    setTimeout(() => {
      if (!state.open) return;
      const target = findVisibleTarget(item);
      scrollTargetIntoView(target);

      setTimeout(() => {
        if (!state.open) return;
        const visibleTarget = findVisibleTarget(item);
        positionHighlight(visibleTarget);

        const chapter = state.chapters.get(item.chapter) || item.chapter || "FIRST 10 MINUTES";
        const count = state.cards.length;
        const progress = Math.round(((state.index + 1) / count) * 100);
        const missing = visibleTarget ? "" :
          `<div class="dpro-tutorial-card__missing">対象部分は現在の画面状態では非表示です。場所と役割を確認して次へ進めます。</div>`;

        state.card.innerHTML = `
          <div class="dpro-tutorial-card__top">
            <div>
              <div class="dpro-tutorial-card__chapter">${escapeHtml(chapter)}</div>
            </div>
            <span class="dpro-tutorial-card__drag-handle" data-drag-handle aria-label="説明カードを移動" title="ドラッグして移動">↕ 移動</span>
            <div class="dpro-tutorial-card__progress">
              <span>${state.index + 1} / ${count}</span>
              <span class="dpro-tutorial-card__bar" aria-hidden="true"><span style="width:${progress}%"></span></span>
            </div>
          </div>
          <h3 id="dproTutorialTitle">${escapeHtml(item.title)}</h3>
          <p class="dpro-tutorial-card__body" id="dproTutorialBody">${escapeHtml(item.body)}</p>
          <div class="dpro-tutorial-card__action">ここを確認：${escapeHtml(item.action)}</div>
          <div class="dpro-tutorial-card__safety">安全：${escapeHtml(item.safety)}</div>
          ${missing}
          <div class="dpro-tutorial-card__controls">
            <div class="dpro-tutorial-card__left">
              <button type="button" data-role="later">あとで</button>
              <button type="button" data-role="skip">スキップ</button>
            </div>
            <div class="dpro-tutorial-card__right">
              <button type="button" data-role="back" ${state.index === 0 ? "disabled" : ""}>戻る</button>
              <button type="button" data-role="next">${state.index === count - 1 ? "完了" : "次へ"}</button>
            </div>
          </div>`;

        state.card.querySelector('[data-role="later"]').addEventListener("click", () => closeTutorial("in_progress"));
        state.card.querySelector('[data-role="skip"]').addEventListener("click", () => closeTutorial("skipped"));
        state.card.querySelector('[data-role="back"]').addEventListener("click", previousCard);
        state.card.querySelector('[data-role="next"]').addEventListener("click", nextCard);
        enableCardDrag(state.card);

        positionCard(visibleTarget);
        saveProgress("in_progress");
        state.card.querySelector('[data-role="next"]')?.focus({ preventScroll: true });
      }, 80);
    }, 60);
  }

  function openTutorial({ startAt = null } = {}) {
    if (!state.cards.length || state.open) return;
    state.lastFocused = document.activeElement;
    state.initialView = currentView();

    if (Number.isInteger(startAt)) {
      state.index = Math.max(0, Math.min(14, startAt));
    } else {
      const progress = loadProgress();
      state.index = progress?.status === "in_progress" ? progress.index : 0;
    }

    createOverlay();
    resetCardDrag();
    state.shield.hidden = false;
    state.highlight.hidden = true;
    state.card.hidden = false;
    document.body.classList.add("dpro-tutorial-active");
    state.open = true;
    saveProgress("in_progress");
    renderCard();
  }

  function restoreInitialView() {
    if (!state.initialView) return;
    const nav = q(`[data-view="${state.initialView}"]`);
    if (nav && nav.getAttribute("aria-current") !== "page") nav.click();
  }

  function closeTutorial(status = "in_progress") {
    if (!state.open) return;
    endCardDrag();
    if (status === "skipped") {
      saveProgress("skipped");
    } else if (status === "completed") {
      saveProgress("completed");
    } else {
      saveProgress("in_progress");
    }
    state.open = false;
    document.body.classList.remove("dpro-tutorial-active");
    if (state.shield) state.shield.hidden = true;
    if (state.highlight) state.highlight.hidden = true;
    if (state.card) state.card.hidden = true;
    restoreInitialView();
    state.lastFocused?.focus?.({ preventScroll: true });
    state.initialView = null;
  }

  function nextCard() {
    if (!state.open) return;
    if (state.index >= state.cards.length - 1) {
      closeTutorial("completed");
      showToast("FIRST 10 MINUTES を完了しました。いつでも「チュートリアルをもう一度」から再確認できます。");
      return;
    }
    state.index += 1;
    renderCard();
  }

  function previousCard() {
    if (!state.open || state.index <= 0) return;
    state.index -= 1;
    renderCard();
  }

  function reposition() {
    if (!state.open) return;
    const item = state.cards[state.index];
    const target = findVisibleTarget(item);
    positionHighlight(target);
    positionCard(target);
  }

  function trapKeyboard(event) {
    if (!state.open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeTutorial("in_progress");
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      nextCard();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      previousCard();
      return;
    }
    if (event.key === "Tab" && state.card) {
      const focusable = [...state.card.querySelectorAll("button:not(:disabled)")];
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
  }

  async function init() {
    installEntryUI();
    window.addEventListener("resize", reposition, { passive: true });
    window.addEventListener("scroll", reposition, { passive: true, capture: true });
    window.visualViewport?.addEventListener("resize", reposition, { passive: true });
    document.addEventListener("keydown", trapKeyboard, true);

    try {
      await loadContent();
    } catch (error) {
      console.error("[DPRO Tutorial]", error);
      state.loadError = error;
      showToast("チュートリアル本文を読み込めませんでした。CONTENT_PACKAGEを確認してください。");
    }
    updateLauncherLabel();

    window.DPRO_TUTORIAL_HAIR = Object.freeze({
      version: VERSION,
      start: () => openTutorial({ startAt: 0 }),
      resume: () => openTutorial(),
      close: () => closeTutorial("in_progress"),
      getState: () => ({
        open: state.open,
        index: state.index,
        count: state.cards.length,
        contentSha256: EXPECTED_CONTENT_SHA256
      })
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
