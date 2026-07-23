/**
 * DPRO 美容室 LINE
 * STEP HAIR-NEXT-4 共通設定・公開基盤 完全互換版
 * File: config.js
 * Version: HAIR-NEXT-8-R1-COMMON-CONFIG-20260723
 *
 * GitHub Pages:
 * https://dpromstk2000-lab.github.io/dpro-hair-salon-line/
 *
 * Cloudflare Worker:
 * https://dpro-hair-salon-line-api.dpromstk2000.workers.dev
 *
 * Compatibility:
 * - BEAUTY-4以降の既存6画面を壊さない
 * - HAIR-NEXT-8-R1 Workerの会員実績・再予約整合APIへ対応
 * - 管理コードの保存・削除、電話番号正規化、共通エラー処理を維持
 */
(function initializeDPROHairSalonConfig(global) {
  "use strict";

  const VERSION = "HAIR-NEXT-8-R1-COMMON-CONFIG-20260723";
  const EXPECTED_WORKER_VERSION = "HAIR-NEXT-8-R1-WORKER-MEMBER-CONSISTENCY-20260723";
  const SERVICE_NAME = "DPRO 美容室 LINE";
  const API_BASE_URL = "https://dpro-hair-salon-line-api.dpromstk2000.workers.dev";
  const SITE_BASE_URL = "https://dpromstk2000-lab.github.io/dpro-hair-salon-line";
  const DEFAULT_SHOP_CODE = "dpro_hair_demo";
  const TIME_ZONE = "Asia/Tokyo";
  const REQUEST_TIMEOUT_MS = 20000;
  const PHOTO_UPLOAD_TIMEOUT_MS = 45000;
  const CSV_TIMEOUT_MS = 90000;
  const NEXT_STANDARD = true;
  const LEGACY_COMPATIBLE = true;

  const STORAGE_KEYS = Object.freeze({
    ADMIN_CODE: "dpro_hair_admin_code",
    SHOP_CODE: "dpro_hair_shop_code",
    MEMBER_PHONE: "dpro_hair_member_phone",
    MEMBER_LINE_USER_ID: "dpro_hair_member_line_user_id",
    MEMBER_CUSTOMER_NO: "dpro_hair_member_customer_no",
    MEMBER_PUBLIC_TOKEN: "dpro_hair_member_public_token",
    CHECKIN_TOKEN: "dpro_hair_checkin_token",
    LAST_CUSTOMER_ID: "dpro_hair_last_customer_id",
    LAST_RESERVATION_ID: "dpro_hair_last_reservation_id",
    LAST_MENU_ID: "dpro_hair_last_menu_id",
    LAST_MENU_SET_ID: "dpro_hair_last_menu_set_id",
    LAST_STAFF_ID: "dpro_hair_last_staff_id",
  });

  const PAGES = Object.freeze({
    RESERVATION: "index.html",
    INDEX: "index.html",
    MEMBER: "member.html",
    OWNER: "owner.html",
    STAFF: "staff.html",
    OWNER_IPAD: "owner-ipad.html",
    SYSTEM_CHECK: "system-check.html",
  });

  const ENDPOINTS = Object.freeze({
    ROOT: "/",
    HEALTH: "/api/health",

    PUBLIC_CONFIG: "/api/public/config",
    PUBLIC_CATALOG: "/api/public/catalog",
    PUBLIC_RESERVATION_OPTIONS: "/api/public/reservation-options",
    PUBLIC_AVAILABILITY: "/api/public/availability",
    PUBLIC_RESERVATIONS: "/api/public/reservations",
    PUBLIC_REBOOK_OPTIONS: "/api/public/rebook-options",
    PUBLIC_REBOOK: "/api/public/rebook",
    PUBLIC_CHECKIN: "/api/public/checkin",
    PUBLIC_CHECKIN_STATUS: "/api/public/checkin-status",
    PUBLIC_CONTACT: "/api/public/contact",
    PUBLIC_CANCEL_REQUEST: "/api/public/cancel-request",
    MEMBER_PROFILE: "/api/member/profile",

    ADMIN_DEMO_PREPARE: "/api/admin/demo/prepare",
    ADMIN_DASHBOARD: "/api/admin/dashboard",
    ADMIN_TODAY: "/api/admin/today",
    ADMIN_DAY: "/api/admin/day",
    ADMIN_SEARCH: "/api/admin/search",
    ADMIN_CUSTOMER_DETAIL: "/api/admin/customer-detail",
    ADMIN_RESERVATION_DETAIL: "/api/admin/reservation-detail",
    ADMIN_FOLLOW_TASKS: "/api/admin/follow-tasks",
    ADMIN_FOLLOW_ACTION_LOGS: "/api/admin/follow-action-logs",
    ADMIN_STAFF: "/api/admin/staff",
    ADMIN_MENUS: "/api/admin/menus",
    ADMIN_MENU_SETS: "/api/admin/menu-sets",
    ADMIN_NEXT_PROPOSALS: "/api/admin/next-proposals",
    ADMIN_CHECKINS: "/api/admin/checkins",
    ADMIN_CSV_IMPORTS: "/api/admin/csv-imports",
    ADMIN_MERGE_CANDIDATES: "/api/admin/merge-candidates",
    ADMIN_MESSAGE_TEMPLATES: "/api/admin/message-templates",
    ADMIN_SETTINGS: "/api/admin/settings",
    ADMIN_SYSTEM_CHECK: "/api/admin/system-check",
    ADMIN_PHONE_NORMALIZE_CHECK: "/api/admin/phone-normalize-check",

    ADMIN_MANUAL_RESERVATION: "/api/admin/reservations/manual-create",
    ADMIN_RESERVATION_STATUS: "/api/admin/reservations/status",
    ADMIN_CUSTOMER_SAVE: "/api/admin/customers/save",
    ADMIN_CUSTOMER_DELETE: "/api/admin/customers/delete",
    ADMIN_CUSTOMER_NOTE_SAVE: "/api/admin/customer-notes/save",
    ADMIN_CUSTOMER_MERGE: "/api/admin/customers/merge",
    ADMIN_HAIR_RECORD_SAVE: "/api/admin/hair-records/save",
    ADMIN_COLOR_RECORD_SAVE: "/api/admin/color-records/save",
    ADMIN_PERM_RECORD_SAVE: "/api/admin/perm-records/save",
    ADMIN_STRAIGHTENING_RECORD_SAVE: "/api/admin/straightening-records/save",
    ADMIN_PHOTO_UPLOAD: "/api/admin/photos/upload",
    ADMIN_PHOTO_DELETE: "/api/admin/photos/delete",
    ADMIN_FOLLOW_TASK_STATUS: "/api/admin/follow-tasks/status",
    ADMIN_FOLLOW_ACTION_SAVE: "/api/admin/follow-actions/save",
    ADMIN_NEXT_PROPOSAL_SAVE: "/api/admin/next-proposals/save",
    ADMIN_NEXT_PROPOSAL_STATUS: "/api/admin/next-proposals/status",
    ADMIN_CHECKIN_UNDO: "/api/admin/checkins/undo",
    ADMIN_MESSAGE_LOG_COPY: "/api/admin/messages/log-copy",
    ADMIN_SETTINGS_SAVE: "/api/admin/settings/save",
    ADMIN_STAFF_SAVE: "/api/admin/staff/save",
    ADMIN_MENU_SAVE: "/api/admin/menus/save",
    ADMIN_MENU_SET_SAVE: "/api/admin/menu-sets/save",
    ADMIN_MESSAGE_TEMPLATE_SAVE: "/api/admin/message-templates/save",
    ADMIN_CSV_PREVIEW: "/api/admin/csv/preview",
    ADMIN_CSV_EXECUTE: "/api/admin/csv/execute",
    ADMIN_MERGE_CANDIDATE_REVIEW: "/api/admin/merge-candidates/review",
  });

  const RESERVATION_STATUS = Object.freeze({
    RESERVED: "reserved",
    CONFIRMED: "confirmed",
    ARRIVED: "arrived",
    IN_SERVICE: "in_service",
    FINISHING: "finishing",
    PAYMENT_WAITING: "payment_waiting",
    COMPLETED: "completed",
    CANCEL_REQUESTED: "cancel_requested",
    CANCELLED: "cancelled",
    NO_SHOW: "no_show",
  });

  const RESERVATION_STATUS_LABELS = Object.freeze({
    reserved: "予約済み",
    confirmed: "確認済み",
    arrived: "来店済み",
    in_service: "施術中",
    finishing: "仕上げ中",
    payment_waiting: "会計待ち",
    completed: "退店済み",
    cancel_requested: "キャンセル希望",
    cancelled: "キャンセル",
    no_show: "無断キャンセル",
  });

  const FOLLOW_TYPE_LABELS = Object.freeze({
    aftercare: "施術後フォロー",
    next_visit: "次回来店",
    lost_customer: "しばらく来店がないお客様",
    product_recommend: "店販再購入・商品提案",
    birthday: "誕生日",
    color_maintenance: "カラーメンテナンス",
  });

  const FOLLOW_STATUS_LABELS = Object.freeze({
    pending: "未対応",
    done: "対応済み",
    skipped: "見送り",
    cancelled: "取消",
  });

  const FOLLOW_ACTION_LABELS = Object.freeze({
    copied: "文章コピー",
    contacted: "連絡済み",
    done: "対応完了",
    skipped: "見送り",
    rescheduled: "対応日変更",
    note: "メモ",
  });

  const NEXT_PROPOSAL_STATUS_LABELS = Object.freeze({
    proposed: "提案中",
    booked: "次回予約済み",
    completed: "来店完了",
    dismissed: "見送り",
    expired: "期限経過",
  });

  const PHOTO_TYPE_LABELS = Object.freeze({
    before: "Before",
    after: "After",
    detail: "部分写真",
    other: "その他",
  });

  const CAPTURE_AREA_LABELS = Object.freeze({
    front: "正面",
    back: "後ろ",
    left: "左側",
    right: "右側",
    top: "頭頂部",
    root: "根元",
    bangs: "前髪",
    detail: "部分",
    other: "その他",
  });

  const STAFF_ROLE_LABELS = Object.freeze({
    owner: "オーナー",
    manager: "店長",
    stylist: "スタイリスト",
    assistant: "アシスタント",
    reception: "受付",
  });

  const ASSIGNMENT_TYPE_LABELS = Object.freeze({
    any: "おまかせ",
    same_as_last: "前回と同じ担当",
    specific: "指名",
  });

  const MENU_CATEGORY_LABELS = Object.freeze({
    cut: "カット",
    color: "カラー",
    perm: "パーマ",
    straightening: "縮毛矯正",
    treatment: "トリートメント",
    headspa: "ヘッドスパ",
    other: "その他",
  });

  const FEATURE_KEYS = Object.freeze({
    MENU_CATALOG: "menu_catalog",
    MENU_SETS: "menu_sets",
    SAME_AS_LAST: "same_as_last",
    QR_CHECKIN: "qr_checkin",
    NEXT_PROPOSAL: "next_proposal",
    MEMBER_ALBUM: "member_album",
    CSV_IMPORT: "csv_import",
  });

  class DPROApiError extends Error {
    constructor(message, options) {
      super(message || "通信中にエラーが発生しました。");
      this.name = "DPROApiError";
      this.status = Number(options?.status || 0);
      this.code = String(options?.code || "API_ERROR");
      this.details = options?.details ?? null;
      this.response = options?.response ?? null;
      this.isNetworkError = Boolean(options?.isNetworkError);
      this.isTimeout = Boolean(options?.isTimeout);
      this.isUnauthorized = this.status === 401 || this.code === "ADMIN_UNAUTHORIZED";
    }
  }

  function normalizeBaseUrl(value) {
    return String(value || "").trim().replace(/\/+$/, "");
  }

  function normalizePath(value) {
    const path = String(value || "").trim();
    if (!path) return "/";
    return path.startsWith("/") ? path : `/${path}`;
  }

  function getStorage(type) {
    try {
      return type === "session" ? global.sessionStorage : global.localStorage;
    } catch {
      return null;
    }
  }

  function readStoredValue(key, fallbackValue = "", type = "local") {
    try {
      const storage = getStorage(type);
      const value = storage?.getItem(key);
      return value === null || value === undefined ? fallbackValue : value;
    } catch {
      return fallbackValue;
    }
  }

  function writeStoredValue(key, value, type = "local") {
    const normalized = String(value ?? "").trim();
    try {
      const storage = getStorage(type);
      if (!storage) return false;
      if (!normalized) storage.removeItem(key);
      else storage.setItem(key, normalized);
      return true;
    } catch {
      return false;
    }
  }

  function removeStoredValue(key, type = "local") {
    try {
      const storage = getStorage(type);
      storage?.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  function getShopCode() {
    return readStoredValue(STORAGE_KEYS.SHOP_CODE, DEFAULT_SHOP_CODE) || DEFAULT_SHOP_CODE;
  }

  function saveShopCode(shopCode) {
    const normalized = String(shopCode || "").trim() || DEFAULT_SHOP_CODE;
    writeStoredValue(STORAGE_KEYS.SHOP_CODE, normalized);
    dispatch("dpro:shop-code-changed", { shop_code: normalized });
    return normalized;
  }

  function resetShopCode() {
    removeStoredValue(STORAGE_KEYS.SHOP_CODE);
    dispatch("dpro:shop-code-changed", { shop_code: DEFAULT_SHOP_CODE });
    return DEFAULT_SHOP_CODE;
  }

  function getAdminCode() {
    return readStoredValue(STORAGE_KEYS.ADMIN_CODE, "");
  }

  function saveAdminCode(adminCode) {
    const normalized = toHalfWidth(String(adminCode || "")).trim();
    if (!normalized) throw new Error("管理コードを入力してください。");
    if (normalized.length > 128) throw new Error("管理コードが長すぎます。");
    writeStoredValue(STORAGE_KEYS.ADMIN_CODE, normalized);
    dispatch("dpro:admin-code-changed", { saved: true });
    return normalized;
  }

  function clearAdminCode() {
    removeStoredValue(STORAGE_KEYS.ADMIN_CODE);
    dispatch("dpro:admin-code-changed", { saved: false });
    return true;
  }

  function hasAdminCode() {
    return Boolean(getAdminCode());
  }

  function requireAdminCode() {
    const adminCode = getAdminCode();
    if (!adminCode) {
      throw new DPROApiError("管理コードが保存されていません。", {
        status: 401,
        code: "ADMIN_CODE_REQUIRED",
      });
    }
    return adminCode;
  }

  function normalizePhone(value) {
    let phone = toHalfWidth(String(value ?? ""))
      .replace(/[‐‑‒–—―ー−ｰ]/g, "-")
      .replace(/[^\d+]/g, "");

    if (phone.startsWith("+81")) phone = `0${phone.slice(3)}`;
    else if (phone.startsWith("0081")) phone = `0${phone.slice(4)}`;
    else if (phone.startsWith("81") && !phone.startsWith("810")) phone = `0${phone.slice(2)}`;

    return phone.replace(/\D/g, "");
  }

  function isLikelyJapanesePhone(value) {
    return /^0\d{9,10}$/.test(normalizePhone(value));
  }

  function formatPhone(value) {
    const phone = normalizePhone(value);
    if (!phone) return "";
    if (/^(070|080|090|050)\d{8}$/.test(phone)) return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
    if (/^0120\d{6}$/.test(phone)) return `${phone.slice(0, 4)}-${phone.slice(4, 7)}-${phone.slice(7)}`;
    if (/^0\d{9}$/.test(phone)) return `${phone.slice(0, 2)}-${phone.slice(2, 6)}-${phone.slice(6)}`;
    if (/^0\d{10}$/.test(phone)) return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
    return phone;
  }

  function saveMemberIdentity(values = {}) {
    if (values.phone !== undefined) writeStoredValue(STORAGE_KEYS.MEMBER_PHONE, normalizePhone(values.phone));
    if (values.line_user_id !== undefined) writeStoredValue(STORAGE_KEYS.MEMBER_LINE_USER_ID, values.line_user_id);
    if (values.customer_no !== undefined) writeStoredValue(STORAGE_KEYS.MEMBER_CUSTOMER_NO, values.customer_no);
    if (values.public_token !== undefined) writeStoredValue(STORAGE_KEYS.MEMBER_PUBLIC_TOKEN, values.public_token);
    dispatch("dpro:member-identity-changed", { saved: true });
    return getMemberIdentity();
  }

  function getMemberIdentity() {
    return {
      phone: readStoredValue(STORAGE_KEYS.MEMBER_PHONE, ""),
      line_user_id: readStoredValue(STORAGE_KEYS.MEMBER_LINE_USER_ID, ""),
      customer_no: readStoredValue(STORAGE_KEYS.MEMBER_CUSTOMER_NO, ""),
      public_token: readStoredValue(STORAGE_KEYS.MEMBER_PUBLIC_TOKEN, ""),
    };
  }

  function clearMemberIdentity() {
    removeStoredValue(STORAGE_KEYS.MEMBER_PHONE);
    removeStoredValue(STORAGE_KEYS.MEMBER_LINE_USER_ID);
    removeStoredValue(STORAGE_KEYS.MEMBER_CUSTOMER_NO);
    removeStoredValue(STORAGE_KEYS.MEMBER_PUBLIC_TOKEN);
    dispatch("dpro:member-identity-changed", { saved: false });
    return true;
  }

  function toHalfWidth(value) {
    return String(value ?? "")
      .replace(/[！-～]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0xfee0))
      .replace(/　/g, " ");
  }

  function normalizeLineBreaks(value) {
    return String(value ?? "")
      .replace(/\\r\\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\r\n?/g, "\n");
  }

  function normalizeWhitespace(value) {
    return normalizeLineBreaks(value)
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function parseDateInput(value) {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const text = String(value ?? "").trim();
    if (!text) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      const [year, month, day] = text.split("-").map(Number);
      const date = new Date(year, month - 1, day, 12, 0, 0);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    const date = new Date(text.includes(" ") ? text.replace(" ", "T") : text);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDate(value, options = {}) {
    const date = parseDateInput(value);
    if (!date) return options.fallback ?? "";
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone: options.timeZone || TIME_ZONE,
      year: options.year || "numeric",
      month: options.month || "numeric",
      day: options.day || "numeric",
      weekday: options.weekday === false ? undefined : options.weekday || "short",
    }).format(date);
  }

  function formatTime(value, options = {}) {
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(String(value || ""))) return String(value).slice(0, 5);
    const date = parseDateInput(value);
    if (!date) return options.fallback ?? "";
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone: options.timeZone || TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  function formatDateTime(value, options = {}) {
    const date = parseDateInput(value);
    if (!date) return options.fallback ?? "";
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone: options.timeZone || TIME_ZONE,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      weekday: options.weekday === false ? undefined : "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  function getTokyoDateParts(value = new Date()) {
    const date = parseDateInput(value) || new Date();
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const result = {};
    for (const part of parts) if (part.type !== "literal") result[part.type] = part.value;
    return result;
  }

  function todayISO() {
    const parts = getTokyoDateParts();
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function nowTokyoLabel() {
    return formatDateTime(new Date());
  }

  function addDaysISO(dateValue, amount) {
    const date = parseDateInput(dateValue || todayISO());
    if (!date) return "";
    date.setDate(date.getDate() + Number(amount || 0));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function minutesToLabel(value) {
    const minutes = Math.max(0, Number(value || 0));
    if (!Number.isFinite(minutes)) return "";
    const hours = Math.floor(minutes / 60);
    const remain = minutes % 60;
    if (!hours) return `${remain}分`;
    if (!remain) return `${hours}時間`;
    return `${hours}時間${remain}分`;
  }

  function yen(value, fallback = "—") {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return fallback;
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeText(value, fallback = "—") {
    const text = String(value ?? "").trim();
    return text || fallback;
  }

  function query(selector, root = global.document) {
    return root?.querySelector?.(selector) || null;
  }

  function queryAll(selector, root = global.document) {
    return Array.from(root?.querySelectorAll?.(selector) || []);
  }

  function setText(target, value, fallback = "") {
    const element = typeof target === "string" ? query(target) : target;
    if (!element) return false;
    element.textContent = String(value ?? fallback);
    return true;
  }

  function setVisible(target, visible) {
    const element = typeof target === "string" ? query(target) : target;
    if (!element) return false;
    element.hidden = !visible;
    element.setAttribute("aria-hidden", visible ? "false" : "true");
    return true;
  }

  function getQueryParam(name, fallback = "") {
    try {
      const value = new URL(global.location.href).searchParams.get(name);
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  }

  function setQueryParams(params, options = {}) {
    const url = new URL(global.location.href);
    for (const [key, value] of Object.entries(params || {})) {
      if (value === undefined || value === null || value === "") url.searchParams.delete(key);
      else url.searchParams.set(key, String(value));
    }
    if (options.replace !== false) global.history?.replaceState?.({}, "", url.toString());
    else global.history?.pushState?.({}, "", url.toString());
    return url.toString();
  }

  function buildPageUrl(page, params = {}) {
    const fileName = PAGES[page] || page || PAGES.RESERVATION;
    const url = new URL(String(fileName).replace(/^\/+/, ""), `${normalizeBaseUrl(SITE_BASE_URL)}/`);
    const merged = { shop_code: getShopCode(), ...params };
    for (const [key, value] of Object.entries(merged)) {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  function buildFeatureUrl(feature, params = {}) {
    const name = String(feature || "reservation").toLowerCase();
    if (name === "catalog") return buildPageUrl("RESERVATION", { view: "catalog", ...params });
    if (name === "checkin") return buildPageUrl("RESERVATION", { view: "checkin", ...params });
    if (name === "rebook") return buildPageUrl("RESERVATION", { view: "rebook", ...params });
    if (name === "member") return buildPageUrl("MEMBER", params);
    return buildPageUrl("RESERVATION", params);
  }

  function buildCatalogUrl(params = {}) {
    return buildFeatureUrl("catalog", params);
  }

  function buildCheckinUrl(params = {}) {
    return buildFeatureUrl("checkin", params);
  }

  function buildRebookUrl(params = {}) {
    return buildFeatureUrl("rebook", params);
  }

  function buildApiUrl(path, params = {}) {
    const url = new URL(normalizePath(path), `${normalizeBaseUrl(API_BASE_URL)}/`);
    const mergedParams = { shop_code: getShopCode(), ...params };
    for (const [key, value] of Object.entries(mergedParams)) {
      if (value === undefined || value === null || value === "") continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, String(item));
      else url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  function userFriendlyErrorMessage(error, fallback = "処理に失敗しました。") {
    if (!error) return fallback;
    const code = String(error.code || error?.response?.error?.code || "");
    const messages = {
      ADMIN_CODE_REQUIRED: "管理コードを入力して保存してください。",
      ADMIN_UNAUTHORIZED: "管理コードが正しくありません。",
      REQUEST_TIMEOUT: "通信に時間がかかっています。もう一度お試しください。",
      NETWORK_ERROR: "サーバーへ接続できませんでした。通信環境を確認してください。",
      SLOT_UNAVAILABLE: "選択した時間は予約できなくなりました。別の時間を選択してください。",
      PAST_DATE: "過去の日付は選択できません。",
      CATALOG_DISABLED: "メニューカタログは現在公開されていません。",
      CHECKIN_DISABLED: "来店受付は現在利用できません。",
      CSV_IMPORT_DISABLED: "CSV取込は現在利用できません。",
    };
    return messages[code] || error.message || fallback;
  }

  async function request(path, options = {}) {
    const method = String(options.method || "GET").toUpperCase();
    const isAdmin = Boolean(options.admin);
    const timeoutMs = Number(options.timeoutMs || (options.body instanceof FormData ? PHOTO_UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS));
    const url = buildApiUrl(path, { ...(options.query || {}) });
    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");
    headers.set("X-Requested-With", "DPRO-Hair-Salon");

    if (isAdmin) headers.set("X-Admin-Code", options.adminCode || requireAdminCode());

    let body = options.body;
    if (
      body !== undefined && body !== null &&
      !(body instanceof FormData) && !(body instanceof Blob) &&
      !(body instanceof ArrayBuffer) && typeof body !== "string"
    ) {
      body = JSON.stringify({ shop_code: getShopCode(), ...body });
      if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    }

    const controller = new AbortController();
    const timeoutId = global.setTimeout(() => controller.abort("request-timeout"), timeoutMs);
    if (options.signal) {
      if (options.signal.aborted) controller.abort(options.signal.reason);
      else options.signal.addEventListener("abort", () => controller.abort(options.signal.reason), { once: true });
    }

    try {
      const response = await global.fetch(url, {
        method,
        headers,
        body: method === "GET" || method === "HEAD" ? undefined : body,
        signal: controller.signal,
        cache: options.cache || "no-store",
        credentials: options.credentials || "omit",
      });

      const contentType = response.headers.get("Content-Type") || "";
      let payload = null;
      if (response.status === 204) payload = { ok: true };
      else if (contentType.includes("application/json")) payload = await response.json().catch(() => null);
      else {
        const text = await response.text().catch(() => "");
        payload = text ? { ok: response.ok, message: text } : null;
      }

      if (!response.ok || payload?.ok === false) {
        throw new DPROApiError(
          payload?.error?.message || payload?.message || `通信に失敗しました。（HTTP ${response.status}）`,
          {
            status: response.status,
            code: payload?.error?.code || payload?.code || "API_ERROR",
            details: payload?.error?.details || payload?.details || null,
            response: payload,
          },
        );
      }
      return payload;
    } catch (error) {
      if (error instanceof DPROApiError) throw error;
      if (error?.name === "AbortError") {
        throw new DPROApiError("通信がタイムアウトしました。もう一度お試しください。", {
          status: 0,
          code: "REQUEST_TIMEOUT",
          isTimeout: true,
        });
      }
      throw new DPROApiError("サーバーへ接続できませんでした。通信環境を確認してください。", {
        status: 0,
        code: "NETWORK_ERROR",
        details: error?.message || null,
        isNetworkError: true,
      });
    } finally {
      global.clearTimeout(timeoutId);
    }
  }

  function get(path, queryParams = {}, options = {}) {
    return request(path, { ...options, method: "GET", query: queryParams });
  }

  function post(path, body = {}, options = {}) {
    return request(path, { ...options, method: "POST", body });
  }

  function adminGet(path, queryParams = {}, options = {}) {
    return get(path, queryParams, { ...options, admin: true });
  }

  function adminPost(path, body = {}, options = {}) {
    return post(path, body, { ...options, admin: true });
  }

  function uploadPhoto(values, file, options = {}) {
    if (!(file instanceof File) && !(file instanceof Blob)) throw new Error("アップロードする写真を選択してください。");
    const formData = new FormData();
    formData.append("shop_code", getShopCode());
    for (const [key, value] of Object.entries(values || {})) {
      if (value !== undefined && value !== null && value !== "") formData.append(key, String(value));
    }
    formData.append("file", file, file.name || "photo.jpg");
    return request(ENDPOINTS.ADMIN_PHOTO_UPLOAD, {
      method: "POST",
      body: formData,
      admin: true,
      adminCode: options.adminCode,
      timeoutMs: options.timeoutMs || PHOTO_UPLOAD_TIMEOUT_MS,
    });
  }

  function healthCheck(options = {}) {
    return get(ENDPOINTS.HEALTH, {}, options);
  }

  async function verifyWorker(options = {}) {
    const health = await healthCheck(options);
    return {
      ok: Boolean(health?.ok),
      expected_version: EXPECTED_WORKER_VERSION,
      actual_version: health?.version || null,
      version_match: health?.version === EXPECTED_WORKER_VERSION,
      health,
    };
  }

  function publicConfig(options = {}) {
    return get(ENDPOINTS.PUBLIC_CONFIG, {}, options);
  }

  function publicCatalog(queryParams = {}, options = {}) {
    return get(ENDPOINTS.PUBLIC_CATALOG, queryParams, options);
  }

  function reservationOptions(queryParams = {}, options = {}) {
    return get(ENDPOINTS.PUBLIC_RESERVATION_OPTIONS, queryParams, options);
  }

  function availability(queryParams = {}, options = {}) {
    return get(ENDPOINTS.PUBLIC_AVAILABILITY, queryParams, options);
  }

  function createReservation(body, options = {}) {
    return post(ENDPOINTS.PUBLIC_RESERVATIONS, body, options);
  }

  function rebookOptions(queryParams = {}, options = {}) {
    return get(ENDPOINTS.PUBLIC_REBOOK_OPTIONS, queryParams, options);
  }

  function rebook(body, options = {}) {
    return post(ENDPOINTS.PUBLIC_REBOOK, body, options);
  }

  function checkin(body, options = {}) {
    return post(ENDPOINTS.PUBLIC_CHECKIN, body, options);
  }

  function checkinStatus(queryParams = {}, options = {}) {
    return get(ENDPOINTS.PUBLIC_CHECKIN_STATUS, queryParams, options);
  }

  function memberProfile(queryParams = null, options = {}) {
    const identity = queryParams && Object.keys(queryParams).length ? queryParams : getMemberIdentity();
    return get(ENDPOINTS.MEMBER_PROFILE, identity, options);
  }

  function requestContact(body, options = {}) {
    return post(ENDPOINTS.PUBLIC_CONTACT, body, options);
  }

  function requestCancel(body, options = {}) {
    return post(ENDPOINTS.PUBLIC_CANCEL_REQUEST, body, options);
  }

  function demoPrepare(options = {}) {
    return adminPost(ENDPOINTS.ADMIN_DEMO_PREPARE, {}, {
      ...options,
      timeoutMs: options.timeoutMs || 45000,
    });
  }

  function systemCheck(queryParams = {}, options = {}) {
    return adminGet(ENDPOINTS.ADMIN_SYSTEM_CHECK, queryParams, {
      ...options,
      timeoutMs: options.timeoutMs || 60000,
    });
  }

  function todayDashboard(queryParams = {}, options = {}) {
    return adminGet(ENDPOINTS.ADMIN_TODAY, queryParams, options);
  }

  function menuSets(queryParams = {}, options = {}) {
    return adminGet(ENDPOINTS.ADMIN_MENU_SETS, queryParams, options);
  }

  function saveMenuSet(body = {}, options = {}) {
    return adminPost(ENDPOINTS.ADMIN_MENU_SET_SAVE, body, options);
  }

  function nextProposals(queryParams = {}, options = {}) {
    return adminGet(ENDPOINTS.ADMIN_NEXT_PROPOSALS, queryParams, options);
  }

  function saveNextProposal(body = {}, options = {}) {
    return adminPost(ENDPOINTS.ADMIN_NEXT_PROPOSAL_SAVE, body, options);
  }

  function updateNextProposalStatus(body = {}, options = {}) {
    return adminPost(ENDPOINTS.ADMIN_NEXT_PROPOSAL_STATUS, body, options);
  }

  function followActionLogs(queryParams = {}, options = {}) {
    return adminGet(ENDPOINTS.ADMIN_FOLLOW_ACTION_LOGS, queryParams, options);
  }

  function saveFollowAction(body = {}, options = {}) {
    return adminPost(ENDPOINTS.ADMIN_FOLLOW_ACTION_SAVE, body, options);
  }

  function checkins(queryParams = {}, options = {}) {
    return adminGet(ENDPOINTS.ADMIN_CHECKINS, queryParams, options);
  }

  function undoCheckin(body = {}, options = {}) {
    return adminPost(ENDPOINTS.ADMIN_CHECKIN_UNDO, body, options);
  }

  function csvImports(queryParams = {}, options = {}) {
    return adminGet(ENDPOINTS.ADMIN_CSV_IMPORTS, queryParams, options);
  }

  function csvPreview(body = {}, options = {}) {
    return adminPost(ENDPOINTS.ADMIN_CSV_PREVIEW, body, {
      ...options,
      timeoutMs: options.timeoutMs || CSV_TIMEOUT_MS,
    });
  }

  function csvExecute(body = {}, options = {}) {
    return adminPost(ENDPOINTS.ADMIN_CSV_EXECUTE, body, {
      ...options,
      timeoutMs: options.timeoutMs || CSV_TIMEOUT_MS,
    });
  }

  function mergeCandidates(queryParams = {}, options = {}) {
    return adminGet(ENDPOINTS.ADMIN_MERGE_CANDIDATES, queryParams, options);
  }

  function reviewMergeCandidate(body = {}, options = {}) {
    return adminPost(ENDPOINTS.ADMIN_MERGE_CANDIDATE_REVIEW, body, options);
  }

  function mergeCustomers(body = {}, options = {}) {
    return adminPost(ENDPOINTS.ADMIN_CUSTOMER_MERGE, body, {
      ...options,
      timeoutMs: options.timeoutMs || 60000,
    });
  }

  async function copyText(value, options = {}) {
    const text = normalizeLineBreaks(value);
    if (!text) throw new Error("コピーする内容がありません。");
    let copied = false;
    try {
      if (global.navigator?.clipboard?.writeText && global.isSecureContext) {
        await global.navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch {
      copied = false;
    }
    if (!copied && global.document) {
      const textArea = global.document.createElement("textarea");
      textArea.value = text;
      textArea.setAttribute("readonly", "");
      Object.assign(textArea.style, {
        position: "fixed",
        opacity: "0",
        pointerEvents: "none",
      });
      global.document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      copied = Boolean(global.document.execCommand?.("copy"));
      textArea.remove();
    }
    if (!copied) throw new Error("コピーできませんでした。文字を選択してコピーしてください。");
    if (options.toast !== false) showToast(options.message || "コピーしました。", "success");
    return text;
  }

  function ensureToastContainer() {
    if (!global.document) return null;
    let container = global.document.getElementById("dpro-toast-container");
    if (container) return container;
    container = global.document.createElement("div");
    container.id = "dpro-toast-container";
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-atomic", "true");
    Object.assign(container.style, {
      position: "fixed",
      top: "16px",
      right: "16px",
      zIndex: "99999",
      display: "grid",
      gap: "10px",
      maxWidth: "min(92vw, 420px)",
      pointerEvents: "none",
    });
    global.document.body.appendChild(container);
    return container;
  }

  function showToast(message, type = "info", options = {}) {
    const container = ensureToastContainer();
    const text = safeText(message, "処理が完了しました。");
    if (!container) return null;
    const toast = global.document.createElement("div");
    toast.className = `dpro-toast dpro-toast--${type}`;
    toast.setAttribute("role", type === "error" ? "alert" : "status");
    const palette = {
      success: { background: "#ecfdf3", border: "#16a34a", text: "#14532d" },
      error: { background: "#fff1f2", border: "#dc2626", text: "#7f1d1d" },
      warning: { background: "#fffbeb", border: "#d97706", text: "#78350f" },
      info: { background: "#eff6ff", border: "#2563eb", text: "#1e3a8a" },
    };
    const selected = palette[type] || palette.info;
    Object.assign(toast.style, {
      pointerEvents: "auto",
      padding: "12px 14px",
      borderRadius: "12px",
      border: `1px solid ${selected.border}`,
      borderLeft: `5px solid ${selected.border}`,
      background: selected.background,
      color: selected.text,
      boxShadow: "0 8px 28px rgba(15, 23, 42, 0.18)",
      fontSize: "14px",
      lineHeight: "1.5",
      fontWeight: "700",
      whiteSpace: "pre-wrap",
      overflowWrap: "anywhere",
      opacity: "0",
      transform: "translateY(-8px)",
      transition: "opacity .18s ease, transform .18s ease",
    });
    toast.textContent = text;
    container.appendChild(toast);
    global.requestAnimationFrame?.(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });
    const duration = Number(options.duration || (type === "error" ? 6000 : 3200));
    global.setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-8px)";
      global.setTimeout(() => toast.remove(), 220);
    }, duration);
    return toast;
  }

  function errorMessage(error, fallback = "処理に失敗しました。") {
    return userFriendlyErrorMessage(error, fallback);
  }

  function showError(error, fallback) {
    const message = errorMessage(error, fallback);
    showToast(message, "error");
    return message;
  }

  async function withButtonBusy(button, busyLabel, task, options = {}) {
    const element = typeof button === "string" ? query(button) : button;
    const originalText = element?.textContent || "";
    if (element) {
      if (element.dataset.dproBusy === "1") return null;
      element.dataset.dproBusy = "1";
      element.disabled = true;
      element.setAttribute("aria-busy", "true");
      element.textContent = busyLabel || "処理中...";
    }
    try {
      return await task();
    } catch (error) {
      if (options.showError !== false) showError(error, options.errorMessage);
      throw error;
    } finally {
      if (element) {
        element.dataset.dproBusy = "0";
        element.disabled = false;
        element.removeAttribute("aria-busy");
        element.textContent = options.doneLabel || originalText;
      }
    }
  }

  function debounce(callback, delay = 300) {
    let timerId = null;
    return function debounced(...args) {
      global.clearTimeout(timerId);
      timerId = global.setTimeout(() => callback.apply(this, args), delay);
    };
  }

  function groupBy(items, keyOrGetter) {
    const getter = typeof keyOrGetter === "function" ? keyOrGetter : (item) => item?.[keyOrGetter];
    return (items || []).reduce((result, item) => {
      const key = String(getter(item) ?? "");
      if (!result[key]) result[key] = [];
      result[key].push(item);
      return result;
    }, {});
  }

  function sortByTime(items, key = "start_time") {
    return [...(items || [])].sort((left, right) => String(left?.[key] || "").localeCompare(String(right?.[key] || "")));
  }

  function uniqueBy(items, keyOrGetter) {
    const getter = typeof keyOrGetter === "function" ? keyOrGetter : (item) => item?.[keyOrGetter];
    const seen = new Set();
    return (items || []).filter((item) => {
      const key = getter(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function dispatch(name, detail = {}) {
    try {
      global.dispatchEvent(new CustomEvent(name, { detail }));
    } catch {
      // CustomEventが利用できない環境では通知を省略する。
    }
  }

  function onReady(callback) {
    if (!global.document) {
      callback();
      return;
    }
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else callback();
  }

  function statusLabel(status) {
    return RESERVATION_STATUS_LABELS[status] || safeText(status);
  }

  function followTypeLabel(type) {
    return FOLLOW_TYPE_LABELS[type] || safeText(type);
  }

  function followStatusLabel(status) {
    return FOLLOW_STATUS_LABELS[status] || safeText(status);
  }

  function followActionLabel(action) {
    return FOLLOW_ACTION_LABELS[action] || safeText(action);
  }

  function nextProposalStatusLabel(status) {
    return NEXT_PROPOSAL_STATUS_LABELS[status] || safeText(status);
  }

  function photoTypeLabel(type) {
    return PHOTO_TYPE_LABELS[type] || safeText(type);
  }

  function captureAreaLabel(area) {
    return CAPTURE_AREA_LABELS[area] || safeText(area);
  }

  function staffRoleLabel(role) {
    return STAFF_ROLE_LABELS[role] || safeText(role);
  }

  function assignmentTypeLabel(type) {
    return ASSIGNMENT_TYPE_LABELS[type] || safeText(type);
  }

  function isActiveReservationStatus(status) {
    return [
      RESERVATION_STATUS.RESERVED,
      RESERVATION_STATUS.CONFIRMED,
      RESERVATION_STATUS.ARRIVED,
      RESERVATION_STATUS.IN_SERVICE,
      RESERVATION_STATUS.FINISHING,
      RESERVATION_STATUS.PAYMENT_WAITING,
      RESERVATION_STATUS.CANCEL_REQUESTED,
    ].includes(status);
  }

  const api = Object.freeze({
    baseUrl: API_BASE_URL,
    endpoints: ENDPOINTS,
    request,
    get,
    post,
    adminGet,
    adminPost,
    uploadPhoto,
    healthCheck,
    verifyWorker,
    publicConfig,
    publicCatalog,
    reservationOptions,
    availability,
    createReservation,
    rebookOptions,
    rebook,
    checkin,
    checkinStatus,
    memberProfile,
    requestContact,
    requestCancel,
    demoPrepare,
    systemCheck,
    todayDashboard,
    menuSets,
    saveMenuSet,
    nextProposals,
    saveNextProposal,
    updateNextProposalStatus,
    followActionLogs,
    saveFollowAction,
    checkins,
    undoCheckin,
    csvImports,
    csvPreview,
    csvExecute,
    mergeCandidates,
    reviewMergeCandidate,
    mergeCustomers,
  });

  const admin = Object.freeze({
    getCode: getAdminCode,
    saveCode: saveAdminCode,
    clearCode: clearAdminCode,
    hasCode: hasAdminCode,
    requireCode: requireAdminCode,
  });

  const shop = Object.freeze({
    getCode: getShopCode,
    saveCode: saveShopCode,
    resetCode: resetShopCode,
  });

  const member = Object.freeze({
    getIdentity: getMemberIdentity,
    saveIdentity: saveMemberIdentity,
    clearIdentity: clearMemberIdentity,
  });

  const urls = Object.freeze({
    siteBaseUrl: SITE_BASE_URL,
    apiBaseUrl: API_BASE_URL,
    index: buildPageUrl("INDEX"),
    reservation: buildPageUrl("RESERVATION"),
    member: buildPageUrl("MEMBER"),
    owner: buildPageUrl("OWNER"),
    staff: buildPageUrl("STAFF"),
    ownerIpad: buildPageUrl("OWNER_IPAD"),
    systemCheck: buildPageUrl("SYSTEM_CHECK"),
    catalog: buildCatalogUrl(),
    checkin: buildCheckinUrl(),
    rebook: buildRebookUrl(),
  });

  const system = Object.freeze({
    version: VERSION,
    expectedWorkerVersion: EXPECTED_WORKER_VERSION,
    serviceName: SERVICE_NAME,
    nextStandard: NEXT_STANDARD,
    legacyCompatible: LEGACY_COMPATIBLE,
  });

  const demo = Object.freeze({
    shopCode: DEFAULT_SHOP_CODE,
    adminCode: "1234",
    customerNo: "HAIR-DEMO-001",
  });

  const utils = Object.freeze({
    normalizePhone,
    isLikelyJapanesePhone,
    formatPhone,
    toHalfWidth,
    normalizeLineBreaks,
    normalizeWhitespace,
    parseDateInput,
    formatDate,
    formatTime,
    formatDateTime,
    getTokyoDateParts,
    todayISO,
    nowTokyoLabel,
    addDaysISO,
    minutesToLabel,
    yen,
    escapeHtml,
    safeText,
    query,
    queryAll,
    setText,
    setVisible,
    getQueryParam,
    setQueryParams,
    buildPageUrl,
    buildFeatureUrl,
    buildCatalogUrl,
    buildCheckinUrl,
    buildRebookUrl,
    buildApiUrl,
    copyText,
    showToast,
    showError,
    errorMessage,
    userFriendlyErrorMessage,
    withButtonBusy,
    debounce,
    groupBy,
    sortByTime,
    uniqueBy,
    dispatch,
    onReady,
    statusLabel,
    followTypeLabel,
    followStatusLabel,
    followActionLabel,
    nextProposalStatusLabel,
    photoTypeLabel,
    captureAreaLabel,
    staffRoleLabel,
    assignmentTypeLabel,
    isActiveReservationStatus,
  });

  const config = Object.freeze({
    VERSION,
    EXPECTED_WORKER_VERSION,
    SERVICE_NAME,
    API_BASE_URL,
    SITE_BASE_URL,
    DEFAULT_SHOP_CODE,
    TIME_ZONE,
    REQUEST_TIMEOUT_MS,
    PHOTO_UPLOAD_TIMEOUT_MS,
    CSV_TIMEOUT_MS,
    NEXT_STANDARD,
    LEGACY_COMPATIBLE,
    STORAGE_KEYS,
    PAGES,
    ENDPOINTS,
    RESERVATION_STATUS,
    RESERVATION_STATUS_LABELS,
    FOLLOW_TYPE_LABELS,
    FOLLOW_STATUS_LABELS,
    FOLLOW_ACTION_LABELS,
    NEXT_PROPOSAL_STATUS_LABELS,
    PHOTO_TYPE_LABELS,
    CAPTURE_AREA_LABELS,
    STAFF_ROLE_LABELS,
    ASSIGNMENT_TYPE_LABELS,
    MENU_CATEGORY_LABELS,
    FEATURE_KEYS,
    DPROApiError,
    system,
    api,
    admin,
    shop,
    member,
    urls,
    demo,
    utils,
  });

  global.DPROHairConfig = config;
  global.DPRO_HAIR_CONFIG = config;
  global.DPRO_HAIR = Object.freeze({
    config,
    api,
    admin,
    shop,
    member,
    urls,
    utils,
    apiFetch: request,
  });

  dispatch("dpro:config-ready", {
    version: VERSION,
    expected_worker_version: EXPECTED_WORKER_VERSION,
    service: SERVICE_NAME,
    next_standard: NEXT_STANDARD,
    legacy_compatible: LEGACY_COMPATIBLE,
  });
})(window);
