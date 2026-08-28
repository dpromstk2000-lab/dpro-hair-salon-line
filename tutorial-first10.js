/* DPRO TUTORIAL HAIR / R3 FIRST10 STANDARD V1.1
 * Accepted R1 exactly-10 contract consumer.
 * Tutorial-only UI/progress. Business mutation 0.
 */
(() => {
  "use strict";

  const VERSION = "HAIR-R3-FIRST10-V1.1-STANDARD10-20260828";
  const CONTRACT_URL = "R1_FIRST10_CONTRACT.json";
  const STORAGE_KEY = "dpro_hair_tutorial_first10_v2";
  const OWNER_ROUTE = "owner.html";
  const GUIDE_ROUTE = "guide-center.html";

  const VIEW_BY_STEP = Object.freeze({
    "F10-03": "today",
    "F10-04": "today",
    "F10-05": "reservations",
    "F10-06": "customers",
    "F10-07": "carte",
    "F10-08": "follow"
  });

  const state = {
    contract: null,
    steps: [],
    index: 0,
    open: false,
    launcher: null,
    guideLink: null,
    shield: null,
    highlight: null,
    card: null,
    toast: null,
    lastFocused: null,
    initialView: null,
    dragState: null,
    manuallyPlaced: false,
    loadError: null,
    targetSelector: null,
    targetFound: false,
    renderToken: 0
  };

  const q = (selector, root = document) => {
    try { return root.querySelector(selector); } catch (_) { return null; }
  };
  const routeName = () => (location.pathname.split("/").pop() || OWNER_ROUTE).toLowerCase();
  const isOwner = () => routeName() === OWNER_ROUTE;
  const isGuide = () => routeName() === GUIDE_ROUTE;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 1 && rect.height > 1;
  }

  function normalizedTargetSelectors(step) {
    const target = step?.target || {};
    return [
      target.primary,
      ...(Array.isArray(target.secondary) ? target.secondary : []),
      ...(Array.isArray(target.fallback) ? target.fallback : [])
    ].filter(Boolean);
  }

  function validateContract(data) {
    if (!data || data.schema !== "DPRO-TUTORIAL-FIRST10-CONTRACT-V1.1") throw new Error("FIRST10 contract schema mismatch");
    if (data.system !== "HAIR" || data.standard_target !== "V1.1") throw new Error("HAIR V1.1 contract required");
    if (data.first10_count !== 10 || !Array.isArray(data.steps) || data.steps.length !== 10) throw new Error("FIRST10 must be exactly 10");
    const ids = data.steps.map(step => step.id);
    const expected = Array.from({length: 10}, (_, i) => `F10-${String(i + 1).padStart(2, "0")}`);
    if (ids.join("|") !== expected.join("|")) throw new Error("FIRST10 IDs/order mismatch");
    if (data.steps.slice(0, 9).some(step => step.route !== OWNER_ROUTE)) throw new Error("F10-01..09 must stay on owner.html");
    if (data.steps[9].route !== GUIDE_ROUTE || data.steps[9].cross_page?.required !== true) throw new Error("F10-10 cross-page contract mismatch");
    const text = JSON.stringify(data.steps);
    if (/password\s*[:=]\s*["']?\d{4}/i.test(text)) throw new Error("credential-like content detected");
    return data;
  }

  async function loadContract() {
    const response = await fetch(CONTRACT_URL, {cache: "no-store", credentials: "same-origin"});
    if (!response.ok) throw new Error(`${CONTRACT_URL} HTTP ${response.status}`);
    state.contract = validateContract(await response.json());
    state.steps = state.contract.steps;
  }

  function readProgress() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!parsed || typeof parsed !== "object") return null;
      if (!Number.isInteger(parsed.index) || parsed.index < 0 || parsed.index > 9) return null;
      return parsed;
    } catch (_) { return null; }
  }

  function writeProgress(status = "in_progress", index = state.index, route = state.steps[index]?.route || routeName()) {
    const value = {index, status, route, version: VERSION, updatedAt: new Date().toISOString()};
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch (_) {}
    updateEntryLabels();
    syncGuideReplayLink();
    return value;
  }

  function resetProgress() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    state.index = 0;
    updateEntryLabels();
    syncGuideReplayLink();
  }

  function showToast(message) {
    if (!state.toast) return;
    state.toast.textContent = message;
    state.toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { if (state.toast) state.toast.hidden = true; }, 3400);
  }

  function updateEntryLabels() {
    if (!state.launcher) return;
    if (state.loadError) {
      state.launcher.textContent = "チュートリアル読込エラー";
      state.launcher.disabled = true;
      return;
    }
    state.launcher.disabled = state.steps.length !== 10;
    const p = readProgress();
    if (p?.status === "in_progress") state.launcher.textContent = "チュートリアルを続ける";
    else if (p?.status === "completed" || p?.status === "skipped") state.launcher.textContent = "チュートリアルをもう一度";
    else state.launcher.textContent = "10分チュートリアル";
  }

  function installOwnerEntryUI() {
    if (!isOwner()) return;
    let launcher = q("#dproTutorialLauncher");
    let guide = q("#dproGuideCenterLink");
    if (!launcher) {
      const host = q(".topbar__right") || q(".topbar") || document.body;
      const wrap = document.createElement("div");
      wrap.className = "dpro-tutorial-actions";
      wrap.dataset.dproTutorialVersion = VERSION;

      launcher = document.createElement("button");
      launcher.type = "button";
      launcher.id = "dproTutorialLauncher";
      launcher.className = "dpro-tutorial-launcher";
      launcher.textContent = "10分チュートリアル";
      launcher.setAttribute("aria-haspopup", "dialog");
      launcher.disabled = true;

      guide = document.createElement("button");
      guide.type = "button";
      guide.id = "dproGuideCenterLink";
      guide.className = "dpro-guide-center-link";
      guide.dataset.r4Pending = "false";
      guide.textContent = "操作ガイド";
      guide.title = "DPRO 操作ガイドを開く";

      wrap.append(launcher, guide);
      host.append(wrap);
    }

    state.launcher = launcher;
    state.guideLink = guide;
    launcher.addEventListener("click", () => resumeOrStart());
    guide?.addEventListener("click", () => {
      const p = readProgress();
      if (p?.status === "in_progress" && p.index === 9) writeProgress("in_progress", 9, GUIDE_ROUTE);
    });
  }

  function installToast() {
    let toast = q("#dproTutorialToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "dpro-tutorial-toast";
      toast.id = "dproTutorialToast";
      toast.hidden = true;
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.append(toast);
    }
    state.toast = toast;
  }

  function syncGuideReplayLink() {
    if (!isGuide()) return;
    const link = q("#replayFirst10");
    if (!link) return;
    const p = readProgress();
    if (p?.status === "in_progress" && p.index === 9) {
      link.textContent = "チュートリアルを続ける";
      link.href = "guide-center.html?tutorial=resume";
      link.dataset.tutorialAction = "resume";
    } else {
      link.textContent = "最初の10分を再生";
      link.href = "owner.html?tutorial=restart";
      link.dataset.tutorialAction = "replay";
    }
  }

  function bindGuideReplay() {
    if (!isGuide()) return;
    document.addEventListener("click", event => {
      const link = event.target.closest?.("#replayFirst10[data-tutorial-action=\"resume\"]");
      if (!link) return;
      event.preventDefault();
      openTutorial({startAt: 9});
    });
  }

  function createOverlay() {
    if (state.shield) return;
    const shield = document.createElement("div");
    shield.className = "dpro-tutorial-shield";
    shield.id = "dproTutorialShield";
    shield.hidden = true;
    shield.setAttribute("aria-hidden", "true");

    const highlight = document.createElement("div");
    highlight.className = "dpro-tutorial-highlight";
    highlight.id = "dproTutorialHighlight";
    highlight.hidden = true;
    highlight.setAttribute("aria-hidden", "true");

    const card = document.createElement("section");
    card.className = "dpro-tutorial-card";
    card.id = "dproTutorialCard";
    card.hidden = true;
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", "dproTutorialTitle");
    card.setAttribute("aria-describedby", "dproTutorialBody");

    document.body.append(shield, highlight, card);
    state.shield = shield;
    state.highlight = highlight;
    state.card = card;

    ["click", "pointerdown"].forEach(type => shield.addEventListener(type, event => {
      event.preventDefault();
      event.stopPropagation();
    }, true));
  }

  function currentOwnerView() {
    return q('[data-view][aria-current="page"]')?.dataset.view || null;
  }

  function safeViewNavigate(step) {
    if (!isOwner()) return;
    const view = VIEW_BY_STEP[step.id];
    if (!view) return;
    const nav = q(`[data-view="${view}"]`);
    if (nav && nav.getAttribute("aria-current") !== "page") nav.click();
  }

  function resolveTarget(step) {
    state.targetSelector = null;
    state.targetFound = false;
    for (const selector of normalizedTargetSelectors(step)) {
      const el = q(selector);
      if (isVisible(el)) {
        state.targetSelector = selector;
        state.targetFound = true;
        return el;
      }
    }
    return null;
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
    state.highlight.style.width = `${Math.max(2, Math.min(innerWidth - 8, rect.width + pad * 2))}px`;
    state.highlight.style.height = `${Math.max(2, Math.min(innerHeight - 8, rect.height + pad * 2))}px`;
    state.highlight.hidden = false;
  }

  function viewportBox() {
    const vv = window.visualViewport;
    return {left: vv?.offsetLeft || 0, top: vv?.offsetTop || 0, width: vv?.width || innerWidth, height: vv?.height || innerHeight};
  }

  function clampDraggedCard(card = state.card, left = null, top = null) {
    if (!card) return null;
    const vp = viewportBox();
    const margin = vp.width <= 760 ? 8 : 12;
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
    return {left: nextLeft, top: nextTop};
  }

  function endCardDrag(pointerId = null) {
    if (!state.dragState) return;
    if (pointerId != null && state.dragState.pointerId !== pointerId) return;
    const {handle, pointerId: activePointerId} = state.dragState;
    state.dragState = null;
    state.card?.classList.remove("is-dragging");
    try { if (handle?.hasPointerCapture?.(activePointerId)) handle.releasePointerCapture(activePointerId); } catch (_) {}
  }

  function resetCardDrag() {
    endCardDrag();
    state.manuallyPlaced = false;
    if (!state.card) return;
    state.card.classList.remove("is-dragged", "is-dragging");
    ["left", "top", "right", "bottom", "width"].forEach(prop => state.card.style.removeProperty(prop));
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
      state.dragState = {pointerId: event.pointerId, handle, offsetX: event.clientX - start.left, offsetY: event.clientY - start.top};
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
      state.card.style.removeProperty("left");
      state.card.style.removeProperty("top");
      state.card.style.removeProperty("right");
      state.card.style.removeProperty("bottom");
      return;
    }
    const rCard = state.card.getBoundingClientRect();
    const margin = 12;
    let left = Math.max(margin, (innerWidth - rCard.width) / 2);
    let top = Math.max(margin, (innerHeight - rCard.height) / 2);
    if (target && isVisible(target)) {
      const r = target.getBoundingClientRect();
      const below = r.bottom + margin;
      const above = r.top - rCard.height - margin;
      top = below + rCard.height <= innerHeight - margin ? below : (above >= margin ? above : Math.max(margin, innerHeight - rCard.height - margin));
      left = Math.min(Math.max(margin, r.left + (r.width - rCard.width) / 2), Math.max(margin, innerWidth - rCard.width - margin));
    }
    state.card.style.left = `${Math.round(left)}px`;
    state.card.style.top = `${Math.round(top)}px`;
  }

  function scrollTargetIntoView(target) {
    if (!target || !isVisible(target)) return;
    const r = target.getBoundingClientRect();
    const safeTop = 90;
    const safeBottom = innerHeight - Math.min(260, Math.max(140, innerHeight * 0.28));
    if (r.top < safeTop || r.bottom > safeBottom) target.scrollIntoView({block: "center", inline: "nearest", behavior: "auto"});
  }

  function stepChapter(step) {
    if (step.id === "F10-01") return "START";
    if (["F10-02", "F10-03", "F10-04"].includes(step.id)) return "毎日の開始";
    if (["F10-05", "F10-06"].includes(step.id)) return "予約・顧客";
    if (["F10-07", "F10-08"].includes(step.id)) return "カルテ・再来店";
    if (step.id === "F10-09") return "安全な終了";
    return "GUIDE CENTER";
  }

  // Render token prevents stale deferred callbacks from repainting an older step.
  function renderCard() {
    if (!state.open || !state.steps[state.index]) return;
    const stepIndex = state.index;
    const step = state.steps[stepIndex];
    const renderToken = ++state.renderToken;
    const isCurrentRender = () => state.open && state.renderToken === renderToken && state.index === stepIndex;

    if (step.route !== routeName()) {
      routeToStep(stepIndex);
      return;
    }
    safeViewNavigate(step);
    setTimeout(() => {
      if (!isCurrentRender()) return;
      let target = resolveTarget(step);
      scrollTargetIntoView(target);
      setTimeout(() => {
        if (!isCurrentRender()) return;
        target = resolveTarget(step);
        positionHighlight(target);
        const progress = Math.round(((stepIndex + 1) / 10) * 100);
        const missing = target ? "" : '<div class="dpro-tutorial-card__missing">対象部分は現在の画面状態では表示されていません。安全な代替表示のまま次へ進めます。</div>';
        state.card.innerHTML = `
          <div class="dpro-tutorial-card__top">
            <div class="dpro-tutorial-card__chapter">${escapeHtml(stepChapter(step))}</div>
            <div class="dpro-tutorial-card__tools">
              <span class="dpro-tutorial-card__drag-handle" data-drag-handle tabindex="0" role="button" aria-label="説明カードを移動" title="ドラッグして移動">↕ 移動</span>
              <button type="button" class="dpro-tutorial-card__close" data-role="close" aria-label="チュートリアルを閉じる">× 閉じる</button>
            </div>
            <div class="dpro-tutorial-card__progress">
              <span>${stepIndex + 1} / 10</span>
              <span class="dpro-tutorial-card__bar" aria-hidden="true"><span style="width:${progress}%"></span></span>
            </div>
          </div>
          <h3 id="dproTutorialTitle">${escapeHtml(step.title)}</h3>
          <p class="dpro-tutorial-card__body" id="dproTutorialBody">${escapeHtml(step.action)}</p>
          <div class="dpro-tutorial-card__safety">安全：${escapeHtml(step.safety)}</div>
          ${missing}
          <div class="dpro-tutorial-card__controls">
            <div class="dpro-tutorial-card__left"><button type="button" data-role="skip">スキップ</button></div>
            <div class="dpro-tutorial-card__right">
              <button type="button" data-role="back" ${stepIndex === 0 ? "disabled" : ""}>戻る</button>
              <button type="button" data-role="next">${stepIndex === 9 ? "完了" : "次へ"}</button>
            </div>
          </div>`;
        state.card.querySelector('[data-role="close"]').addEventListener("click", () => closeTutorial("in_progress"));
        state.card.querySelector('[data-role="skip"]').addEventListener("click", () => closeTutorial("skipped"));
        state.card.querySelector('[data-role="back"]').addEventListener("click", previousCard);
        state.card.querySelector('[data-role="next"]').addEventListener("click", nextCard);
        enableCardDrag(state.card);
        positionCard(target);
        writeProgress("in_progress", stepIndex, step.route);
        state.card.querySelector('[data-role="next"]')?.focus({preventScroll: true});
      }, 70);
    }, 50);
  }

  function routeToStep(index) {
    const step = state.steps[index];
    if (!step) return;
    writeProgress("in_progress", index, step.route);
    if (step.route === GUIDE_ROUTE) location.href = `${GUIDE_ROUTE}?tutorial=resume`;
    else location.href = `${OWNER_ROUTE}?tutorial=resume`;
  }

  function openTutorial({startAt = null} = {}) {
    if (state.steps.length !== 10 || state.open) return;
    const p = readProgress();
    let index = Number.isInteger(startAt) ? startAt : (p?.status === "in_progress" ? p.index : 0);
    index = Math.max(0, Math.min(9, index));
    const step = state.steps[index];
    if (step.route !== routeName()) {
      routeToStep(index);
      return;
    }
    state.lastFocused = document.activeElement;
    state.initialView = isOwner() ? currentOwnerView() : null;
    state.index = index;
    createOverlay();
    resetCardDrag();
    state.shield.hidden = false;
    state.highlight.hidden = true;
    state.card.hidden = false;
    document.body.classList.add("dpro-tutorial-active");
    state.open = true;
    writeProgress("in_progress", index, step.route);
    renderCard();
  }

  function restoreInitialView() {
    if (!isOwner() || !state.initialView) return;
    const nav = q(`[data-view="${state.initialView}"]`);
    if (nav && nav.getAttribute("aria-current") !== "page") nav.click();
  }

  function closeTutorial(status = "in_progress") {
    if (!state.open) return;
    endCardDrag();
    writeProgress(status, state.index, state.steps[state.index]?.route || routeName());
    state.open = false;
    document.body.classList.remove("dpro-tutorial-active");
    if (state.shield) state.shield.hidden = true;
    if (state.highlight) state.highlight.hidden = true;
    if (state.card) state.card.hidden = true;
    restoreInitialView();
    state.lastFocused?.focus?.({preventScroll: true});
    state.initialView = null;
    if (status === "skipped") showToast("チュートリアルをスキップしました。いつでも最初から再生できます。");
  }

  function nextCard() {
    if (!state.open) return;
    if (state.index >= 9) {
      writeProgress("completed", 9, GUIDE_ROUTE);
      closeTutorial("completed");
      showToast("FIRST 10 MINUTES を完了しました。いつでも再生できます。");
      syncGuideReplayLink();
      return;
    }
    const next = state.index + 1;
    if (state.steps[next]?.route !== routeName()) {
      state.open = false;
      routeToStep(next);
      return;
    }
    state.index = next;
    // Persist synchronously before deferred card rendering so an immediate reload
    // resumes the exact step the user just reached.
    writeProgress("in_progress", state.index, state.steps[state.index]?.route || routeName());
    resetCardDrag();
    renderCard();
  }

  function previousCard() {
    if (!state.open || state.index <= 0) return;
    const previous = state.index - 1;
    if (state.steps[previous]?.route !== routeName()) {
      state.open = false;
      routeToStep(previous);
      return;
    }
    state.index = previous;
    // Keep Back navigation equally durable for immediate reload/route changes.
    writeProgress("in_progress", state.index, state.steps[state.index]?.route || routeName());
    resetCardDrag();
    renderCard();
  }

  function resumeOrStart() {
    const p = readProgress();
    if (p?.status === "in_progress" && p.index === 9 && isOwner()) {
      routeToStep(9);
      return;
    }
    openTutorial();
  }

  function reposition() {
    if (!state.open) return;
    const target = resolveTarget(state.steps[state.index]);
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
      event.stopPropagation();
      nextCard();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      event.stopPropagation();
      previousCard();
      return;
    }
    if (event.key === "Tab" && state.card) {
      const focusable = [...state.card.querySelectorAll('button:not(:disabled), [tabindex="0"]')].filter(isVisible);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }

  function inspect() {
    const p = readProgress();
    const cardRect = state.card && !state.card.hidden ? state.card.getBoundingClientRect() : null;
    const highlightRect = state.highlight && !state.highlight.hidden ? state.highlight.getBoundingClientRect() : null;
    return {
      version: VERSION,
      route: routeName(),
      open: state.open,
      index: state.index,
      count: state.steps.length,
      progress: p,
      targetSelector: state.targetSelector,
      targetFound: state.targetFound,
      cardRect: cardRect ? {left: cardRect.left, top: cardRect.top, right: cardRect.right, bottom: cardRect.bottom, width: cardRect.width, height: cardRect.height} : null,
      highlightRect: highlightRect ? {left: highlightRect.left, top: highlightRect.top, right: highlightRect.right, bottom: highlightRect.bottom, width: highlightRect.width, height: highlightRect.height} : null,
      activeElement: document.activeElement?.getAttribute?.("data-role") || document.activeElement?.id || document.activeElement?.tagName || null
    };
  }

  async function handleStartup() {
    const params = new URLSearchParams(location.search);
    const action = params.get("tutorial");
    if (isOwner() && action === "restart") {
      resetProgress();
      openTutorial({startAt: 0});
      return;
    }
    if (action === "resume") {
      const p = readProgress();
      if (p?.status === "in_progress") openTutorial({startAt: p.index});
      return;
    }
    const p = readProgress();
    if (isGuide() && p?.status === "in_progress" && p.index === 9) openTutorial({startAt: 9});
  }

  async function init() {
    installOwnerEntryUI();
    installToast();
    bindGuideReplay();
    createOverlay();
    window.addEventListener("resize", reposition, {passive: true});
    window.addEventListener("scroll", reposition, {passive: true, capture: true});
    window.visualViewport?.addEventListener("resize", reposition, {passive: true});
    document.addEventListener("keydown", trapKeyboard, true);

    try {
      await loadContract();
    } catch (error) {
      console.error("[DPRO Tutorial R3]", error);
      state.loadError = error;
      showToast("チュートリアル本文を読み込めませんでした。");
    }
    updateEntryLabels();
    syncGuideReplayLink();

    window.DPRO_TUTORIAL_HAIR = Object.freeze({
      version: VERSION,
      start: () => { resetProgress(); isOwner() ? openTutorial({startAt: 0}) : (location.href = `${OWNER_ROUTE}?tutorial=restart`); },
      resume: () => resumeOrStart(),
      replay: () => { resetProgress(); isOwner() ? openTutorial({startAt: 0}) : (location.href = `${OWNER_ROUTE}?tutorial=restart`); },
      close: () => closeTutorial("in_progress"),
      reset: () => resetProgress(),
      getState: () => ({open: state.open, index: state.index, count: state.steps.length, progress: readProgress(), route: routeName()}),
      inspect
    });

    if (!state.loadError) await handleStartup();
    document.documentElement.dataset.dproTutorialReady = state.loadError ? "error" : "true";
    document.documentElement.dataset.dproTutorialVersion = VERSION;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once: true});
  else init();
})();
