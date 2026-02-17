// Compatibility no-op for environments/extensions that call this on load.
window.solveSimpleChallenge = window.solveSimpleChallenge || function solveSimpleChallenge() {};

// DOM refs
const templateCards = [...document.querySelectorAll(".template-card")];
const formPanel = document.getElementById("formPanel");
const resultPanel = document.getElementById("resultPanel");
const wishForm = document.getElementById("wishForm");

const senderInput = document.getElementById("sender");
const receiverInput = document.getElementById("receiver");
const messageInput = document.getElementById("message");
const mediaUrlInput = document.getElementById("mediaUrl");
const generateLinkBtn = document.getElementById("generateLinkBtn");

const shareLinkInput = document.getElementById("shareLink");
const copyBtn = document.getElementById("copyBtn");
const giftButton = document.getElementById("giftButton");

const previewCard = document.getElementById("previewCard");
const previewMedia = document.getElementById("previewMedia");
const mediaStatus = document.getElementById("mediaStatus");
const copyStatus = document.getElementById("copyStatus");

const langToggle = document.getElementById("langToggle");
const heroKicker = document.querySelector(".hero-kicker");
const heroTitle = document.querySelector(".hero h1");
const heroDesc = document.querySelector(".hero p:last-of-type");

const sectionTitle1 = document.querySelector("#templatePanel h2");
const sectionTitle2 = document.querySelector("#formPanel h2");
const sectionTitle3 = document.querySelector("#resultPanel h2");
const resultText = document.querySelector("#resultPanel .result-text");

const labels = [...wishForm.querySelectorAll("label")];

// State
let selectedTemplate = "";
let currentLang = localStorage.getItem("app_lang") || "id";

const giftThemeClasses = ["gift--classic", "gift--playful", "gift--night"];

// I18N
const i18n = {
  id: {
    heroKicker: "Birthday Card",
    heroTitle: "Buat Kado Ucapan Ulang Tahun",
    heroDesc: "Pilih gaya kartu, isi surat, lalu bagikan lewat link spesial berbentuk kado.",
    s1: "1. Pilih Tema Ucapan",
    s2: "2. Isi Data Ucapan",
    s3: "3. Bagikan Ucapan",
    resultText: "Link ucapanmu sudah siap. Klik kado untuk menyalin link.",
    labelSender: "Nama Pengirim",
    labelReceiver: "Nama Penerima",
    labelMessage: "Isi Surat",
    labelMedia: "URL Foto/GIF (opsional)",
    placeholderSender: "Contoh: Andi",
    placeholderReceiver: "Contoh: Cinta",
    placeholderMessage: "Tulis doa dan harapan terbaikmu...",
    placeholderMedia: "Contoh: https://example.com/foto-ultah.jpg",
    submit: "Buat Link Ucapan",
    copy: "Salin",
    gift: "Klik Kado",
    copied: "Link berhasil disalin.",
    copiedFallback: "Link disalin dengan mode cadangan.",
    chooseTemplateFirst: "Pilih tema ucapan dulu sebelum membuat link.",
    mediaInvalid: "Media gagal dimuat. Gunakan link langsung ke file gambar/GIF.",
    previewTo: "Untuk",
    previewFrom: "Dari",
    cards: {
      classic: ["Classic Gold", "Elegan & Formal", "Untuk sahabat, keluarga, rekan kerja"],
      playful: ["Playful Pop", "Ceria & Hangat", "Untuk teman dekat dan pasangan"],
      night: ["Midnight Glow", "Manis & Intim", "Untuk pesan personal spesial"],
    },
  },
  en: {
    heroKicker: "Birthday Card",
    heroTitle: "Create a Birthday Gift Message",
    heroDesc: "Pick a card style, write your letter, then share it with a gift-shaped link.",
    s1: "1. Choose Greeting Theme",
    s2: "2. Fill Message Details",
    s3: "3. Share Your Greeting",
    resultText: "Your greeting link is ready. Click the gift to copy the link.",
    labelSender: "Sender Name",
    labelReceiver: "Receiver Name",
    labelMessage: "Letter Message",
    labelMedia: "Photo/GIF URL (optional)",
    placeholderSender: "Example: Andi",
    placeholderReceiver: "Example: Cinta",
    placeholderMessage: "Write your best wishes here...",
    placeholderMedia: "Example: https://example.com/birthday-photo.jpg",
    submit: "Generate Greeting Link",
    copy: "Copy",
    gift: "Click Gift",
    copied: "Link copied successfully.",
    copiedFallback: "Link copied using fallback mode.",
    chooseTemplateFirst: "Choose a greeting theme first before generating the link.",
    mediaInvalid: "Media failed to load. Use a direct image/GIF file URL.",
    previewTo: "To",
    previewFrom: "From",
    cards: {
      classic: ["Classic Gold", "Elegant & Formal", "For friends, family, and colleagues"],
      playful: ["Playful Pop", "Cheerful & Warm", "For close friends and partners"],
      night: ["Midnight Glow", "Sweet & Intimate", "For personal special messages"],
    },
  },
};

// Helpers
function safeBase64Encode(text) {
  const base64 = btoa(unescape(encodeURIComponent(text)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeMediaUrl(url) {
  const value = (url || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (/^www\./i.test(value)) return `https://${value}`;
  return value;
}

function isLikelyDirectImageUrl(url) {
  if (!url) return false;

  const value = String(url).trim();
  if (!value || /^javascript:/i.test(value)) return false;

  if (/^data:image\//i.test(value)) return true;
  if (/^blob:/i.test(value)) return true;

  try {
    const parsed = new URL(value, location.origin);
    return parsed.protocol.toLowerCase() !== "javascript:";
  } catch {
    return false;
  }
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

function setPreviewMedia(source) {
  const mediaUrl = normalizeMediaUrl(source);
  mediaStatus.textContent = "";

  if (!mediaUrl) {
    previewMedia.removeAttribute("src");
    previewMedia.classList.add("hidden");
    return "";
  }

  previewMedia.src = mediaUrl;
  previewMedia.classList.remove("hidden");

  previewMedia.onload = () => {
    mediaStatus.textContent = "";
  };

  previewMedia.onerror = () => {
    previewMedia.classList.add("hidden");
    previewMedia.removeAttribute("src");
    mediaStatus.textContent = i18n[currentLang].mediaInvalid;
  };

  return mediaUrl;
}

function setTemplate(template) {
  selectedTemplate = template;

  templateCards.forEach((card) => {
    card.classList.toggle("active", card.dataset.template === template);
  });

  formPanel.classList.remove("hidden");
  resultPanel.classList.add("hidden");
  applyPageTheme(template);
}

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("app_lang", lang);

  const t = i18n[lang];
  document.documentElement.lang = lang;
  langToggle.textContent = lang === "id" ? "EN" : "ID";

  heroKicker.textContent = t.heroKicker;
  heroTitle.textContent = t.heroTitle;
  heroDesc.textContent = t.heroDesc;

  sectionTitle1.textContent = t.s1;
  sectionTitle2.textContent = t.s2;
  sectionTitle3.textContent = t.s3;
  resultText.textContent = t.resultText;

  labels[0].childNodes[0].nodeValue = t.labelSender;
  labels[1].childNodes[0].nodeValue = t.labelReceiver;
  labels[2].childNodes[0].nodeValue = t.labelMessage;
  labels[3].childNodes[0].nodeValue = t.labelMedia;

  senderInput.placeholder = t.placeholderSender;
  receiverInput.placeholder = t.placeholderReceiver;
  messageInput.placeholder = t.placeholderMessage;
  mediaUrlInput.placeholder = t.placeholderMedia;

  generateLinkBtn.textContent = t.submit;
  copyBtn.textContent = t.copy;
  giftButton.querySelector(".gift-label").textContent = t.gift;

  templateCards.forEach((card) => {
    const theme = card.dataset.template;
    const [badge, title, desc] = t.cards[theme];

    card.querySelector(".badge").textContent = badge;
    card.querySelector("strong").textContent = title;
    card.querySelector("small").textContent = desc;
  });

  if (previewCard.textContent.trim() && senderInput.value && receiverInput.value) {
    previewCard.innerHTML = formatPreview({
      sender: senderInput.value.trim(),
      receiver: receiverInput.value.trim(),
      message: messageInput.value.trim(),
    });
  }
}

// Events
templateCards.forEach((card) => {
  card.addEventListener("click", () => setTemplate(card.dataset.template));
});

wishForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!selectedTemplate) {
    copyStatus.textContent = i18n[currentLang].chooseTemplateFirst;
    document.getElementById("templatePanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const t = i18n[currentLang];
  const mediaUrl = normalizeMediaUrl(mediaUrlInput.value);

  if (mediaUrl && !isLikelyDirectImageUrl(mediaUrl)) {
    mediaStatus.textContent = t.mediaInvalid;
    copyStatus.textContent = "";
    return;
  }

  const payload = {
    t: selectedTemplate,
    sender: senderInput.value.trim(),
    receiver: receiverInput.value.trim(),
    message: messageInput.value.trim(),
    mediaUrl,
  };

  const encoded = safeBase64Encode(JSON.stringify(payload));
  const basePath = location.pathname.replace(/[^/]*$/, "");
  const url = `${location.origin}${basePath}receiver.html?gift=${encoded}`;

  shareLinkInput.value = url;
  previewCard.innerHTML = formatPreview(payload);

  setPreviewMedia(payload.mediaUrl);

  applyGiftTheme(giftButton, selectedTemplate);
  resultPanel.classList.remove("hidden");
  copyStatus.textContent = "";
});

async function copyShareLink() {
  if (!shareLinkInput.value) return;

  const t = i18n[currentLang];
  try {
    await navigator.clipboard.writeText(shareLinkInput.value);
    copyStatus.textContent = t.copied;
  } catch {
    const temp = document.createElement("textarea");
    temp.value = shareLinkInput.value;
    temp.setAttribute("readonly", "");
    temp.style.position = "fixed";
    temp.style.opacity = "0";
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);
    copyStatus.textContent = t.copiedFallback;
  }
}

langToggle.addEventListener("click", () => {
  applyLanguage(currentLang === "id" ? "en" : "id");
});

copyBtn.addEventListener("click", copyShareLink);
giftButton.addEventListener("click", copyShareLink);

// Init
applyLanguage(currentLang);


