// DOM refs
const receiverTitle = document.getElementById("receiverTitle");
const openGiftBtn = document.getElementById("openGiftBtn");
const receiverNote = document.getElementById("receiverNote");
const receiverNoteKicker = document.getElementById("receiverNoteKicker");
const receiverNoteTitle = document.getElementById("receiverNoteTitle");
const receiverCard = document.getElementById("receiverCard");
const receiverMedia = document.getElementById("receiverMedia");
const receiverMediaStatus = document.getElementById("receiverMediaStatus");

const backLink = document.querySelector(".back-link");
const receiverKicker = document.querySelector(".hero-kicker");
const receiverDesc = document.querySelector(".result-text");
const langToggle = document.getElementById("langToggle");

// State
const giftThemeClasses = ["gift--classic", "gift--playful", "gift--night"];
let currentLang = localStorage.getItem("app_lang") || "id";
let giftData = null;

// I18N
const i18n = {
  id: {
    kicker: "Spesial Untukmu",
    title: "Kamu Menerima Kado Ucapan",
    titleTo: "Kado Ucapan untuk",
    desc: "Klik kado untuk membuka surat ulang tahunnya.",
    noteKicker: "Catatan Ulang Tahun",
    noteTitle: "Sebuah pesan spesial untukmu",
    giftBtn: "Buka Kado",
    back: "Kembali buat ucapan",
    invalid: "Link kado tidak valid",
    mediaInvalid: "Media tidak bisa ditampilkan. Pastikan link gambar/GIF langsung.",
    previewTo: "Untuk",
    previewFrom: "Dari",
  },
  en: {
    kicker: "Special For You",
    title: "You Received a Gift Message",
    titleTo: "Gift Message for",
    desc: "Click the gift to open the birthday letter.",
    noteKicker: "Birthday Note",
    noteTitle: "A special message for you",
    giftBtn: "Open Gift",
    back: "Back to creator",
    invalid: "Invalid gift link",
    mediaInvalid: "Cannot render media. Please use a direct image/GIF URL.",
    previewTo: "To",
    previewFrom: "From",
  },
};

// Helpers
function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeBase64Decode(text) {
  const normalized = (text || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return decodeURIComponent(escape(atob(padded)));
}

function normalizeMediaUrl(url) {
  const value = (url || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (/^www\./i.test(value)) return `https://${value}`;
  return value;
}

function applyGiftTheme(el, template) {
  if (!el) return;

  el.classList.remove(...giftThemeClasses);
  if (template === "classic") el.classList.add("gift--classic");
  if (template === "playful") el.classList.add("gift--playful");
  if (template === "night") el.classList.add("gift--night");
}

function applyPageTheme(template) {
  document.body.classList.remove("theme-classic", "theme-playful", "theme-night");
  if (!template) return;
  document.body.classList.add(`theme-${template}`);
}

function formatPreview(data) {
  const t = i18n[currentLang];
  const receiver = escapeHtml(data.receiver);
  const sender = escapeHtml(data.sender);
  const message = escapeHtml(data.message).replaceAll("\n", "<br>");
  return `<p class="preview-meta"><span class="preview-key">${t.previewTo}:</span> ${receiver}</p><p class="preview-message">${message}</p><p class="preview-meta preview-meta-from"><span class="preview-key">${t.previewFrom}:</span></p><p class="preview-sender">${sender}</p>`;
}

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("app_lang", lang);
  document.documentElement.lang = lang;

  const t = i18n[lang];
  langToggle.textContent = lang === "id" ? "EN" : "ID";
  receiverKicker.textContent = t.kicker;
  receiverDesc.textContent = t.desc;
  receiverNoteKicker.textContent = t.noteKicker;
  receiverNoteTitle.textContent = t.noteTitle;
  openGiftBtn.querySelector(".gift-label").textContent = t.giftBtn;
  backLink.textContent = t.back;

  if (giftData) {
    receiverTitle.textContent = `${t.titleTo} ${giftData.receiver}`;
    receiverCard.innerHTML = formatPreview(giftData);
  } else {
    receiverTitle.textContent = t.title;
  }
}

function setMediaSource(mediaSource) {
  if (!mediaSource) {
    receiverMedia.removeAttribute("src");
    receiverMedia.classList.add("hidden");
    receiverMediaStatus.textContent = "";
    return;
  }

  receiverMedia.src = mediaSource;
  receiverMedia.classList.add("hidden");
  receiverMediaStatus.textContent = "";

  receiverMedia.onerror = () => {
    receiverMedia.classList.add("hidden");
    receiverMedia.removeAttribute("src");
    receiverMediaStatus.textContent = i18n[currentLang].mediaInvalid;
  };
}

function loadGift() {
  const gift = new URLSearchParams(location.search).get("gift");
  if (!gift) {
    receiverTitle.textContent = i18n[currentLang].invalid;
    return;
  }

  try {
    const parsed = JSON.parse(safeBase64Decode(gift));
    if (!parsed.sender || !parsed.receiver || !parsed.message) {
      throw new Error("invalid");
    }

    giftData = parsed;
    receiverTitle.textContent = `${i18n[currentLang].titleTo} ${parsed.receiver}`;
    receiverCard.innerHTML = formatPreview(parsed);

    const mediaSource = normalizeMediaUrl(parsed.mediaUrl || "");
    setMediaSource(mediaSource);
    applyGiftTheme(openGiftBtn, parsed.t || "classic");
    applyPageTheme(parsed.t || "classic");

    openGiftBtn.addEventListener("click", () => {
      openGiftBtn.classList.add("open");

      if (mediaSource) {
        receiverMedia.classList.remove("hidden");
      }

      receiverNote.classList.remove("hidden");
      receiverCard.classList.remove("reveal");
      requestAnimationFrame(() => receiverCard.classList.add("reveal"));
    });
  } catch {
    receiverTitle.textContent = i18n[currentLang].invalid;
  }
}

// Init
langToggle.addEventListener("click", () => {
  applyLanguage(currentLang === "id" ? "en" : "id");
});

applyLanguage(currentLang);
loadGift();
