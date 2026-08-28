/* DPRO TUTORIAL HAIR / R4 GUIDE BRIDGE V1.1
 * R3 Standard V1.1 companion: exactly-10 replay/resume + safe guide target navigation.
 */
(() => {
  "use strict";
  const VERSION = "HAIR-R4-GUIDE-BRIDGE-V1.1-STANDARD10-20260828";
  const OWNER_TARGETS = {
    OWNER_NAV:{selector:".nav",view:""}, OWNER_ADMIN_AREA:{selector:"#topAdminCodeArea",view:""}, OWNER_ADMIN_CLEAR:{selector:"#topAdminCodeClear",view:""},
    OWNER_TODAY_NAV:{selector:'[data-view="today"]',view:"today"}, OWNER_TODAY_STATS:{selector:"#todayStats",view:"today"}, OWNER_STATUS_PIPELINE:{selector:"#statusPipeline",view:"today"}, OWNER_TODAY_RESERVATIONS:{selector:"#todayReservationTable",view:"today"}, OWNER_ATTENTION:{selector:"#attentionList",view:"today"}, OWNER_TODAY_FOLLOW:{selector:"#todayFollowList",view:"today"}, OWNER_MANUAL_ENTRY:{selector:'[data-action="open-manual"]',view:"today"},
    OWNER_RESERVATIONS_NAV:{selector:'[data-view="reservations"]',view:"reservations"}, OWNER_RESERVATION_STATUS:{selector:"#reservationStatusFilter",view:"reservations"}, OWNER_RESERVATION_KEYWORD:{selector:"#reservationKeyword",view:"reservations"}, OWNER_RESERVATION_LIST:{selector:"#reservationPageList",view:"reservations"},
    OWNER_CUSTOMERS_NAV:{selector:'[data-view="customers"]',view:"customers"}, OWNER_CUSTOMER_SEARCH:{selector:"#customerSearchInput",view:"customers"}, OWNER_CUSTOMER_LIST:{selector:"#customerList",view:"customers"}, OWNER_CUSTOMER_DETAIL:{selector:"#customerDetailCard",view:"customers"},
    OWNER_CARTE_NAV:{selector:'[data-view="carte"]',view:"carte"}, OWNER_CARTE_CONTENT:{selector:"#carteContent",view:"carte"}, OWNER_CARTE_RECORD:{selector:"#carteAddRecord",view:"carte"}, OWNER_CARTE_NOTE:{selector:"#carteAddNote",view:"carte"}, OWNER_CARTE_PROPOSAL:{selector:"#carteAddProposal",view:"carte"},
    OWNER_FOLLOW_NAV:{selector:'[data-view="follow"]',view:"follow"}, OWNER_FOLLOW_STATS:{selector:"#followStats",view:"follow"}, OWNER_FOLLOW_STATUS:{selector:"#followStatusFilter",view:"follow"}, OWNER_FOLLOW_TYPE:{selector:"#followTypeFilter",view:"follow"}, OWNER_FOLLOW_DUE:{selector:"#followDueFilter",view:"follow"}, OWNER_FOLLOW_LIST:{selector:"#followTaskList",view:"follow"}, OWNER_PROPOSAL_LIST:{selector:"#proposalList",view:"follow"}, OWNER_FOLLOW_HISTORY:{selector:"#followActionRecent",view:"follow"},
    OWNER_MENUS_NAV:{selector:'[data-view="menus"]',view:"menus"}, OWNER_MENU_GRID:{selector:"#menuGrid",view:"menus"}, OWNER_MENU_SET_GRID:{selector:"#menuSetGrid",view:"menus"},
    OWNER_STAFF_NAV:{selector:'[data-view="staff"]',view:"staff"}, OWNER_STAFF_GRID:{selector:"#staffGrid",view:"staff"}, OWNER_PHOTOS_NAV:{selector:'[data-view="photos"]',view:"photos"}, OWNER_PHOTO_CONTENT:{selector:"#photoContent",view:"photos"},
    OWNER_CSV_NAV:{selector:'[data-view="csv"]',view:"csv"}, OWNER_CSV_FILE:{selector:"#csvFileInput",view:"csv"}, OWNER_CSV_PREVIEW:{selector:"#csvPreviewButton",view:"csv"}, OWNER_ANALYTICS_NAV:{selector:'[data-view="analytics"]',view:"analytics"}, OWNER_ANALYTICS_STATS:{selector:"#analyticsStats",view:"analytics"},
    OWNER_SETTINGS_NAV:{selector:'[data-view="settings"]',view:"settings"}, OWNER_SETTINGS_OVERVIEW:{selector:'[data-settings-pane-panel="overview"]',view:"settings"}, OWNER_SETTINGS_BOOKING:{selector:'[data-settings-pane="booking"]',view:"settings"}, OWNER_SETTINGS_HOURS:{selector:'[data-settings-pane="hours"]',view:"settings"}, OWNER_SETTINGS_SPECIAL:{selector:'[data-settings-pane="special"]',view:"settings"}, OWNER_SETTINGS_FEATURES:{selector:'[data-settings-pane="features"]',view:"settings"}, OWNER_SETTINGS_MESSAGES:{selector:'[data-settings-pane="messages"]',view:"settings"}, OWNER_SETTINGS_CONNECTION:{selector:'[data-settings-pane="connection"]',view:"settings"}, OWNER_HOURS_EDITOR:{selector:"#businessHoursEditor",view:"settings"}, OWNER_FEATURE_SETTINGS:{selector:"#featureSettings",view:"settings"},
    OWNER_SIDEFOOT:{selector:".sidefoot__links",view:""}
  };

  const guideButton = () => document.getElementById("dproGuideCenterLink");
  const launcher = () => document.getElementById("dproTutorialLauncher");

  function syncGuideButton(){
    const button=guideButton(); if(!button)return false;
    button.dataset.r4Pending="false"; button.title="DPRO 操作ガイドを開く"; button.setAttribute("aria-label","操作ガイドを開く");
    return true;
  }
  function waitFor(fn,attempts=50,interval=100){return new Promise(resolve=>{let count=0;const tick=()=>{const value=fn();if(value||++count>=attempts)return resolve(value||null);setTimeout(tick,interval)};tick()})}
  function safeViewNavigate(target){if(!target?.view)return;const nav=document.querySelector(`[data-view="${CSS.escape(target.view)}"]`);if(nav instanceof HTMLElement)nav.click()}
  async function highlightOwnerTarget(targetId){
    const target=OWNER_TARGETS[targetId]; if(!target)return;
    safeViewNavigate(target);
    if(target.view==="settings"&&target.selector.startsWith('[data-settings-pane=')){const pane=await waitFor(()=>document.querySelector(target.selector),25,120);if(pane instanceof HTMLElement)pane.click()}
    const element=await waitFor(()=>document.querySelector(target.selector),30,150); if(!(element instanceof HTMLElement))return;
    element.classList.add("dpro-r4-guide-target"); element.scrollIntoView({behavior:"smooth",block:"center",inline:"nearest"});
    if(!element.hasAttribute("tabindex")&&!/^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(element.tagName))element.setAttribute("tabindex","-1");
    try{element.focus({preventScroll:true})}catch{} setTimeout(()=>element.classList.remove("dpro-r4-guide-target"),7000);
  }
  async function handleStartupParams(){
    const url=new URL(location.href);
    if(url.searchParams.get("tutorial")==="restart"){
      const button=await waitFor(()=>{const candidate=launcher();const api=window.DPRO_TUTORIAL_HAIR;const ready=Boolean(api&&api.getState().count===10);return candidate instanceof HTMLElement&&!candidate.disabled&&ready?candidate:null},80,100);
      if(button instanceof HTMLElement){history.replaceState(null,"",url.pathname);window.DPRO_TUTORIAL_HAIR.replay()}
      return;
    }
    const targetId=url.searchParams.get("guideTarget");
    if(targetId){history.replaceState(null,"",url.pathname);await highlightOwnerTarget(targetId)}
  }

  document.addEventListener("click",event=>{
    const button=event.target.closest?.("#dproGuideCenterLink"); if(!button)return;
    event.preventDefault(); event.stopImmediatePropagation(); location.href="guide-center.html";
  },true);

  const style=document.createElement("style");
  style.textContent='.dpro-r4-guide-target{position:relative!important;z-index:92!important;outline:4px solid #f4b942!important;outline-offset:4px!important;box-shadow:0 0 0 9px rgba(244,185,66,.2)!important;border-radius:12px!important}';
  document.head.appendChild(style);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{waitFor(syncGuideButton,50,100);handleStartupParams()},{once:true});else{waitFor(syncGuideButton,50,100);handleStartupParams()}
  document.documentElement.dataset.guideBridgeVersion=VERSION;
})();
