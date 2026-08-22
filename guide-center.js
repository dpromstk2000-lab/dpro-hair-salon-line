/* DPRO TUTORIAL HAIR / R4 GUIDE CENTER V1.0
 * Article / FAQ copy comes only from CONTENT_PACKAGE.json.
 * No business mutation APIs are called from this file.
 */
(() => {
  "use strict";
  const VERSION = "HAIR-R4-GUIDE-CENTER-V1.0-20260822";
  const EXPECTED = Object.freeze({
    packageId: "HAIR_CONTENT_PACKAGE_V1.0",
    contentVersion: "V1.1",
    categories: 8,
    articles: 34,
    faqs: 14,
    first10: 15
  });
  const ROLE_LABELS = Object.freeze({
    store_operator: "店舗スタッフ向け",
    public_customer: "お客様向け"
  });
  const state = { content: null, query: "", category: "all", articleId: "" };
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));
  const meta = () => window.DPRO_HAIR_GUIDE_META || {categories:{},targets:{}};

  function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  }
  function norm(value) {
    return String(value ?? "").normalize("NFKC").toLocaleLowerCase("ja-JP").replace(/\s+/g, " ").trim();
  }
  function matchesArticle(article, query) {
    if (!query) return true;
    const haystack = norm([article.id, article.title, article.summary, ...(article.steps||[]), article.caution||""].join(" "));
    return haystack.includes(query);
  }
  function matchesFaq(faq, query) {
    if (!query) return true;
    return norm([faq.id, faq.q, faq.a].join(" ")).includes(query);
  }
  function validateContent(data) {
    if (!data || data.package_id !== EXPECTED.packageId) throw new Error("Guide Centerのコンテンツ正本を確認できません。");
    if (data.version !== EXPECTED.contentVersion) throw new Error("Guide CenterのコンテンツVersionがR3 FINAL LOCKと一致しません。");
    if (!Array.isArray(data.first10) || data.first10.length !== EXPECTED.first10) throw new Error("FIRST10 FINAL LOCKを確認できません。");
    if (!Array.isArray(data.guide_articles) || data.guide_articles.length !== EXPECTED.articles) throw new Error("操作記事は34件必要です。");
    if (!Array.isArray(data.faqs) || data.faqs.length !== EXPECTED.faqs) throw new Error("FAQは14件必要です。");
    const cats = new Set(data.guide_articles.map(x => x.category));
    if (cats.size !== EXPECTED.categories) throw new Error("Guide Centerは8カテゴリ必要です。");
    const ids = data.guide_articles.map(x => x.id);
    if (new Set(ids).size !== ids.length) throw new Error("操作記事IDが重複しています。");
    const faqIds = data.faqs.map(x => x.id);
    if (new Set(faqIds).size !== faqIds.length) throw new Error("FAQ IDが重複しています。");
    return data;
  }
  function categoryLabel(id) { return meta().categories[id] || id; }
  function categoryCounts() {
    const counts = {};
    for (const article of state.content.guide_articles) counts[article.category] = (counts[article.category] || 0) + 1;
    return counts;
  }
  function filteredArticles() {
    const query = norm(state.query);
    return state.content.guide_articles.filter(article =>
      (state.category === "all" || article.category === state.category) && matchesArticle(article, query)
    );
  }
  function filteredFaqs() {
    const query = norm(state.query);
    return state.content.faqs.filter(faq => matchesFaq(faq, query));
  }
  function setUrlArticle(id) {
    const url = new URL(location.href);
    if (id) url.searchParams.set("article", id); else url.searchParams.delete("article");
    history.replaceState(null, "", url.pathname + url.search + url.hash);
  }
  function renderCounts() {
    $("#categoryCount").textContent = String(new Set(state.content.guide_articles.map(x => x.category)).size);
    $("#articleCount").textContent = String(state.content.guide_articles.length);
    $("#faqCount").textContent = String(state.content.faqs.length);
  }
  function renderCategories() {
    const counts = categoryCounts();
    const ids = [...new Set(state.content.guide_articles.map(x => x.category))];
    $("#categoryFilters").innerHTML = [
      `<button type="button" class="category-button" data-category="all" aria-pressed="${state.category==="all"}"><span>すべて</span><span>${state.content.guide_articles.length}</span></button>`,
      ...ids.map(id => `<button type="button" class="category-button" data-category="${safe(id)}" aria-pressed="${state.category===id}"><span>${safe(categoryLabel(id))}</span><span>${counts[id]||0}</span></button>`)
    ].join("");
  }
  function renderArticles() {
    const rows = filteredArticles();
    $("#articleList").innerHTML = rows.map(article => `
      <button type="button" class="article-card" data-article-id="${safe(article.id)}" aria-label="${safe(article.title)}を開く">
        <span class="article-card__meta"><span>${safe(article.id)}</span><span>${safe(categoryLabel(article.category))}</span></span>
        <h3>${safe(article.title)}</h3>
        <p>${safe(article.summary)}</p>
        <span class="article-card__open">詳しい手順を見る →</span>
      </button>`).join("");
    $("#articleEmpty").hidden = rows.length !== 0;
    return rows.length;
  }
  function targetLinkData(targetId) {
    const t = meta().targets[targetId];
    if (!t || !t.page) return null; // INTERNAL SUPPORT or unresolved targets are not linked.
    const url = new URL(t.page, document.baseURI);
    if (t.page === "owner.html") url.searchParams.set("guideTarget", targetId);
    return { href: url.pathname.split("/").pop() + url.search, label: t.label || "該当画面", targetId };
  }
  function renderTargetLinks(container, targetIds, prefix="該当画面") {
    const links = (targetIds || []).map(targetLinkData).filter(Boolean);
    if (!links.length) {
      container.innerHTML = "";
      return;
    }
    const unique = [];
    const seen = new Set();
    for (const link of links) {
      const key = link.href;
      if (seen.has(key)) continue;
      seen.add(key); unique.push(link);
    }
    container.innerHTML = unique.slice(0,4).map(link =>
      `<a class="target-link" href="${safe(link.href)}" data-guide-target="${safe(link.targetId)}">${safe(prefix)}：${safe(link.label)}</a>`
    ).join("");
  }
  function renderArticleDetail(articleId, focus=true) {
    const article = state.content.guide_articles.find(x => x.id === articleId);
    if (!article) return closeArticle();
    state.articleId = article.id;
    setUrlArticle(article.id);
    $("#articleListSection").hidden = true;
    $("#articleDetailSection").hidden = false;
    $("#articleDetailMeta").textContent = `${article.id} / ${categoryLabel(article.category)}`;
    $("#articleDetailTitle").textContent = article.title;
    $("#articleDetailSummary").textContent = article.summary;
    $("#articleRole").textContent = ROLE_LABELS[article.role] || "操作ガイド";
    $("#articleSteps").innerHTML = (article.steps || []).map(step => `<li><span>${safe(step)}</span></li>`).join("");
    const caution = $("#articleCaution");
    caution.hidden = !article.caution;
    caution.textContent = article.caution || "";
    renderTargetLinks($("#articleTargets"), article.targets, "画面を開く");
    if (focus) {
      $("#articleDetailSection").scrollIntoView({block:"start",behavior:"smooth"});
      $("#articleBack").focus({preventScroll:true});
    }
  }
  function closeArticle(focus=true) {
    state.articleId = "";
    setUrlArticle("");
    $("#articleDetailSection").hidden = true;
    $("#articleListSection").hidden = false;
    if (focus) $("#articleListTitle").focus?.();
  }
  function renderFaqs() {
    const rows = filteredFaqs();
    $("#faqList").innerHTML = rows.map(faq => {
      const links = (faq.targets||[]).map(targetLinkData).filter(Boolean);
      const unique = [];
      const seen = new Set();
      for (const link of links) { if (!seen.has(link.href)) { seen.add(link.href); unique.push(link); } }
      return `<details class="faq-item" data-faq-id="${safe(faq.id)}">
        <summary>${safe(faq.q)}</summary>
        <div class="faq-answer">
          <div>${safe(faq.a)}</div>
          ${unique.length ? `<div class="faq-targets">${unique.slice(0,3).map(link => `<a class="target-link" href="${safe(link.href)}">${safe(link.label)}を開く</a>`).join("")}</div>` : ""}
        </div>
      </details>`;
    }).join("");
    $("#faqEmpty").hidden = rows.length !== 0;
    return rows.length;
  }
  function renderAll() {
    renderCategories();
    const articleCount = renderArticles();
    const faqCount = renderFaqs();
    $("#resultSummary").textContent = `記事 ${articleCount}件 / FAQ ${faqCount}件`;
    if (state.articleId) renderArticleDetail(state.articleId, false);
  }
  function bindEvents() {
    $("#categoryFilters").addEventListener("click", e => {
      const button = e.target.closest("[data-category]");
      if (!button) return;
      state.category = button.dataset.category || "all";
      closeArticle(false);
      renderAll();
    });
    $("#articleList").addEventListener("click", e => {
      const card = e.target.closest("[data-article-id]");
      if (card) renderArticleDetail(card.dataset.articleId);
    });
    $("#articleBack").addEventListener("click", () => closeArticle());
    $("#guideSearch").addEventListener("input", e => {
      state.query = e.target.value;
      closeArticle(false);
      renderAll();
    });
    $("#clearSearch").addEventListener("click", () => {
      state.query = "";
      $("#guideSearch").value = "";
      closeArticle(false);
      renderAll();
      $("#guideSearch").focus();
    });
    document.addEventListener("keydown", e => {
      if ((e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) || (e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        $("#guideSearch").focus();
        return;
      }
      if (e.key === "Escape" && state.articleId) {
        e.preventDefault();
        closeArticle();
      }
    });
  }
  async function init() {
    try {
      const response = await fetch("CONTENT_PACKAGE.json", {cache:"no-store", credentials:"same-origin"});
      if (!response.ok) throw new Error(`CONTENT_PACKAGE.json HTTP ${response.status}`);
      state.content = validateContent(await response.json());
      const params = new URLSearchParams(location.search);
      state.articleId = params.get("article") || "";
      renderCounts();
      bindEvents();
      renderAll();
      $("#guideApp").setAttribute("aria-busy","false");
      if (state.articleId) renderArticleDetail(state.articleId, false);
      document.documentElement.dataset.guideReady = "true";
      document.documentElement.dataset.guideVersion = VERSION;
    } catch (error) {
      console.error(error);
      $("#loadError").hidden = false;
      $("#loadError").textContent = `操作ガイドを読み込めませんでした。ページを再読み込みしてください。 (${error.message})`;
      $("#guideApp").setAttribute("aria-busy","false");
      document.documentElement.dataset.guideReady = "error";
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true}); else init();
})();
