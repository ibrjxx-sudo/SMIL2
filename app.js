const STORAGE_KEYS = {
  settings: "sinan.settings.v1",
  services: "sinan.services.v1",
  appointments: "sinan.appointments.v1",
  accounts: "sinan.accounts.v1",
  signedIn: "sinan.signedIn.v1"
};

const DEFAULT_SETTINGS = {
  clinicName: "سِنان",
  doctorName: "فريق سِنان",
  whatsapp: "00962780471734",
  openTime: "09:00",
  closeTime: "20:00",
  slotDuration: 30,
  workingDays: [0, 1, 2, 3, 4, 6],
  logoUrl: "",
  badgeUrl: "",
  verified: false,
  clinicEmail: "",
  phone: "",
  address: "",
  siteDescription: "",
  heroLead: "موعدك لابتسامة",
  heroAccent: "أكثر صحة.",
  heroDescription: "رعاية أسنان متكاملة تبدأ بالاستماع إليك. اختر الخدمة والوقت المناسب، وسنكون بانتظارك.",
  seoTitle: "",
  seoDescription: "",
  footerDescription: "رعاية تبدأ بابتسامة",
  socialLinks: {},
  colors: { primary: "#286b57", secondary: "#d3e9a5", background: "#f7f8f5", text: "#172722" },
  sections: { services: true, doctors: true, gallery: true, testimonials: true, faq: true, about: true, articles: true },
  fontFamily: "IBM Plex Sans Arabic",
  fontSize: 14,
  headingSize: 38,
  buttonSize: 12
};

const DEFAULT_SERVICES = [
  { id: "checkup", name: "الفحص والاستشارة", description: "فحص شامل وخطة عناية تناسب احتياجك.", duration: 30, price: "يحدد بعد الفحص", icon: "⌕" },
  { id: "cleaning", name: "تنظيف الأسنان", description: "عناية دورية لأسنان أكثر صحة ونظافة.", duration: 45, price: "يحدد بعد الفحص", icon: "✳" },
  { id: "cosmetic", name: "تجميل الأسنان", description: "خيارات تجميلية مدروسة لابتسامة واثقة.", duration: 45, price: "يحدد بعد الفحص", icon: "◇" },
  { id: "treatment", name: "علاج الأسنان", description: "رعاية علاجية بخطوات واضحة ومريحة.", duration: 45, price: "يحدد بعد الفحص", icon: "＋" }
];

const WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const WEEKDAY_SHORT = ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];
const STATUS_LABELS = { new: "جديد", pending: "قيد التأكيد", review: "قيد المراجعة", confirmed: "مؤكد", arrived: "حضر", completed: "مكتمل", cancelled: "ملغي", no_show: "لم يحضر" };
const SERVICE_ICONS = ["✳", "⌕", "◇", "＋", "◌", "⌂"];
const COLLECTIONS = {
  doctors: { title: "الأطباء", fields: [
    ["name", "الاسم", "text", true], ["specialty", "التخصص", "text", true], ["description", "الوصف", "textarea"], ["experience", "سنوات الخبرة", "number"], ["certificates", "الشهادات", "textarea"], ["phone", "الهاتف", "tel"], ["email", "البريد", "email"], ["workDays", "أيام العمل", "text"], ["status", "الحالة", "select", true, { active: "نشط", hidden: "مخفي" }]
  ] },
  patients: { title: "المرضى", fields: [
    ["name", "الاسم", "text", true], ["phone", "الهاتف", "tel", true], ["email", "البريد", "email"], ["status", "الحالة", "select", true, { active: "نشط", inactive: "غير نشط" }], ["notes", "ملاحظات", "textarea"]
  ] },
  pages: { title: "الصفحات", fields: [
    ["title", "عنوان الصفحة", "text", true], ["slug", "الرابط المختصر", "text", true], ["content", "المحتوى", "textarea"], ["heroImage", "الصورة الرئيسية (رابط الوسائط)", "url"], ["seoTitle", "SEO Title", "text"], ["seoDescription", "SEO Description", "textarea"], ["status", "حالة النشر", "select", true, { draft: "مسودة", published: "منشور", hidden: "مخفي" }]
  ] },
  posts: { title: "المقالات", fields: [
    ["title", "عنوان المقال", "text", true], ["slug", "الرابط المختصر", "text", true], ["excerpt", "ملخص", "textarea"], ["content", "المحتوى", "textarea"], ["category", "التصنيف", "text"], ["tags", "الوسوم", "text"], ["heroImage", "الصورة الرئيسية (رابط الوسائط)", "url"], ["seoTitle", "SEO Title", "text"], ["seoDescription", "SEO Description", "textarea"], ["status", "حالة النشر", "select", true, { draft: "مسودة", published: "منشور", hidden: "مخفي" }]
  ] },
  testimonials: { title: "آراء المرضى", fields: [
    ["name", "اسم المراجع", "text", true], ["quote", "نص الرأي", "textarea", true], ["rating", "التقييم من 1 إلى 5", "number"], ["status", "الحالة", "select", true, { published: "منشور", hidden: "مخفي" }]
  ] },
  faqs: { title: "الأسئلة الشائعة", fields: [
    ["question", "السؤال", "text", true], ["answer", "الإجابة", "textarea", true], ["category", "التصنيف", "text"], ["status", "الحالة", "select", true, { published: "منشور", hidden: "مخفي" }]
  ] },
  messages: { title: "الرسائل", fields: [
    ["name", "الاسم", "text"], ["email", "البريد", "email"], ["phone", "الهاتف", "tel"], ["message", "الرسالة", "textarea"], ["status", "الحالة", "select", true, { new: "جديدة", read: "مقروءة", closed: "مغلقة" }]
  ] },
  categories: { title: "التصنيفات", fields: [["name", "اسم التصنيف", "text", true], ["slug", "الرابط المختصر", "text"], ["description", "الوصف", "textarea"], ["type", "نوع المحتوى", "text"]] },
  tags: { title: "الوسوم", fields: [["name", "اسم الوسم", "text", true], ["slug", "الرابط المختصر", "text"]] }
};

function readStore(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let settings = { ...DEFAULT_SETTINGS, ...readStore(STORAGE_KEYS.settings, {}) };
let services = readStore(STORAGE_KEYS.services, DEFAULT_SERVICES);
let appointments = readStore(STORAGE_KEYS.appointments, []);
let gallery = [];
let members = [];
let publicContent = { doctors: [], testimonials: [], faqs: [], pages: [], posts: [] };
let doctors = [];
let patients = [];
let reports = null;
let dashboardData = null;
const NOTIFICATION_STORAGE_KEY = "sinan.notifications.v1";
const REMINDER_STORAGE_KEY = "sinan.reminders.v1";
let notifications = readStore(NOTIFICATION_STORAGE_KEY, []);
let collectionData = {};
let activeCollection = "";
let selectedAppointments = new Set();
let signedInUser = readStore(STORAGE_KEYS.signedIn, null);
let serverMode = false;
let sharedBookedSlots = [];
let dateOffset = 0;
let selectedDate = "";
let selectedTime = "";
let authMode = "login";
let adminAuthRequested = false;
let resetToken = "";
let toastTimer;
let notificationAudioContext;

const byId = (id) => document.getElementById(id);
const bookingForm = byId("booking-form");
const bookingDate = byId("booking-date");
const bookingTime = byId("booking-time");
const bookingMessage = byId("booking-message");
const authDialog = byId("auth-dialog");

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function minutesFromTime(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function timeFromMinutes(value) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function formatDate(value, options = { day: "numeric", month: "short", weekday: "short" }) {
  return new Intl.DateTimeFormat("ar-JO", options).format(new Date(`${value}T12:00:00`));
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function formatTimeDisplay(value) {
  const [hours = 0, minutes = 0] = String(value || "00:00").split(":").map(Number);
  const hour12 = hours % 12 || 12;
  const suffix = hours >= 12 ? "مساءً" : "صباحًا";
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function showToast(message) {
  const toast = byId("toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 3200);
}

function playAlertTone() {
  const AudioConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioConstructor) return;
  const context = notificationAudioContext || new AudioConstructor();
  notificationAudioContext = context;
  if (context.state === "suspended") context.resume().catch(() => {});
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = 880;
  gainNode.gain.value = 0.04;
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.18);
}

function renderNotificationPanel() {
  const bell = byId("notification-bell");
  const badge = byId("notification-badge");
  const panel = byId("notification-panel");
  const mobileDot = byId("mobile-notification-dot");
  if (!bell || !badge || !panel) return;
  const unreadCount = notifications.filter((item) => item.unread !== false).length;
  badge.hidden = unreadCount === 0;
  badge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
  if (mobileDot) mobileDot.hidden = unreadCount === 0;
  panel.innerHTML = notifications.length
    ? notifications.slice(0, 8).map((item) => `
        <article class="notification-item ${item.unread === false ? "is-read" : "is-new"}">
          <strong>${escapeHTML(item.title)}</strong>
          <small>${escapeHTML(item.detail)}</small>
          <time>${escapeHTML(new Date(item.createdAt).toLocaleString("ar-JO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }))}</time>
        </article>
      `).join("")
    : '<div class="empty-notification">لا توجد إشعارات جديدة</div>';
}

function addNotification(title, detail, type = "general") {
  notifications = [{
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    detail,
    type,
    unread: true,
    createdAt: new Date().toISOString()
  }, ...notifications].slice(0, 20);
  writeStore(NOTIFICATION_STORAGE_KEY, notifications);
  renderNotificationPanel();
  if (type === "booking" || type === "reminder") {
    showToast(detail);
    playAlertTone();
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body: detail, tag: title });
    }
  }
}

function markNotificationsRead() {
  notifications = notifications.map((item) => ({ ...item, unread: false }));
  writeStore(NOTIFICATION_STORAGE_KEY, notifications);
  renderNotificationPanel();
}

function scheduleAppointmentReminders() {
  const storedState = readStore(REMINDER_STORAGE_KEY, {});
  const now = Date.now();
  const nextState = {};
  for (const appointment of appointments) {
    if (!appointment.date || !appointment.time || ["cancelled", "completed", "no_show"].includes(appointment.status)) continue;
    const appointmentWhen = new Date(`${appointment.date}T${appointment.time}:00`).getTime();
    const remindAt = appointmentWhen - 60 * 60 * 1000;
    if (remindAt <= now) continue;
    nextState[appointment.id] = String(remindAt);
    const remembered = Number(storedState[appointment.id] || 0);
    if (remembered && remembered === remindAt) continue;
    setTimeout(() => {
      const current = appointments.find((item) => item.id === appointment.id);
      if (!current || ["cancelled", "completed", "no_show"].includes(current.status)) return;
      addNotification("تذكير الموعد", `بقي أقل من ساعة حتى موعد ${current.name} في ${formatDate(current.date)} الساعة ${formatTimeDisplay(current.time)}.`, "reminder");
      const reminderState = readStore(REMINDER_STORAGE_KEY, {});
      delete reminderState[current.id];
      writeStore(REMINDER_STORAGE_KEY, reminderState);
    }, Math.max(1000, remindAt - now));
  }
  writeStore(REMINDER_STORAGE_KEY, nextState);
}

function confirmAction(message = "هل أنت متأكد من حذف هذا العنصر؟") {
  return new Promise((resolve) => {
    const dialog = byId("confirm-dialog");
    byId("confirm-title").textContent = message;
    const accept = byId("confirm-accept");
    const cancel = byId("confirm-cancel");
    const finish = (value) => {
      if (dialog.open) dialog.close();
      accept.removeEventListener("click", onAccept);
      cancel.removeEventListener("click", onCancel);
      dialog.removeEventListener("click", onBackdrop);
      resolve(value);
    };
    const onAccept = () => finish(true);
    const onCancel = () => finish(false);
    const onBackdrop = (event) => { if (event.target === dialog) finish(false); };
    accept.addEventListener("click", onAccept);
    cancel.addEventListener("click", onCancel);
    dialog.addEventListener("click", onBackdrop);
    dialog.showModal();
  });
}

function updateClinicBranding() {
  document.querySelectorAll("[data-site-content]").forEach((element) => {
    const value = settings[element.dataset.siteContent];
    if (typeof value === "string") element.textContent = value;
  });
  document.querySelectorAll("[data-site-copy]").forEach((element) => {
    const value = settings.copy?.[element.dataset.siteCopy];
    if (typeof value === "string") element.textContent = value;
  });
  document.querySelectorAll("[data-clinic-name]").forEach((element) => {
    if (!element.dataset.clinicText) element.dataset.clinicText = element.textContent;
    element.replaceChildren(document.createTextNode(settings.clinicName));
    if (settings.verified) {
      const badge = settings.badgeUrl
        ? Object.assign(document.createElement("img"), { src: settings.badgeUrl, alt: "علامة توثيق", className: "verification-badge" })
        : Object.assign(document.createElement("span"), { textContent: "✓", title: "حساب موثّق", className: "verified-mark" });
      element.append(badge);
    }
  });
  document.querySelectorAll(".brand-mark").forEach((element) => {
    if (!element.dataset.defaultMark) element.dataset.defaultMark = element.textContent;
    element.innerHTML = settings.logoUrl ? `<img src="${escapeHTML(settings.logoUrl)}" alt="شعار ${escapeHTML(settings.clinicName)}">` : escapeHTML(element.dataset.defaultMark);
  });
  let favicon = document.querySelector('link[rel="icon"]');
  if (settings.logoUrl) {
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.append(favicon);
    }
    favicon.href = settings.logoUrl;
  }
  document.title = settings.seoTitle || `${settings.clinicName} | رعاية تبدأ بابتسامة`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = settings.seoDescription || settings.siteDescription || "احجز موعدك في عيادة طب الأسنان بسهولة.";
  const footerDescription = document.querySelector(".footer-inner .brand-copy small");
  if (footerDescription) footerDescription.textContent = settings.footerDescription || "رعاية تبدأ بابتسامة";
  let socialLinks = byId("footer-social-links");
  if (!socialLinks) {
    socialLinks = document.createElement("div");
    socialLinks.id = "footer-social-links";
    socialLinks.className = "footer-social-links";
    document.querySelector(".footer-inner")?.append(socialLinks);
  }
  socialLinks.innerHTML = Object.entries(settings.socialLinks || {}).filter(([, url]) => /^https?:\/\//i.test(url)).map(([network, url]) => `<a href="${escapeHTML(url)}" target="_blank" rel="noreferrer">${escapeHTML(network)}</a>`).join("");
  applySiteTheme();
  const whatsappNumber = normalizeWhatsApp(settings.whatsapp);
  byId("direct-whatsapp").href = `https://wa.me/${whatsappNumber}`;
}

function applySiteTheme() {
  const root = document.documentElement;
  const colors = settings.colors || {};
  if (colors.primary) root.style.setProperty("--green", colors.primary);
  if (colors.secondary) root.style.setProperty("--lime", colors.secondary);
  if (colors.background) root.style.setProperty("--paper", colors.background);
  if (colors.text) root.style.setProperty("--ink", colors.text);
  if (settings.fontFamily) root.style.setProperty("--arabic", `"${settings.fontFamily}", "DM Sans", sans-serif`);
  if (settings.fontSize) root.style.setProperty("--site-font-size", `${Number(settings.fontSize)}px`);
  if (settings.headingSize) root.style.setProperty("--site-heading-size", `${Number(settings.headingSize)}px`);
  if (settings.buttonSize) root.style.setProperty("--site-button-size", `${Number(settings.buttonSize)}px`);
  if (byId("admin-view")?.hidden !== false) {
    document.querySelectorAll("[data-site-section]").forEach((section) => {
      section.hidden = settings.sections?.[section.dataset.siteSection] === false;
    });
  }
}

function normalizeWhatsApp(value) {
  let number = String(value).replace(/\D/g, "");
  if (number.startsWith("00")) number = number.slice(2);
  return number;
}

async function requestApi(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "تعذر الاتصال بالخادم.");
  return result;
}

async function refreshServerState() {
  if (!serverMode) return;
  const state = await requestApi("/api/state");
  settings = { ...DEFAULT_SETTINGS, ...state.settings };
  services = state.services;
  sharedBookedSlots = state.bookedSlots;
  gallery = state.gallery || [];
  writeStore(STORAGE_KEYS.settings, settings);
  writeStore(STORAGE_KEYS.services, services);
  updateClinicBranding();
  renderServices();
  renderGallery();
  await loadPublicContent();
}

async function refreshAdminAppointments() {
  const result = await requestApi("/api/admin/appointments");
  appointments = result.appointments;
  writeStore(STORAGE_KEYS.appointments, appointments);
  renderAdmin();
  renderDashboardChart();
  renderTodayAppointments();
}

async function refreshAdminMembers() {
  const result = await requestApi("/api/admin/members");
  members = result.members;
  renderAdminMembers();
}

function applySignedInUser(user) {
  signedInUser = user;
  if (user) {
    if (user.role === "admin") localStorage.removeItem(STORAGE_KEYS.signedIn);
    else writeStore(STORAGE_KEYS.signedIn, user);
    byId("account-button").hidden = true;
    byId("admin-button").hidden = true;
    byId("account-avatar").hidden = false;
    byId("account-popover-name").textContent = user.name || "الحساب";
    byId("account-avatar-fallback").textContent = user.name?.trim().charAt(0) || "ع";
    byId("account-avatar-fallback").hidden = Boolean(user.avatarUrl);
    byId("account-avatar-image").hidden = !user.avatarUrl;
    if (user.avatarUrl) byId("account-avatar-image").src = user.avatarUrl;
    byId("booking-name").value = user.name || "";
  } else {
    localStorage.removeItem(STORAGE_KEYS.signedIn);
    byId("account-button").hidden = false;
    byId("admin-button").hidden = false;
    byId("account-avatar").hidden = true;
    byId("account-avatar-image").removeAttribute("src");
    byId("account-avatar-image").hidden = true;
    byId("account-popover").hidden = true;
    byId("account-avatar").setAttribute("aria-expanded", "false");
  }
}

function renderServices() {
  const serviceGrid = byId("service-grid");
  const serviceSelect = byId("booking-service");
  const publicServices = services.filter((service) => service.status !== "hidden");
  if (!publicServices.length) {
    serviceGrid.innerHTML = '<div class="service-card is-empty">لا توجد خدمات متاحة حاليًا. تواصل معنا عبر واتساب للاستفسار.</div>';
    serviceSelect.innerHTML = '<option value="">لا توجد خدمات متاحة</option>';
    serviceSelect.disabled = true;
    return;
  }

  serviceSelect.disabled = false;
  serviceSelect.innerHTML = publicServices.map((service) => `<option value="${escapeHTML(service.id)}">${escapeHTML(service.name)} · ${Number(service.duration)} دقيقة</option>`).join("");
  serviceGrid.innerHTML = publicServices.map((service, index) => `
    <article class="service-card">
      <span class="service-icon" aria-hidden="true">${escapeHTML(service.icon || SERVICE_ICONS[index % SERVICE_ICONS.length])}</span>
      <h3>${escapeHTML(service.name)}</h3>
      <p>${escapeHTML(service.description || "رعاية مخصصة لاحتياجك.")}</p>
      <div class="service-card-bottom"><span>${escapeHTML(service.price || "يحدد بعد الفحص")}</span><span aria-hidden="true">↙</span></div>
    </article>`).join("");
}

function renderGallery() {
  const container = byId("public-gallery");
  const empty = byId("gallery-empty");
  if (!container || !empty) return;
  const publicGallery = gallery.filter((item) => item.kind !== "document");
  empty.hidden = publicGallery.length > 0;
  container.innerHTML = publicGallery.map((item) => `
    <figure class="gallery-item">
      ${item.kind === "video"
        ? `<video src="${escapeHTML(item.url)}" controls controlsList="nodownload noremoteplayback" disablepictureinpicture preload="metadata" playsinline aria-label="${escapeHTML(item.title || "فيديو من العيادة")}"></video>`
        : `<img src="${escapeHTML(item.url)}" alt="${escapeHTML(item.title || "صورة من عيادة سِنان")}" loading="lazy">`}
      ${item.title ? `<figcaption>${escapeHTML(item.title)}</figcaption>` : ""}
    </figure>`).join("");
}

function renderPublicContent() {
  const doctorsContainer = byId("public-doctors");
  if (doctorsContainer) {
    byId("doctors-empty").hidden = publicContent.doctors.length > 0;
    doctorsContainer.innerHTML = publicContent.doctors.map((doctor) => `<article class="public-doctor-card">${doctor.imageUrl ? `<img src="${escapeHTML(doctor.imageUrl)}" alt="${escapeHTML(doctor.name)}" loading="lazy">` : `<div class="doctor-initial" aria-hidden="true">${escapeHTML(doctor.name.charAt(0))}</div>`}<div><h3>${escapeHTML(doctor.name)}</h3><strong>${escapeHTML(doctor.specialty || "طبيب أسنان")}</strong><p>${escapeHTML(doctor.description || "")}</p>${doctor.experience ? `<small>${Number(doctor.experience)} سنوات خبرة</small>` : ""}</div></article>`).join("");
  }
  const testimonials = byId("public-testimonials");
  if (testimonials) testimonials.innerHTML = publicContent.testimonials.map((item) => `<article class="public-testimonial"><span>${"★".repeat(Math.min(5, Math.max(1, Number(item.rating) || 5)))}</span><p>${escapeHTML(item.quote)}</p><strong>${escapeHTML(item.name)}</strong></article>`).join("");
  const faqs = byId("public-faq-list");
  if (faqs) faqs.innerHTML = publicContent.faqs.map((item) => `<details class="public-faq-item"><summary>${escapeHTML(item.question)}</summary><p>${escapeHTML(item.answer)}</p></details>`).join("");
  const pageLinks = byId("public-page-links");
  if (pageLinks) pageLinks.innerHTML = publicContent.pages.map((page) => `<button class="public-page-link" type="button" data-open-page="${escapeHTML(page.slug)}">${escapeHTML(page.title)}</button>`).join("");
  const articleList = byId("public-articles-list");
  if (articleList) articleList.innerHTML = publicContent.posts.map((post) => `<article class="public-article-card">${post.heroImage ? `<img src="${escapeHTML(post.heroImage)}" alt="" loading="lazy">` : ""}<div><h3><button class="table-link" type="button" data-open-post="${escapeHTML(post.slug)}">${escapeHTML(post.title)}</button></h3><p>${escapeHTML(post.excerpt || "")}</p></div></article>`).join("");
}

async function loadPublicContent() {
  const content = await requestApi("/api/public/content");
  publicContent = content;
  renderPublicContent();
}

document.addEventListener("click", async (event) => {
  const postLink = event.target.closest("[data-open-post]");
  if (postLink) {
    try {
      const result = await requestApi(`/api/public/posts/${encodeURIComponent(postLink.dataset.openPost)}`);
      let dialog = byId("public-page-dialog");
      if (!dialog) { dialog = document.createElement("dialog"); dialog.id = "public-page-dialog"; dialog.className = "detail-dialog public-page-dialog"; document.body.append(dialog); }
      dialog.innerHTML = `<form method="dialog" class="public-page-content"><button class="dialog-close" aria-label="إغلاق">×</button>${result.post.heroImage ? `<img class="public-page-hero" src="${escapeHTML(result.post.heroImage)}" alt="">` : ""}<h1>${escapeHTML(result.post.title)}</h1><p>${escapeHTML(result.post.content || result.post.excerpt || "")}</p></form>`;
      dialog.showModal();
    } catch (error) { showToast(error.message); }
    return;
  }
  const link = event.target.closest("[data-open-page]");
  if (!link) return;
  try {
    const result = await requestApi(`/api/public/pages/${encodeURIComponent(link.dataset.openPage)}`);
    const page = result.page;
    let dialog = byId("public-page-dialog");
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "public-page-dialog";
      dialog.className = "detail-dialog public-page-dialog";
      document.body.append(dialog);
    }
    const sections = (page.sections || []).filter((section) => !section.hidden).map((section) => {
      if (section.type === "image") return `<img src="${escapeHTML(section.content)}" alt="" loading="lazy">`;
      if (section.type === "video") return `<video src="${escapeHTML(section.content)}" controls></video>`;
      return `<section><h2>${escapeHTML(section.type)}</h2><p>${escapeHTML(section.content)}</p></section>`;
    }).join("");
    dialog.innerHTML = `<form method="dialog" class="public-page-content"><button class="dialog-close" aria-label="إغلاق">×</button>${page.heroImage ? `<img class="public-page-hero" src="${escapeHTML(page.heroImage)}" alt="">` : ""}<h1>${escapeHTML(page.title)}</h1>${page.content ? `<p>${escapeHTML(page.content)}</p>` : ""}${sections}</form>`;
    dialog.showModal();
  } catch (error) { showToast(error.message); }
});

function getSelectedService() {
  return services.find((service) => service.id === byId("booking-service").value) || services[0];
}

function setSelectedDate(value) {
  selectedDate = value;
  selectedTime = "";
  bookingDate.value = value;
  bookingTime.value = "";
  renderDateStrip();
  renderTimeSlots();
}

function renderDateStrip() {
  const strip = byId("date-strip");
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + dateOffset * 7 + index);
    return date;
  });
  const currentTime = new Date();
  const today = localDateKey(currentTime);
  const beforeClosing = currentTime.getHours() * 60 + currentTime.getMinutes() < minutesFromTime(settings.closeTime);
  const openDate = dates.find((date) => settings.workingDays.includes(date.getDay()) && (localDateKey(date) !== today || beforeClosing));
  if (!selectedDate || (dateOffset === 0 && new Date(`${selectedDate}T12:00:00`) < new Date(new Date().setHours(0, 0, 0, 0)))) {
    selectedDate = openDate ? localDateKey(openDate) : localDateKey(dates[0]);
    bookingDate.value = selectedDate;
  }
  const selectedDateObject = new Date(`${selectedDate}T12:00:00`);
  if (!dates.some((date) => localDateKey(date) === selectedDate)) {
    selectedDate = openDate ? localDateKey(openDate) : localDateKey(dates[0]);
    bookingDate.value = selectedDate;
    selectedTime = "";
    bookingTime.value = "";
  }
  strip.innerHTML = dates.map((date) => {
    const key = localDateKey(date);
    const isWorking = settings.workingDays.includes(date.getDay());
    const active = key === selectedDate;
    return `<button class="date-option${active ? " active" : ""}${isWorking ? "" : " closed"}" type="button" data-date="${key}" aria-pressed="${active}" ${isWorking ? "" : "disabled"}><span>${WEEKDAY_SHORT[date.getDay()]}</span><strong>${date.getDate()}</strong></button>`;
  }).join("");
  byId("date-prev").disabled = dateOffset <= 0;
  byId("date-prev").style.opacity = dateOffset <= 0 ? ".35" : "1";
  strip.querySelectorAll("[data-date]").forEach((button) => button.addEventListener("click", () => setSelectedDate(button.dataset.date)));
  if (!selectedDateObject) selectedDate = localDateKey(dates[0]);
}

function renderTimeSlots() {
  const grid = byId("time-grid");
  if (!selectedDate || !services.length) {
    grid.innerHTML = '<p class="no-times">اختر خدمة متاحة لعرض الأوقات.</p>';
    byId("availability-count").textContent = "";
    return;
  }
  const weekday = new Date(`${selectedDate}T12:00:00`).getDay();
  if (!settings.workingDays.includes(weekday)) {
    grid.innerHTML = '<p class="no-times">العيادة مغلقة في هذا اليوم. اختر يومًا آخر.</p>';
    byId("availability-count").textContent = "";
    return;
  }
  const start = minutesFromTime(settings.openTime);
  const end = minutesFromTime(settings.closeTime);
  const service = getSelectedService();
  const duration = Math.max(10, Number(service?.duration) || Number(settings.slotDuration));
  const interval = Math.max(10, Number(settings.slotDuration) || 30);
  const bookedAppointments = [
    ...appointments.filter((appointment) => appointment.date === selectedDate && appointment.status !== "cancelled"),
    ...sharedBookedSlots.filter((appointment) => appointment.date === selectedDate)
  ];
  const now = new Date();
  const today = localDateKey(now);
  const slots = [];
  for (let minute = start; minute + duration <= end; minute += interval) {
    const time = timeFromMinutes(minute);
    const past = selectedDate === today && minute <= now.getHours() * 60 + now.getMinutes();
    const overlapsBooking = bookedAppointments.some((appointment) => {
      const bookedStart = minutesFromTime(appointment.time);
      const bookedService = services.find((item) => item.id === appointment.serviceId);
      const bookedDuration = Number(appointment.duration) || Number(bookedService?.duration) || interval;
      return minute < bookedStart + bookedDuration && minute + duration > bookedStart;
    });
    slots.push({ time, disabled: overlapsBooking || past });
  }
  const availableCount = slots.filter((slot) => !slot.disabled).length;
  byId("availability-count").textContent = availableCount ? `${availableCount} أوقات متاحة` : "لا توجد أوقات متاحة";
  if (!slots.length) {
    grid.innerHTML = '<p class="no-times">لا توجد مواعيد ضمن أوقات الدوام. يرجى مراجعة الإعدادات.</p>';
    return;
  }
  grid.innerHTML = slots.map(({ time, disabled }) => `<button type="button" class="time-option${time === selectedTime ? " active" : ""}" data-time="${time}" aria-pressed="${time === selectedTime}" ${disabled ? "disabled" : ""}>${formatTimeDisplay(time)}</button>`).join("");
  grid.querySelectorAll("[data-time]").forEach((button) => button.addEventListener("click", () => {
    selectedTime = button.dataset.time;
    bookingTime.value = selectedTime;
    grid.querySelectorAll(".time-option").forEach((option) => {
      option.classList.toggle("active", option.dataset.time === selectedTime);
      option.setAttribute("aria-pressed", String(option.dataset.time === selectedTime));
    });
    bookingMessage.textContent = "";
  }));
}

function refreshBookingOptions() {
  renderDateStrip();
  renderTimeSlots();
}

function refreshStoredData() {
  settings = { ...DEFAULT_SETTINGS, ...readStore(STORAGE_KEYS.settings, {}) };
  services = readStore(STORAGE_KEYS.services, DEFAULT_SERVICES);
  appointments = readStore(STORAGE_KEYS.appointments, []);
}

function buildWhatsAppMessage(appointment, service) {
  return [
    `مرحبًا ${settings.clinicName}، أود تأكيد حجز موعد:`,
    `الاسم: ${appointment.name}`,
    `الخدمة: ${service.name}`,
    `التاريخ: ${formatDate(appointment.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`,
    `الوقت: ${formatTimeDisplay(appointment.time)}`,
    `رقم التواصل: ${appointment.phone}`,
    "يرجى تأكيد الموعد. شكرًا لكم."
  ].join("\n");
}

bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  bookingMessage.classList.remove("success");
  if (!bookingForm.reportValidity()) return;
  if (!serverMode) {
    bookingMessage.textContent = "خدمة الحجز غير متاحة الآن. يرجى المحاولة عند عودة اتصال خادم العيادة.";
    return;
  }
  const service = getSelectedService();
  if (!service || !selectedDate || !selectedTime) {
    bookingMessage.textContent = "يرجى اختيار الخدمة واليوم والوقت أولًا.";
    return;
  }
  const formData = new FormData(bookingForm);
  const appointment = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: String(formData.get("name")).trim(),
    phone: String(formData.get("phone")).trim(),
    age: String(formData.get("age") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    serviceId: service.id,
    serviceName: service.name,
    duration: Number(service.duration),
    date: selectedDate,
    time: selectedTime,
    status: "pending",
    createdAt: new Date().toISOString()
  };
  try {
    const result = await requestApi("/api/appointments", {
      method: "POST",
      body: { ...appointment, serviceId: service.id }
    });
    Object.assign(appointment, result.appointment);
    sharedBookedSlots.push({ date: appointment.date, time: appointment.time, duration: appointment.duration, serviceId: appointment.serviceId });
  } catch (error) {
    bookingMessage.textContent = error.message;
    try {
      await refreshServerState();
      renderTimeSlots();
    } catch {}
    return;
  }
  const message = buildWhatsAppMessage(appointment, service);
  const whatsappURL = `https://wa.me/${normalizeWhatsApp(settings.whatsapp)}?text=${encodeURIComponent(message)}`;
  window.open(whatsappURL, "_blank", "noopener,noreferrer");
  refreshStoredData();
  renderTimeSlots();
  bookingMessage.classList.add("success");
  bookingMessage.textContent = "تم تسجيل طلب الموعد. أرسل رسالة واتساب لإتمام التأكيد.";
  addNotification("حجز جديد", `${appointment.name} · ${formatDate(appointment.date)} · ${formatTimeDisplay(appointment.time)}`, "booking");
  showToast("تم تجهيز رسالة الحجز في واتساب.");
  scheduleAppointmentReminders();
});

function setAuthMode(mode) {
  authMode = mode;
  const isRegister = mode === "register";
  const isReset = mode === "reset";
  byId("login-tab").classList.toggle("active", mode === "login");
  byId("register-tab").classList.toggle("active", isRegister);
  byId("login-tab").setAttribute("aria-selected", String(mode === "login"));
  byId("register-tab").setAttribute("aria-selected", String(isRegister));
  byId("auth-tabs").hidden = isReset;
  document.querySelectorAll(".auth-register-field").forEach((field) => {
    const showForReset = isReset && field.id === "auth-confirm-password";
    field.hidden = !isRegister && !showForReset;
    field.required = (isRegister || showForReset) && field.id !== "auth-age";
  });
  byId("auth-email-label").hidden = isReset;
  byId("auth-email").hidden = isReset;
  byId("auth-email").required = !isReset;
  byId("auth-password-label").textContent = isReset ? "كلمة المرور الجديدة" : "كلمة المرور";
  byId("auth-password").autocomplete = isRegister || isReset ? "new-password" : "current-password";
  byId("auth-password").minLength = isRegister || isReset ? 12 : 1;
  byId("auth-confirm-password").autocomplete = "new-password";
  byId("auth-forgot-password").hidden = mode !== "login" || adminAuthRequested;
  byId("auth-resend-verification").hidden = true;
  byId("auth-submit").innerHTML = isRegister ? 'إنشاء حساب <span aria-hidden="true">←</span>' :
    isReset ? 'تحديث كلمة المرور <span aria-hidden="true">←</span>' : 'تسجيل الدخول <span aria-hidden="true">←</span>';
  byId("auth-title").textContent = isReset ? "استعادة كلمة المرور." : adminAuthRequested ? "تسجيل دخول الإدارة." :
    isRegister ? "أنشئ حسابك معنا." : "تابع رحلتك معنا.";
  byId("auth-message").textContent = "";
  byId("auth-message").classList.remove("success");
}

function openAuthDialog(forAdmin = false, initialMode = "login") {
  adminAuthRequested = forAdmin;
  setAuthMode(initialMode);
  byId("register-tab").hidden = forAdmin || initialMode === "reset";
  if (!authDialog.open) authDialog.showModal();
  byId(initialMode === "register" ? "auth-name" : initialMode === "reset" ? "auth-password" : "auth-email").focus();
}

byId("account-button").addEventListener("click", () => {
  openAuthDialog(false, "login");
});

byId("admin-button").addEventListener("click", () => openAuthDialog(false, "register"));
byId("account-avatar").addEventListener("click", () => {
  const open = byId("account-popover").hidden;
  byId("account-popover").hidden = !open;
  byId("account-avatar").setAttribute("aria-expanded", String(open));
});
document.addEventListener("click", (event) => {
  if (event.target.closest("#account-avatar, #account-popover")) return;
  byId("account-popover").hidden = true;
  byId("account-avatar").setAttribute("aria-expanded", "false");
});
function initializeNotificationSystem() {
  notifications = readStore(NOTIFICATION_STORAGE_KEY, []);
  renderNotificationPanel();
  const bell = byId("notification-bell");
  const panel = byId("notification-panel");
  const mobileBell = byId("mobile-notification-trigger");
  const togglePanel = async () => {
    const shouldOpen = panel.hidden;
    panel.hidden = !shouldOpen;
    if (shouldOpen) markNotificationsRead();
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission().catch(() => {});
    }
  };
  if (bell && panel) bell.addEventListener("click", togglePanel);
  if (mobileBell && panel) mobileBell.addEventListener("click", togglePanel);
  document.addEventListener("click", (event) => {
    if (!event.target.closest("#notification-bell") && !event.target.closest("#notification-panel") && !event.target.closest("#mobile-notification-trigger")) panel.hidden = true;
  });
}
initializeNotificationSystem();
byId("mobile-account-trigger").addEventListener("click", () => {
  byId(signedInUser ? "account-avatar" : "account-button").click();
});
scheduleAppointmentReminders();
byId("account-logout").addEventListener("click", async () => {
  if (serverMode) await requestApi("/api/auth/logout", { method: "POST" }).catch(() => {});
  applySignedInUser(null);
  showToast("تم تسجيل الخروج.");
});
byId("change-avatar").addEventListener("click", () => byId("avatar-file").click());
byId("avatar-file").addEventListener("change", async (event) => {
  const file = event.currentTarget.files[0];
  if (!file || !signedInUser) return;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
    showToast("اختر صورة PNG أو WebP أو JPEG بحجم أقل من 2 ميجابايت.");
    event.currentTarget.value = "";
    return;
  }
  try {
    const result = await requestApi("/api/user/avatar", { method: "POST", body: await readUploadFile(file) });
    applySignedInUser(result.user);
    byId("account-popover").hidden = true;
    showToast("تم تحديث صورة الحساب.");
  } catch (error) { showToast(error.message); }
  event.currentTarget.value = "";
});

byId("admin-entry").addEventListener("click", () => {
  openAuthDialog(true);
});

byId("auth-close").addEventListener("click", () => authDialog.close());
authDialog.addEventListener("click", (event) => {
  if (event.target === authDialog) authDialog.close();
});
document.querySelectorAll("[data-auth-mode]").forEach((button) => button.addEventListener("click", () => setAuthMode(button.dataset.authMode)));

byId("auth-forgot-password").addEventListener("click", async () => {
  const email = byId("auth-email").value.trim().toLowerCase();
  const message = byId("auth-message");
  if (!email) {
    message.textContent = "أدخل بريدك الإلكتروني أولًا.";
    byId("auth-email").focus();
    return;
  }
  try {
    const result = await requestApi("/api/auth/password-reset", { method: "POST", body: { email } });
    message.classList.add("success");
    message.textContent = result.message;
  } catch (error) {
    message.textContent = error.message;
    if (authMode === "register" && error.message.includes("أُنشئ الحساب")) {
      byId("auth-resend-verification").hidden = false;
    }
  }
});

byId("auth-resend-verification").addEventListener("click", async () => {
  const email = byId("auth-email").value.trim().toLowerCase();
  try {
    const result = await requestApi("/api/auth/resend-verification", { method: "POST", body: { email } });
    byId("auth-message").classList.add("success");
    byId("auth-message").textContent = result.message;
  } catch (error) {
    byId("auth-message").textContent = error.message;
  }
});

byId("auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const email = byId("auth-email").value.trim().toLowerCase();
  const password = byId("auth-password").value;
  const message = byId("auth-message");
  message.classList.remove("success");
  message.textContent = "";

  if (serverMode) {
    try {
      if (authMode === "reset") {
        const result = await requestApi("/api/auth/password-reset/confirm", {
          method: "POST",
          body: { token: resetToken, password, confirmPassword: byId("auth-confirm-password").value }
        });
        resetToken = "";
        form.reset();
        setAuthMode("login");
        message.classList.add("success");
        message.textContent = result.message;
        return;
      }
      const path = authMode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body = { email, password };
      if (authMode === "register") {
        body.name = byId("auth-name").value.trim();
        body.age = byId("auth-age").value ? Number(byId("auth-age").value) : null;
        body.phone = byId("auth-phone").value.trim();
        body.confirmPassword = byId("auth-confirm-password").value;
      }
      const result = await requestApi(path, { method: "POST", body });
      if (result.verificationRequired) {
        message.classList.add("success");
        message.textContent = result.message;
        byId("auth-resend-verification").hidden = false;
        return;
      }
      if (adminAuthRequested && result.role !== "admin") {
        message.textContent = "هذا الحساب لا يملك صلاحية لوحة الإدارة.";
        return;
      }
      byId("auth-form").reset();
      authDialog.close();
      if (result.role === "admin") {
        applySignedInUser({ ...result.user, avatarUrl: settings.adminAvatarUrl, role: "admin" });
        showAdminView();
      } else {
        applySignedInUser(result.user);
        showToast("تم تسجيل الدخول بنجاح.");
      }
    } catch (error) {
      message.textContent = error.message;
    }
    return;
  }

  message.textContent = "خدمة الحسابات غير متاحة الآن. افتح الموقع عبر خادم العيادة وحاول مجددًا.";
});

async function showAdminView() {
  if (!serverMode || !["admin", "staff"].includes(signedInUser?.role)) {
    showToast("يلزم تسجيل الدخول إلى الخادم لفتح لوحة الإدارة.");
    return;
  }
  byId("public-view").hidden = true;
  document.querySelector(".site-header").hidden = true;
  document.querySelector(".site-footer").hidden = true;
  byId("admin-view").hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (serverMode) {
    try {
      await refreshServerState();
      if (signedInUser?.role === "admin") {
        await refreshAdminAppointments();
        await loadDashboardData();
        await loadCollection("doctors");
        await loadCollection("patients");
        await refreshAdminMembers();
        await loadStaffUsers();
        await loadNotifications();
        applyAdminPermissions(["appointments", "patients", "doctors", "services", "media", "content", "appearance", "users", "reports", "settings"].flatMap((area) => PERMISSION_ACTIONS_FOR_UI[area].map((action) => `${area}.${action}`)));
      } else if (signedInUser?.role === "staff") {
        applyAdminPermissions(signedInUser.permissions || []);
        if (adminHasPermission("appointments.view")) await refreshAdminAppointments();
        if (adminHasPermission("reports.view")) await loadDashboardData();
        if (adminHasPermission("doctors.view")) await loadCollection("doctors");
        if (adminHasPermission("patients.view")) await loadCollection("patients");
        if (adminHasPermission("users.view")) await loadStaffUsers();
        if (adminHasPermission("settings.view")) await loadNotifications();
      }
      if (byId("admin-current-user")) byId("admin-current-user").textContent = signedInUser?.name || "مدير النظام";
      const activeTab = document.querySelector("[data-admin-tab].active");
      if (!activeTab || activeTab.hidden) {
        const firstAvailableTab = [...document.querySelectorAll("[data-admin-tab]")].find((button) => !button.hidden);
        if (firstAvailableTab) await activateAdminTab(firstAvailableTab);
      }
    } catch (error) {
      showToast(error.message);
    }
  } else {
    renderAdmin();
  }
}

function showPublicView() {
  byId("admin-view").hidden = true;
  byId("public-view").hidden = false;
  document.querySelector(".site-header").hidden = false;
  document.querySelector(".site-footer").hidden = false;
  applySiteTheme();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

byId("back-to-site").addEventListener("click", showPublicView);
byId("logout-button").addEventListener("click", () => {
  if (serverMode) requestApi("/api/auth/logout", { method: "POST" }).catch(() => {});
  applySignedInUser(null);
  showPublicView();
  showToast("تم تسجيل الخروج من لوحة الإدارة.");
});
function renderAdmin() {
  renderAppointments();
  renderStats();
  renderAdminServices();
  renderAdminGallery();
  renderAdminMembers();
  renderBrandingControls();
  fillSettingsForm();
}

async function loadDashboardData() {
  if (!serverMode) return;
  dashboardData = await requestApi("/api/admin/overview");
  renderStats();
  renderDashboardChart();
  renderTodayAppointments();
}

function renderStats() {
  const today = localDateKey(new Date());
  const stats = dashboardData || {
    totalBookings: appointments.length,
    todayBookings: appointments.filter((item) => item.date === today).length,
    confirmedBookings: appointments.filter((item) => item.status === "confirmed").length,
    newBookings: appointments.filter((item) => ["pending", "new", "review"].includes(item.status)).length,
    patients: patients.length,
    doctors: doctors.length,
    services: services.length,
    revenue: appointments.filter((item) => item.status === "completed").reduce((sum, item) => sum + (Number(item.price) || 0), 0)
  };
  for (const [id, value] of Object.entries({
    "stat-total": stats.totalBookings,
    "stat-today": stats.todayBookings,
    "stat-confirmed": stats.confirmedBookings,
    "stat-pending": stats.newBookings,
    "stat-patients": stats.patients,
    "stat-doctors": stats.doctors,
    "stat-services": stats.services,
    "stat-revenue": Number(stats.revenue || 0)
  })) if (byId(id)) byId(id).textContent = Number(value || 0).toLocaleString("ar-JO");
  if (byId("dashboard-date")) byId("dashboard-date").textContent = new Intl.DateTimeFormat("ar-JO", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  if (byId("sidebar-count")) byId("sidebar-count").textContent = Number(stats.newBookings || 0).toLocaleString("ar-JO");
}

function renderDashboardChart() {
  const chart = byId("booking-chart");
  if (!chart) return;
  const range = byId("chart-range").value;
  const today = new Date();
  let buckets = [];
  if (range === "day") {
    buckets = Array.from({ length: 8 }, (_, index) => {
      const hour = 8 + index * 2;
      const dayKey = localDateKey(today);
      return { label: `${String(hour).padStart(2, "0")}:00`, count: appointments.filter((item) => item.date === dayKey && Number(item.time.slice(0, 2)) >= hour && Number(item.time.slice(0, 2)) < hour + 2).length };
    });
  } else if (range === "week") {
    buckets = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const key = localDateKey(date);
      return { label: WEEKDAY_SHORT[date.getDay()], count: appointments.filter((item) => item.date === key).length };
    });
  } else if (range === "year") {
    buckets = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() - 11 + index, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return { label: new Intl.DateTimeFormat("ar-JO", { month: "short" }).format(date), count: appointments.filter((item) => item.date.startsWith(key)).length };
    });
  } else {
    buckets = Array.from({ length: 4 }, (_, index) => {
      const end = new Date(today);
      end.setDate(today.getDate() - (3 - index) * 7);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      return { label: `أسبوع ${index + 1}`, count: appointments.filter((item) => new Date(`${item.date}T12:00:00`) >= start && new Date(`${item.date}T12:00:00`) <= end).length };
    });
  }
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
  chart.innerHTML = buckets.map((bucket) => `<div class="chart-column" title="${escapeHTML(bucket.label)}: ${bucket.count}"><span style="height:${Math.max(3, bucket.count / max * 100)}%"></span><small>${escapeHTML(bucket.label)}</small></div>`).join("");
}

function renderTodayAppointments() {
  const body = byId("today-appointments");
  if (!body) return;
  const today = localDateKey(new Date());
  const todaysAppointments = appointments.filter((item) => item.date === today).sort((a, b) => a.time.localeCompare(b.time));
  byId("today-empty").hidden = todaysAppointments.length > 0;
  body.innerHTML = todaysAppointments.map((item) => `<tr><td>${escapeHTML(item.name)}</td><td>${escapeHTML(item.doctorName || "غير محدد")}<br>${escapeHTML(item.serviceName)}</td><td dir="ltr">${escapeHTML(item.time)}</td><td><span class="dashboard-status">${STATUS_LABELS[item.status] || item.status}</span></td></tr>`).join("");
}

async function loadStaffUsers() {
  const result = await requestApi("/api/admin/users");
  const body = byId("staff-user-rows");
  body.innerHTML = result.users.map((user) => `<tr><td>${escapeHTML(user.name)}</td><td>${escapeHTML(user.email)}</td><td>${escapeHTML(user.role)}</td><td>${user.permissions.length.toLocaleString("ar-JO")} صلاحيات</td><td>${user.disabled ? "موقوف" : "نشط"}</td><td>${user.type === "staff" ? `<div class="collection-actions"><button type="button" data-toggle-staff="${escapeHTML(user.id)}" data-disabled="${!user.disabled}">${user.disabled ? "تفعيل" : "إيقاف"}</button><button type="button" data-delete-staff="${escapeHTML(user.id)}">حذف</button></div>` : "عضو موقع"}</td></tr>`).join("");
  const roles = await requestApi("/api/admin/roles");
  byId("role-list").innerHTML = roles.roles.map((role) => `<article class="collection-row"><div><strong>${escapeHTML(role.name)}</strong><small>${role.permissions.map((permission) => escapeHTML(permission)).join("، ")}</small></div></article>`).join("") || '<div class="empty-state"><strong>الأدوار الافتراضية مفعّلة من الخادم</strong></div>';
  const roleSelect = byId("staff-user-form").querySelector('[name="role"]');
  if (roleSelect) {
    const builtIns = [
      { name: "Receptionist", permissions: ["appointments.view", "appointments.create", "appointments.edit", "patients.view", "patients.create", "patients.edit"] },
      { name: "Doctor", permissions: ["appointments.view", "appointments.edit", "patients.view", "patients.edit"] },
      { name: "Editor", permissions: ["content.view", "content.create", "content.edit", "media.view", "media.upload", "appearance.view", "appearance.edit"] },
      { name: "Admin", permissions: Object.entries(PERMISSION_ACTIONS_FOR_UI).flatMap(([area, actions]) => actions.map((action) => `${area}.${action}`)) }
    ];
    const availableRoles = [...builtIns, ...roles.roles].filter((role) =>
      signedInUser?.role === "admin" || role.permissions.every((permission) => adminHasPermission(permission))
    );
    roleSelect.innerHTML = availableRoles.map((role) => `<option value="${escapeHTML(role.name)}">${escapeHTML(role.name)}</option>`).join("");
  }
  body.querySelectorAll("[data-toggle-staff]").forEach((button) => {
    button.hidden = !adminHasPermission("users.edit");
  });
  body.querySelectorAll("[data-delete-staff]").forEach((button) => {
    button.hidden = !adminHasPermission("users.delete");
  });
  body.querySelectorAll("[data-toggle-staff]").forEach((button) => button.addEventListener("click", async () => {
    try {
      await requestApi(`/api/admin/users/${encodeURIComponent(button.dataset.toggleStaff)}`, { method: "PATCH", body: { disabled: button.dataset.disabled === "true" } });
      await loadStaffUsers();
      showToast("تم تحديث حالة المستخدم.");
    } catch (error) { showToast(error.message); }
  }));
  body.querySelectorAll("[data-delete-staff]").forEach((button) => button.addEventListener("click", async () => {
    if (!await confirmAction("هل أنت متأكد من حذف حساب المستخدم؟")) return;
    try {
      await requestApi(`/api/admin/users/${encodeURIComponent(button.dataset.deleteStaff)}`, { method: "DELETE" });
      await loadStaffUsers();
    } catch (error) { showToast(error.message); }
  }));
}

byId("add-staff-user").addEventListener("click", () => {
  const form = byId("staff-user-form");
  form.hidden = false;
  form.innerHTML = `<label>الاسم<input class="field-control" name="name" required></label><label>البريد الإلكتروني<input class="field-control" name="email" type="email" required></label><label>كلمة المرور المؤقتة<input class="field-control" name="password" type="password" minlength="12" required></label><label>الدور<select class="field-control" name="role" required></select></label><div class="span-all"><button class="button button-primary" type="submit">إنشاء المستخدم</button><p class="admin-feedback" data-form-feedback></p></div>`;
  loadStaffUsers().catch((error) => { form.querySelector("[data-form-feedback]").textContent = error.message; });
  form.onsubmit = async (event) => {
    event.preventDefault();
    try {
      await requestApi("/api/admin/users", { method: "POST", body: Object.fromEntries(new FormData(form)) });
      form.hidden = true;
      await loadStaffUsers();
      showToast("تم إنشاء مستخدم الفريق.");
    } catch (error) { form.querySelector("[data-form-feedback]").textContent = error.message; }
  };
});

byId("role-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const permissions = [...byId("role-permissions").selectedOptions].map((option) => option.value);
  try {
    await requestApi("/api/admin/roles", { method: "POST", body: { name: byId("role-name").value.trim(), permissions } });
    byId("role-form").reset();
    await loadStaffUsers();
    showToast("تم حفظ الدور.");
  } catch (error) { showToast(error.message); }
});

async function loadNotifications() {
  const result = await requestApi("/api/admin/notifications");
  notifications = result.notifications;
  const count = byId("notification-count");
  count.textContent = String(notifications.length);
  count.hidden = notifications.length === 0;
  byId("notification-list").innerHTML = notifications.length ? notifications.map((item) => `<article class="notification-item"><strong>${escapeHTML(item.title)}</strong><div>${escapeHTML(item.detail)}</div><small>${escapeHTML(new Date(item.createdAt).toLocaleString("ar-JO"))}</small></article>`).join("") : '<div class="empty-state"><strong>لا توجد إشعارات جديدة</strong></div>';
}

async function loadReports() {
  reports = await requestApi(`/api/admin/reports?period=${encodeURIComponent(byId("report-period").value)}`);
  byId("report-bookings").textContent = Number(reports.bookings).toLocaleString("ar-JO");
  byId("report-completed").textContent = Number(reports.completed).toLocaleString("ar-JO");
  byId("report-revenue").textContent = Number(reports.revenue).toLocaleString("ar-JO");
  byId("report-services").innerHTML = reports.byService.length ? reports.byService.map((item) => `<article class="collection-row"><div><strong>${escapeHTML(item.name)}</strong><small>${Number(item.count).toLocaleString("ar-JO")} حجز</small></div><strong>${Number(item.revenue).toLocaleString("ar-JO")}</strong></article>`).join("") : '<div class="empty-state"><strong>لا توجد بيانات للفترة المحددة</strong></div>';
}

byId("report-period").addEventListener("change", () => loadReports().catch((error) => showToast(error.message)));
byId("export-report").addEventListener("click", () => {
  if (!reports) return;
  exportCsv("clinic-report.csv", [["الخدمة", "الحجوزات", "الإيرادات"], ...reports.byService.map((item) => [item.name, item.count, item.revenue])]);
});

async function loadSystemPanel() {
  const [activityResult, backupResult] = await Promise.all([requestApi("/api/admin/activity"), requestApi("/api/admin/backups")]);
  byId("activity-list").innerHTML = activityResult.activity.length ? activityResult.activity.slice(0, 40).map((item) => `<article class="collection-row"><div><strong>${escapeHTML(item.action)} · ${escapeHTML(item.target)}</strong><small>${escapeHTML(item.actor)} · ${escapeHTML(new Date(item.createdAt).toLocaleString("ar-JO"))}</small></div></article>`).join("") : '<div class="empty-state"><strong>لا توجد نشاطات مسجلة</strong></div>';
  byId("backup-list").innerHTML = backupResult.backups.length ? backupResult.backups.map((item) => `<article class="collection-row"><div><strong>${escapeHTML(item.filename)}</strong><small>${escapeHTML(new Date(item.createdAt).toLocaleString("ar-JO"))} · ${Math.ceil(item.size / 1024)} كيلوبايت</small></div></article>`).join("") : '<div class="empty-state"><strong>لا توجد نسخ احتياطية بعد</strong></div>';
}

byId("create-backup").addEventListener("click", async () => {
  try {
    const result = await requestApi("/api/admin/backup", { method: "POST", body: {} });
    showToast(`تم إنشاء ${result.backup.filename}`);
    await loadSystemPanel();
  } catch (error) { showToast(error.message); }
});
byId("export-database").addEventListener("click", async () => {
  try {
    const result = await requestApi("/api/admin/export");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" }));
    link.download = `clinic-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (error) { showToast(error.message); }
});

let searchTimer;
function renderAdminSearch(query) {
  clearTimeout(searchTimer);
  const results = byId("admin-search-results");
  const search = query.trim().toLowerCase();
  if (!search) { results.hidden = true; return; }
  results.hidden = false;
  results.innerHTML = '<div class="empty-state"><strong>جارٍ البحث...</strong></div>';
  searchTimer = setTimeout(async () => {
    try {
      const names = ["patients", "doctors", "pages", "posts", "messages"];
      const collections = await Promise.all(names.map(async (name) => [name, (await requestApi(collectionEndpoint(name))).items]));
      const searchable = [
        ...appointments.map((item) => ({ type: "appointments", title: item.name, detail: `${item.phone} · ${item.date}`, text: `${item.id} ${item.name} ${item.phone} ${item.email}` })),
        ...services.map((item) => ({ type: "services", title: item.name, detail: "خدمة", text: `${item.name} ${item.description}` })),
        ...collections.flatMap(([type, items]) => items.map((item) => ({ type, title: item.title || item.name || item.question, detail: item.email || item.phone || item.status || type, text: JSON.stringify(item) })))
      ].filter((item) => item.title && item.text.toLowerCase().includes(search)).slice(0, 12);
      results.innerHTML = searchable.length ? searchable.map((item) => `<button type="button" data-search-tab="${item.type}" data-search-title="${escapeHTML(item.title)}"><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.detail)}</small></button>`).join("") : '<div class="empty-state"><strong>لا توجد نتائج</strong></div>';
      results.querySelectorAll("[data-search-tab]").forEach((button) => button.addEventListener("click", () => {
        const tab = document.querySelector(`[data-admin-tab="${button.dataset.searchTab}"]`);
        if (tab) activateAdminTab(tab);
        if (button.dataset.searchTab === "appointments") byId("appointment-search").value = button.dataset.searchTitle;
        results.hidden = true;
      }));
    } catch (error) { results.innerHTML = `<div class="empty-state"><strong>${escapeHTML(error.message)}</strong></div>`; }
  }, 220);
}

let calendarCursor = new Date();
function renderCalendar() {
  const grid = byId("calendar-grid");
  if (!grid) return;
  const mode = byId("calendar-view-mode").value;
  const start = new Date(calendarCursor);
  let dates = [];
  if (mode === "day") dates = [start];
  else if (mode === "week") {
    const first = new Date(start);
    first.setDate(start.getDate() - start.getDay());
    dates = Array.from({ length: 7 }, (_, index) => { const date = new Date(first); date.setDate(first.getDate() + index); return date; });
  } else {
    const first = new Date(start.getFullYear(), start.getMonth(), 1);
    first.setDate(first.getDate() - first.getDay());
    dates = Array.from({ length: 42 }, (_, index) => { const date = new Date(first); date.setDate(first.getDate() + index); return date; });
  }
  const end = dates.at(-1);
  byId("calendar-period").textContent = mode === "day" ? formatDate(localDateKey(start), { day: "numeric", month: "long", year: "numeric" }) : `${formatDate(localDateKey(start), { month: "short", year: "numeric" })}${mode === "week" ? ` · ${formatDate(localDateKey(end), { day: "numeric", month: "short" })}` : ""}`;
  grid.className = `calendar-grid calendar-${mode}`;
  const canEditAppointments = adminHasPermission("appointments.edit");
  const weekdays = WEEKDAYS.map((day) => `<div class="calendar-weekday">${day}</div>`).join("");
  const cells = dates.map((date) => {
    const key = localDateKey(date);
    const today = key === localDateKey(new Date());
    const items = appointments.filter((item) => item.date === key);
    return `<div class="calendar-day${today ? " is-today" : ""}${date.getMonth() !== start.getMonth() && mode === "month" ? " is-outside" : ""}" data-calendar-day="${key}"><strong>${date.getDate()}</strong>${items.map((item) => `<button draggable="${canEditAppointments}" class="calendar-appointment" data-calendar-appointment="${escapeHTML(item.id)}" title="${escapeHTML(item.name)} · ${escapeHTML(item.time)}">${escapeHTML(item.time)} ${escapeHTML(item.name)}</button>`).join("")}</div>`;
  }).join("");
  grid.innerHTML = `${mode === "month" ? weekdays : ""}${cells}`;
  grid.querySelectorAll("[data-calendar-appointment]").forEach((item) => {
    item.addEventListener("click", () => showAppointmentDetails(item.dataset.calendarAppointment));
    if (canEditAppointments) item.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", item.dataset.calendarAppointment));
  });
  grid.querySelectorAll("[data-calendar-day]").forEach((cell) => {
    cell.addEventListener("dragover", (event) => event.preventDefault());
    cell.addEventListener("drop", async (event) => {
      event.preventDefault();
      const id = event.dataTransfer.getData("text/plain");
      try {
        await requestApi(`/api/admin/appointments/${encodeURIComponent(id)}`, { method: "PATCH", body: { date: cell.dataset.calendarDay } });
        await refreshAdminAppointments();
        renderCalendar();
        showToast("تم نقل الموعد إلى التاريخ الجديد.");
      } catch (error) { showToast(error.message); }
    });
  });
}

byId("calendar-prev").addEventListener("click", () => {
  const mode = byId("calendar-view-mode").value;
  calendarCursor.setDate(calendarCursor.getDate() - (mode === "month" ? 30 : mode === "week" ? 7 : 1));
  renderCalendar();
});
byId("calendar-next").addEventListener("click", () => {
  const mode = byId("calendar-view-mode").value;
  calendarCursor.setDate(calendarCursor.getDate() + (mode === "month" ? 30 : mode === "week" ? 7 : 1));
  renderCalendar();
});
byId("calendar-view-mode").addEventListener("change", renderCalendar);

function renderAppointments() {
  const filter = byId("appointment-filter").value;
  const search = byId("appointment-search").value.trim().toLowerCase();
  const dateFilter = byId("appointment-date-filter").value;
  const doctorFilter = byId("appointment-doctor-filter").value;
  const serviceFilter = byId("appointment-service-filter").value;
  const sortedAppointments = [...appointments].sort((first, second) => `${first.date} ${first.time}`.localeCompare(`${second.date} ${second.time}`));
  const visible = sortedAppointments.filter((appointment) => {
    const matchesFilter = filter === "all" || appointment.status === filter;
    const haystack = `${appointment.id} ${appointment.name} ${appointment.phone} ${appointment.email} ${appointment.doctorName} ${appointment.serviceName}`.toLowerCase();
    return matchesFilter && haystack.includes(search) && (!dateFilter || appointment.date === dateFilter) && (!doctorFilter || appointment.doctorId === doctorFilter) && (!serviceFilter || appointment.serviceId === serviceFilter);
  });
  const body = byId("appointments-body");
  const canEditAppointments = adminHasPermission("appointments.edit");
  const canDeleteAppointments = adminHasPermission("appointments.delete");
  byId("table-result-count").textContent = `${visible.length.toLocaleString("ar-JO")} حجز`;
  byId("empty-appointments").hidden = visible.length > 0;
  body.innerHTML = visible.map((appointment) => {
    const status = STATUS_LABELS[appointment.status] || STATUS_LABELS.pending;
    const serviceName = appointment.serviceName || services.find((service) => service.id === appointment.serviceId)?.name || "خدمة العيادة";
    return `<tr>
      <td>${canDeleteAppointments ? `<input type="checkbox" data-select-appointment="${escapeHTML(appointment.id)}" ${selectedAppointments.has(appointment.id) ? "checked" : ""} aria-label="تحديد الحجز">` : ""}</td>
      <td>${escapeHTML(appointment.id.slice(0, 8))}</td>
      <td><button class="table-link" type="button" data-view-appointment="${escapeHTML(appointment.id)}">${escapeHTML(appointment.name)}</button></td>
      <td dir="ltr">${escapeHTML(appointment.phone)}</td>
      <td>${escapeHTML(appointment.doctorName || "غير محدد")}</td>
      <td>${escapeHTML(serviceName)}</td>
      <td>${escapeHTML(formatDate(appointment.date))} · <span dir="ltr">${escapeHTML(appointment.time)}</span></td>
      <td><span class="status-badge status-${escapeHTML(appointment.status)}">${status}</span></td>
      <td><div class="row-actions"><button type="button" data-view-appointment="${escapeHTML(appointment.id)}">عرض</button>${canEditAppointments ? `<select aria-label="تغيير حالة حجز ${escapeHTML(appointment.name)}" data-status-id="${escapeHTML(appointment.id)}">${Object.entries(STATUS_LABELS).map(([value, label]) => `<option value="${value}" ${appointment.status === value ? "selected" : ""}>${label}</option>`).join("")}</select>` : ""}${canDeleteAppointments ? `<button class="row-delete" type="button" aria-label="حذف حجز ${escapeHTML(appointment.name)}" data-delete-id="${escapeHTML(appointment.id)}">×</button>` : ""}</div></td>
    </tr>`;
  }).join("");
  byId("select-all-appointments").hidden = !canDeleteAppointments;
  byId("bulk-delete-appointments").hidden = !canDeleteAppointments;
  byId("export-appointments").hidden = !adminHasPermission("reports.export");
  byId("select-all-appointments").checked = visible.length > 0 && visible.every((item) => selectedAppointments.has(item.id));
  byId("selection-count").textContent = `${selectedAppointments.size.toLocaleString("ar-JO")} حجز محدد`;
  byId("bulk-delete-appointments").disabled = selectedAppointments.size === 0;

  body.querySelectorAll("[data-select-appointment]").forEach((checkbox) => checkbox.addEventListener("change", () => {
    if (checkbox.checked) selectedAppointments.add(checkbox.dataset.selectAppointment);
    else selectedAppointments.delete(checkbox.dataset.selectAppointment);
    renderAppointments();
  }));
  body.querySelectorAll("[data-view-appointment]").forEach((button) => button.addEventListener("click", () => showAppointmentDetails(button.dataset.viewAppointment)));

  body.querySelectorAll("[data-status-id]").forEach((select) => select.addEventListener("change", async () => {
    const appointment = appointments.find((item) => item.id === select.dataset.statusId);
    if (!appointment) return;
    if (serverMode) {
      try {
        await requestApi(`/api/admin/appointments/${encodeURIComponent(appointment.id)}`, { method: "PATCH", body: { status: select.value } });
        await refreshAdminAppointments();
        await refreshServerState();
        renderTimeSlots();
        loadDashboardData().catch(() => {});
        showToast("تم تحديث حالة الحجز.");
      } catch (error) { showToast(error.message); }
      return;
    }
    appointment.status = select.value;
    writeStore(STORAGE_KEYS.appointments, appointments);
    renderAdmin();
    renderTimeSlots();
    showToast("تم تحديث حالة الحجز.");
  }));
  body.querySelectorAll("[data-delete-id]").forEach((button) => button.addEventListener("click", async () => {
    if (!await confirmAction("هل أنت متأكد من حذف هذا الحجز؟")) return;
    if (serverMode) {
      try {
        await requestApi(`/api/admin/appointments/${encodeURIComponent(button.dataset.deleteId)}`, { method: "DELETE" });
        await refreshAdminAppointments();
        await refreshServerState();
        renderTimeSlots();
        loadDashboardData().catch(() => {});
        showToast("تم حذف الحجز.");
      } catch (error) { showToast(error.message); }
      return;
    }
    appointments = appointments.filter((appointment) => appointment.id !== button.dataset.deleteId);
    writeStore(STORAGE_KEYS.appointments, appointments);
    renderAdmin();
    renderTimeSlots();
    showToast("تم حذف الحجز.");
  }));
}

function exportCsv(filename, rows) {
  const content = `\ufeff${rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n")}`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function fillAppointmentFilters() {
  byId("appointment-doctor-filter").innerHTML = '<option value="">جميع الأطباء</option>' + doctors.map((doctor) => `<option value="${escapeHTML(doctor.id)}">${escapeHTML(doctor.name)}</option>`).join("");
  byId("appointment-service-filter").innerHTML = '<option value="">جميع الخدمات</option>' + services.map((service) => `<option value="${escapeHTML(service.id)}">${escapeHTML(service.name)}</option>`).join("");
  if (byId("service-doctor-input")) byId("service-doctor-input").innerHTML = '<option value="">بدون طبيب محدد</option>' + doctors.map((doctor) => `<option value="${escapeHTML(doctor.id)}">${escapeHTML(doctor.name)}</option>`).join("");
}

function showAppointmentDetails(id) {
  const item = appointments.find((appointment) => appointment.id === id);
  if (!item) return;
  let dialog = byId("appointment-details-dialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "appointment-details-dialog";
    dialog.className = "detail-dialog";
    document.body.append(dialog);
  }
  dialog.innerHTML = `<form method="dialog" class="detail-dialog-inner"><button class="dialog-close" aria-label="إغلاق">×</button><span class="section-kicker">تفاصيل الحجز</span><h2>${escapeHTML(item.name)}</h2><div class="detail-grid"><div><small>رقم الحجز</small><strong>${escapeHTML(item.id)}</strong></div><div><small>الهاتف</small><strong dir="ltr">${escapeHTML(item.phone)}</strong></div><div><small>الخدمة</small><strong>${escapeHTML(item.serviceName)}</strong></div><div><small>الطبيب</small><strong>${escapeHTML(item.doctorName || "غير محدد")}</strong></div><div><small>التاريخ والوقت</small><strong>${escapeHTML(item.date)} · ${escapeHTML(item.time)}</strong></div><div><small>الحالة</small><strong>${STATUS_LABELS[item.status] || item.status}</strong></div><div class="span-all"><small>ملاحظات</small><strong>${escapeHTML(item.notes || "لا توجد ملاحظات")}</strong></div></div><button class="button button-primary" value="close">إغلاق</button></form>`;
  dialog.showModal();
}

function openAdminAppointmentForm() {
  document.querySelector('[data-admin-tab="appointments"]').click();
  const form = byId("admin-appointment-form");
  form.hidden = false;
  form.innerHTML = `<label>اسم المريض<input class="field-control" name="name" required></label><label>الهاتف<input class="field-control" name="phone" type="tel" required></label><label>البريد الإلكتروني<input class="field-control" name="email" type="email"></label><label>الخدمة<select class="field-control" name="serviceId" required>${services.map((item) => `<option value="${escapeHTML(item.id)}">${escapeHTML(item.name)}</option>`).join("")}</select></label><label>الطبيب<select class="field-control" name="doctorId"><option value="">غير محدد</option>${doctors.map((item) => `<option value="${escapeHTML(item.id)}">${escapeHTML(item.name)}</option>`).join("")}</select></label><label>التاريخ<input class="field-control" name="date" type="date" required></label><label>الوقت<input class="field-control" name="time" type="time" required></label><label>السعر<input class="field-control" name="price" type="number" min="0" step="0.01"></label><label class="span-all">ملاحظات<textarea class="field-control" name="notes"></textarea></label><div class="span-all"><button class="button button-primary" type="submit">حفظ الحجز</button><button class="button button-quiet" id="cancel-admin-appointment" type="button">إلغاء</button><p class="admin-feedback" id="admin-appointment-feedback"></p></div>`;
  byId("cancel-admin-appointment").addEventListener("click", () => { form.hidden = true; });
  form.onsubmit = async (event) => {
    event.preventDefault();
    const input = Object.fromEntries(new FormData(form));
    try {
      await requestApi("/api/admin/appointments", { method: "POST", body: input });
      form.hidden = true;
      await refreshAdminAppointments();
      await loadDashboardData();
      showToast("تم إنشاء الحجز.");
    } catch (error) { byId("admin-appointment-feedback").textContent = error.message; }
  };
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

byId("admin-booking-link").addEventListener("click", openAdminAppointmentForm);
for (const id of ["appointment-filter", "appointment-date-filter", "appointment-doctor-filter", "appointment-service-filter"]) byId(id).addEventListener("change", renderAppointments);
byId("appointment-search").addEventListener("input", renderAppointments);
byId("select-all-appointments").addEventListener("change", (event) => {
  const filter = byId("appointment-filter").value;
  const visible = appointments.filter((appointment) => filter === "all" || appointment.status === filter);
  selectedAppointments = new Set(event.currentTarget.checked ? visible.map((item) => item.id) : []);
  renderAppointments();
});
byId("bulk-delete-appointments").addEventListener("click", async () => {
  if (!selectedAppointments.size || !await confirmAction(`هل أنت متأكد من حذف ${selectedAppointments.size} حجز؟`)) return;
  try {
    await requestApi("/api/admin/appointments/bulk-delete", { method: "POST", body: { ids: [...selectedAppointments] } });
    selectedAppointments.clear();
    await refreshAdminAppointments();
    await refreshServerState();
    showToast("تم حذف الحجوزات المحددة.");
  } catch (error) { showToast(error.message); }
});
byId("export-appointments").addEventListener("click", () => exportCsv("appointments.csv", [["رقم الحجز", "المريض", "الهاتف", "الطبيب", "الخدمة", "التاريخ", "الوقت", "الحالة"], ...appointments.map((item) => [item.id, item.name, item.phone, item.doctorName || "", item.serviceName, item.date, item.time, STATUS_LABELS[item.status] || item.status])]));

const ADMIN_TITLES = { overview: "لوحة التحكم", appointments: "الحجوزات", calendar: "التقويم", patients: "المرضى", doctors: "الأطباء", services: "الخدمات", pages: "الصفحات", posts: "المقالات", gallery: "مكتبة الوسائط", testimonials: "آراء المرضى", faqs: "الأسئلة الشائعة", messages: "الرسائل", users: "المستخدمون والأدوار", reports: "التقارير", branding: "الوسائط والتوثيق", customization: "تخصيص الموقع", settings: "الإعدادات", system: "النظام والسجل", members: "الأعضاء" };
const PERMISSION_ACTIONS_FOR_UI = {
  appointments: ["view", "create", "edit", "delete"], patients: ["view", "create", "edit", "delete"],
  doctors: ["view", "create", "edit", "delete"], services: ["view", "create", "edit", "delete"],
  media: ["view", "upload", "delete"], content: ["view", "create", "edit", "delete"],
  appearance: ["view", "edit"], users: ["view", "create", "edit", "delete"],
  reports: ["view", "export"], settings: ["view", "edit", "export"]
};
function adminHasPermission(permission, permissions = signedInUser?.permissions || []) {
  if (signedInUser?.role === "admin") return true;
  const [area, action] = permission.split(".");
  return permissions.includes(permission) || action === "view" && permissions.includes(area);
}

async function activateAdminTab(button) {
  const tab = button.dataset.adminTab;
  const tabPermissions = { overview: "reports.view", appointments: "appointments.view", calendar: "appointments.view", patients: "patients.view", doctors: "doctors.view", services: "services.view", pages: "content.view", posts: "content.view", gallery: "media.view", testimonials: "content.view", faqs: "content.view", messages: "content.view", users: "users.view", reports: "reports.view", branding: "appearance.view", customization: "appearance.view", settings: "settings.view", system: "settings.view", members: "users.view" };
  if (signedInUser?.role === "staff" && !adminHasPermission(tabPermissions[tab])) {
    showToast("لا تملك صلاحية الوصول إلى هذا القسم.");
    return;
  }
  document.querySelectorAll("[data-admin-tab]").forEach((item) => item.classList.toggle("active", item === button));
  document.querySelectorAll(".admin-panel").forEach((panel) => panel.classList.toggle("active", panel.id === `panel-${tab}`));
  byId("admin-page-title").textContent = ADMIN_TITLES[tab] || "لوحة التحكم";
  byId("admin-breadcrumb").innerHTML = `<span>الرئيسية</span><b>›</b><strong id="admin-page-title">${escapeHTML(ADMIN_TITLES[tab] || tab)}</strong>`;
  if (button.dataset.statusFilter) byId("appointment-filter").value = button.dataset.statusFilter;
  if (tab === "appointments") {
    fillAppointmentFilters();
    renderAppointments();
    if (button.dataset.focusAdd) openAdminAppointmentForm();
  }
  if (tab === "overview") await loadDashboardData().catch((error) => showToast(error.message));
  if (tab === "calendar") renderCalendar();
  if (["patients", "doctors", "pages", "posts", "testimonials", "faqs", "messages", "categories", "tags"].includes(tab)) await loadCollection(tab).catch((error) => showToast(error.message));
  if (tab === "users") await loadStaffUsers().catch((error) => showToast(error.message));
  if (tab === "reports") await loadReports().catch((error) => showToast(error.message));
  if (tab === "system") await loadSystemPanel().catch((error) => showToast(error.message));
  if (tab === "customization") fillCustomizationForm();
  if (window.matchMedia("(max-width: 700px)").matches) byId("admin-sidebar").classList.remove("mobile-open");
}

document.querySelectorAll("[data-admin-tab]").forEach((button) => button.addEventListener("click", () => activateAdminTab(button)));

function applyAdminPermissions(permissions) {
  const tabPermissions = { overview: "reports.view", appointments: "appointments.view", calendar: "appointments.view", patients: "patients.view", doctors: "doctors.view", services: "services.view", pages: "content.view", posts: "content.view", gallery: "media.view", testimonials: "content.view", faqs: "content.view", messages: "content.view", users: "users.view", reports: "reports.view", branding: "appearance.view", customization: "appearance.view", settings: "settings.view", system: "settings.view", members: "users.view" };
  document.querySelectorAll("[data-admin-tab]").forEach((button) => { button.hidden = !adminHasPermission(tabPermissions[button.dataset.adminTab], permissions); });
  document.querySelectorAll(".admin-nav-group").forEach((group) => {
    const visible = [...group.querySelectorAll("[data-admin-tab]")].some((button) => !button.hidden);
    group.hidden = !visible;
  });
  document.querySelectorAll("[data-quick-add]").forEach((button) => {
    const permission = { appointment: "appointments.create", patient: "patients.create", doctor: "doctors.create", service: "services.create", page: "content.create", post: "content.create" }[button.dataset.quickAdd];
    button.hidden = !adminHasPermission(permission, permissions);
  });
  byId("add-staff-user").hidden = !adminHasPermission("users.view", permissions) || !adminHasPermission("users.create", permissions);
  byId("role-form").hidden = !adminHasPermission("users.view", permissions) || !adminHasPermission("users.edit", permissions);
  byId("admin-booking-link").hidden = !adminHasPermission("appointments.create", permissions);
  document.querySelectorAll("[data-focus-add]").forEach((button) => {
    button.hidden = !adminHasPermission("appointments.create", permissions);
  });
  byId("export-report").hidden = !adminHasPermission("reports.export", permissions);
  byId("notifications-toggle").closest(".top-action-wrap").hidden = !adminHasPermission("settings.view", permissions);
  byId("role-permissions").querySelectorAll("option").forEach((option) => {
    option.disabled = !adminHasPermission(option.value, permissions);
  });
}
byId("sidebar-collapse").addEventListener("click", () => byId("admin-view").classList.toggle("sidebar-collapsed"));
byId("admin-sidebar-toggle").addEventListener("click", () => {
  if (window.matchMedia("(max-width: 700px)").matches) byId("admin-sidebar").classList.toggle("mobile-open");
  else byId("admin-view").classList.toggle("sidebar-collapsed");
});
byId("theme-toggle").addEventListener("click", () => {
  const enabled = byId("admin-view").classList.toggle("dark-mode");
  localStorage.setItem("sinan.adminTheme", enabled ? "dark" : "light");
  byId("theme-toggle").title = enabled ? "الوضع الفاتح" : "الوضع الداكن";
});

function togglePopover(buttonId, popoverId) {
  const popover = byId(popoverId);
  const open = popover.hidden;
  document.querySelectorAll(".top-popover").forEach((item) => { item.hidden = true; });
  popover.hidden = !open;
  byId(buttonId).setAttribute("aria-expanded", String(open));
}
byId("quick-add-toggle").addEventListener("click", () => togglePopover("quick-add-toggle", "quick-add-menu"));
byId("notifications-toggle").addEventListener("click", async () => {
  togglePopover("notifications-toggle", "notifications-menu");
  if (!byId("notifications-menu").hidden) await loadNotifications().catch((error) => showToast(error.message));
});
document.addEventListener("click", (event) => {
  if (event.target.closest(".top-action-wrap")) return;
  document.querySelectorAll(".top-popover").forEach((item) => { item.hidden = true; });
});
document.querySelectorAll("[data-quick-add]").forEach((button) => button.addEventListener("click", () => {
  const kind = button.dataset.quickAdd;
  byId("quick-add-menu").hidden = true;
  if (kind === "appointment") return openAdminAppointmentForm();
  const tabs = { patient: "patients", doctor: "doctors", service: "services", page: "pages", post: "posts" };
  const tabButton = document.querySelector(`[data-admin-tab="${tabs[kind]}"]`);
  if (tabButton) activateAdminTab(tabButton).then(() => {
    if (kind === "service") byId("service-name-input").focus();
    else showCollectionForm(tabs[kind]);
  });
}));

byId("admin-search").addEventListener("input", () => renderAdminSearch(byId("admin-search").value));
byId("admin-search").addEventListener("keydown", (event) => {
  if (event.key === "Enter") byId("admin-search-results").querySelector("button")?.click();
});
byId("chart-range").addEventListener("change", renderDashboardChart);

function renderAdminServices() {
  const list = byId("admin-service-list");
  if (!services.length) {
    list.innerHTML = '<div class="empty-state"><strong>لا توجد خدمات مضافة</strong></div>';
    return;
  }
  list.innerHTML = services.map((service, index) => `<article class="admin-service-item"><span class="service-icon" aria-hidden="true">${escapeHTML(service.icon || SERVICE_ICONS[index % SERVICE_ICONS.length])}</span><div><strong>${escapeHTML(service.name)}</strong><p>${escapeHTML(service.description || "لا يوجد وصف")}</p></div><span class="admin-service-meta">${Number(service.duration)} دقيقة · ${escapeHTML(service.price || "يحدد بعد الفحص")}</span><div class="admin-service-actions"><button type="button" data-edit-service="${escapeHTML(service.id)}">تعديل</button><button type="button" class="delete-service" data-remove-service="${escapeHTML(service.id)}">حذف</button></div></article>`).join("");
  list.querySelectorAll("[data-edit-service]").forEach((button) => button.addEventListener("click", () => startServiceEdit(button.dataset.editService)));
  list.querySelectorAll("[data-remove-service]").forEach((button) => button.addEventListener("click", async () => {
    const service = services.find((item) => item.id === button.dataset.removeService);
    if (!service || !await confirmAction(`هل أنت متأكد من حذف خدمة ${service.name}؟`)) return;
    if (serverMode) {
      try {
        const result = await requestApi(`/api/admin/services/${encodeURIComponent(service.id)}`, { method: "DELETE" });
        services = result.services;
      } catch (error) { showToast(error.message); return; }
    } else {
      services = services.filter((item) => item.id !== service.id);
      writeStore(STORAGE_KEYS.services, services);
    }
    renderServices();
    renderAdminServices();
    renderTimeSlots();
    showToast("تم حذف الخدمة.");
  }));
}

function collectionEndpoint(name) {
  return `/api/admin/collections/${encodeURIComponent(name)}`;
}

async function loadCollection(name) {
  const result = await requestApi(collectionEndpoint(name));
  collectionData[name] = result.items;
  if (name === "doctors") doctors = result.items;
  if (name === "patients") patients = result.items;
  if (name === "pages" || name === "posts" || name === "testimonials" || name === "faqs" || name === "messages" || name === "categories" || name === "tags") renderCollection(name, result.items);
  if (name === "doctors") renderDoctors();
  if (name === "patients") renderPatients();
  fillAppointmentFilters();
  renderAppointments();
  renderStats();
}

function renderDoctors() {
  const list = byId("collection-doctors");
  if (!list) return;
  list.innerHTML = doctors.length ? doctors.map((doctor) => `<article class="collection-row"><div><strong>${escapeHTML(doctor.name)}</strong><small>${escapeHTML(doctor.specialty || "طبيب")}${doctor.experience ? ` · ${Number(doctor.experience)} سنوات خبرة` : ""} · ${escapeHTML(doctor.phone || doctor.email || "")}</small></div><div class="collection-actions"><button type="button" data-edit-collection="doctors:${escapeHTML(doctor.id)}">تعديل</button><button type="button" data-delete-collection="doctors:${escapeHTML(doctor.id)}">حذف</button></div></article>`).join("") : '<div class="empty-state"><strong>لا يوجد أطباء</strong><p>أضف ملفات فريق العيادة لتعيينهم للمواعيد.</p></div>';
}

function renderPatients() {
  const body = byId("patient-rows");
  if (!body) return;
  const query = document.querySelector('[data-collection-search="patients"]').value.trim().toLowerCase();
  const filtered = patients.filter((patient) => `${patient.name} ${patient.phone} ${patient.email}`.toLowerCase().includes(query));
  byId("patient-empty").hidden = filtered.length > 0;
  body.innerHTML = filtered.map((patient) => `<tr><td><button class="table-link" type="button" data-edit-collection="patients:${escapeHTML(patient.id)}">${escapeHTML(patient.name)}</button></td><td dir="ltr">${escapeHTML(patient.phone)}</td><td>${escapeHTML(patient.email || "—")}</td><td>${Number(patient.visits || 0)}</td><td>${patient.lastAppointment ? escapeHTML(formatDate(patient.lastAppointment)) : "—"}</td><td>${escapeHTML(patient.status || "نشط")}</td><td><div class="collection-actions"><button type="button" data-edit-collection="patients:${escapeHTML(patient.id)}">عرض/تعديل</button><button type="button" data-delete-collection="patients:${escapeHTML(patient.id)}">حذف</button></div></td></tr>`).join("");
}

function renderCollection(name, items) {
  const list = byId(`collection-${name}`);
  if (!list) return;
  const schema = COLLECTIONS[name];
  list.innerHTML = items.length ? items.map((item) => {
    const title = item.title || item.name || item.question || "عنصر بدون عنوان";
    const detail = item.specialty || item.email || item.category || item.slug || item.status || "";
    return `<article class="collection-row"><div><strong>${escapeHTML(title)}</strong><small>${escapeHTML(detail)}${item.updatedAt ? ` · آخر تعديل ${escapeHTML(new Date(item.updatedAt).toLocaleDateString("ar-JO"))}` : ""}</small></div><div class="collection-actions"><button type="button" data-edit-collection="${name}:${escapeHTML(item.id)}">تعديل</button><button type="button" data-delete-collection="${name}:${escapeHTML(item.id)}">حذف</button></div></article>`;
  }).join("") : `<div class="empty-state"><strong>لا توجد ${escapeHTML(schema.title.toLowerCase())}</strong><p>استخدم زر الإضافة لإنشاء أول عنصر.</p></div>`;
}

let builderSections = [];
let builderCollection = "pages";

function renderPageBuilder() {
  const container = byId("builder-sections");
  if (!container) return;
  const sectionTypes = { hero: "Hero", text: "Text", image: "Image", video: "Video", services: "Services", doctors: "Doctors", pricing: "Pricing", gallery: "Gallery", testimonials: "Testimonials", faq: "FAQ", contact: "Contact", cta: "CTA" };
  container.innerHTML = builderSections.map((section, index) => `<article class="builder-section${section.hidden ? " is-hidden" : ""}" draggable="true" data-builder-index="${index}"><div class="builder-section-top"><select data-builder-type="${index}" aria-label="نوع القسم">${Object.entries(sectionTypes).map(([value, label]) => `<option value="${value}" ${section.type === value ? "selected" : ""}>${label}</option>`).join("")}</select><div class="collection-actions"><button type="button" data-builder-move="${index}" data-direction="-1" title="تحريك لأعلى">↑</button><button type="button" data-builder-move="${index}" data-direction="1" title="تحريك لأسفل">↓</button><button type="button" data-builder-hide="${index}">${section.hidden ? "إظهار" : "إخفاء"}</button><button type="button" data-builder-remove="${index}">حذف</button></div></div><textarea data-builder-content="${index}" placeholder="محتوى القسم أو رابط الصورة/الفيديو">${escapeHTML(section.content || "")}</textarea></article>`).join("");
  container.querySelectorAll("[data-builder-type]").forEach((input) => input.addEventListener("change", () => { builderSections[Number(input.dataset.builderType)].type = input.value; renderBuilderPreview(); }));
  container.querySelectorAll("[data-builder-content]").forEach((input) => input.addEventListener("input", () => { builderSections[Number(input.dataset.builderContent)].content = input.value; renderBuilderPreview(); }));
  container.querySelectorAll("[data-builder-hide]").forEach((button) => button.addEventListener("click", () => { const section = builderSections[Number(button.dataset.builderHide)]; section.hidden = !section.hidden; renderPageBuilder(); renderBuilderPreview(); }));
  container.querySelectorAll("[data-builder-remove]").forEach((button) => button.addEventListener("click", () => { builderSections.splice(Number(button.dataset.builderRemove), 1); renderPageBuilder(); renderBuilderPreview(); }));
  container.querySelectorAll("[data-builder-move]").forEach((button) => button.addEventListener("click", () => {
    const index = Number(button.dataset.builderMove);
    const next = index + Number(button.dataset.direction);
    if (next < 0 || next >= builderSections.length) return;
    [builderSections[index], builderSections[next]] = [builderSections[next], builderSections[index]];
    renderPageBuilder();
    renderBuilderPreview();
  }));
  container.querySelectorAll("[data-builder-index]").forEach((card) => {
    card.addEventListener("dragstart", () => { card.classList.add("is-dragging"); });
    card.addEventListener("dragend", () => card.classList.remove("is-dragging"));
    card.addEventListener("dragover", (event) => event.preventDefault());
    card.addEventListener("drop", (event) => {
      event.preventDefault();
      const dragged = container.querySelector(".is-dragging");
      if (!dragged || dragged === card) return;
      const from = Number(dragged.dataset.builderIndex);
      const to = Number(card.dataset.builderIndex);
      const [section] = builderSections.splice(from, 1);
      builderSections.splice(to, 0, section);
      renderPageBuilder();
      renderBuilderPreview();
    });
  });
}

function renderBuilderPreview() {
  const preview = byId("builder-preview");
  if (!preview) return;
  preview.innerHTML = builderSections.filter((item) => !item.hidden).map((item) => `<section class="builder-preview-section"><small>${escapeHTML(item.type.toUpperCase())}</small><p>${escapeHTML(item.content || "معاينة القسم")}</p></section>`).join("") || "<p>أضف قسمًا لمعاينة الصفحة.</p>";
}

function showCollectionForm(name, id = "") {
  const form = document.querySelector(`[data-collection-form="${name}"]`);
  const schema = COLLECTIONS[name];
  const record = id ? (collectionData[name] || []).find((item) => item.id === id) : null;
  if (!form || !schema) return;
  form.dataset.editId = id;
  if (name === "pages" || name === "posts") {
    builderCollection = name;
    builderSections = Array.isArray(record?.sections) ? structuredClone(record.sections) : [];
  }
  const fields = schema.fields.map(([key, label, type, required, options]) => {
    const value = record?.[key] ?? (key === "status" ? (name === "doctors" || name === "patients" ? "active" : "draft") : "");
    let input;
    if (type === "textarea") input = `<textarea class="field-control" name="${key}" ${required ? "required" : ""}>${escapeHTML(value)}</textarea>`;
    else if (type === "select") input = `<select class="field-control" name="${key}" ${required ? "required" : ""}>${Object.entries(options || {}).map(([option, optionLabel]) => `<option value="${option}" ${value === option ? "selected" : ""}>${optionLabel}</option>`).join("")}</select>`;
    else input = `<input class="field-control" name="${key}" type="${type}" value="${escapeHTML(value)}" ${required ? "required" : ""}>`;
    return `<label>${label}${input}</label>`;
  }).join("");
  const builder = name === "pages" || name === "posts" ? `<div class="span-all builder-layout"><div><div class="admin-form-heading"><h2>أقسام الصفحة</h2><button class="button button-outline button-small" id="add-builder-section" type="button">＋ إضافة Section</button></div><div id="builder-sections"></div></div><aside><h2>Preview</h2><div id="builder-preview" class="builder-preview"></div></aside></div>` : "";
  form.hidden = false;
  form.innerHTML = `<h2 class="span-all">${id ? "تعديل" : "إضافة"} ${schema.title}</h2>${fields}${builder}<div class="span-all"><button class="button button-primary" type="submit">${id ? "حفظ التعديلات" : "حفظ"}</button><button class="button button-quiet" type="button" data-cancel-collection>إلغاء</button><p class="admin-feedback" data-form-feedback></p></div>`;
  if (builder) {
    renderPageBuilder();
    renderBuilderPreview();
    byId("add-builder-section").addEventListener("click", () => { builderSections.push({ type: "text", content: "", hidden: false }); renderPageBuilder(); renderBuilderPreview(); });
  }
  form.querySelector("[data-cancel-collection]").addEventListener("click", () => { form.hidden = true; });
  form.onsubmit = async (event) => {
    event.preventDefault();
    const item = Object.fromEntries(new FormData(form));
    if (builder) item.sections = builderSections;
    item.author ||= signedInUser?.name || "إدارة العيادة";
    try {
      const url = id ? `${collectionEndpoint(name)}/${encodeURIComponent(id)}` : collectionEndpoint(name);
      await requestApi(url, { method: id ? "PATCH" : "POST", body: item });
      form.hidden = true;
      await loadCollection(name);
      showToast("تم حفظ التغييرات.");
    } catch (error) { form.querySelector("[data-form-feedback]").textContent = error.message; }
  };
  renderBuilderPreview();
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function deleteCollectionItem(name, id) {
  if (!await confirmAction("هل أنت متأكد من حذف هذا العنصر؟")) return;
  try {
    await requestApi(`${collectionEndpoint(name)}/${encodeURIComponent(id)}`, { method: "DELETE" });
    await loadCollection(name);
    showToast("تم حذف العنصر.");
  } catch (error) { showToast(error.message); }
}

document.querySelectorAll("[data-new-collection]").forEach((button) => button.addEventListener("click", () => showCollectionForm(button.dataset.newCollection)));
document.addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit-collection]");
  if (edit) {
    const [name, id] = edit.dataset.editCollection.split(":");
    showCollectionForm(name, id);
  }
  const remove = event.target.closest("[data-delete-collection]");
  if (remove) {
    const [name, id] = remove.dataset.deleteCollection.split(":");
    deleteCollectionItem(name, id);
  }
});
document.querySelector('[data-collection-search="patients"]').addEventListener("input", renderPatients);

async function compressImageUpload(file) {
  if (!file || !file.type.startsWith("image/") || file.type === "image/gif") return file;
  const maxWidth = 1600;
  const maxHeight = 1600;
  const quality = 0.72;
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("تعذرت قراءة الصورة."));
      img.src = objectUrl;
    });
    const width = Math.min(image.naturalWidth || image.width, maxWidth);
    const height = Math.min(image.naturalHeight || image.height, maxHeight);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    const mimeType = file.type === "image/png" ? "image/webp" : file.type === "image/jpeg" ? "image/jpeg" : "image/webp";
    const compressed = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
    return compressed && compressed.size < file.size ? compressed : file;
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function prepareUploadFile(file) {
  if (file && file.type.startsWith("image/")) return compressImageUpload(file);
  return file;
}

function readUploadFile(file) {
  return new Promise(async (resolve, reject) => {
    try {
      const readyFile = await prepareUploadFile(file);
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        const result = String(reader.result || "");
        resolve({ fileName: readyFile.name, mimeType: readyFile.type || (readyFile.name.toLowerCase().endsWith(".ico") ? "image/x-icon" : ""), content: result.split(",")[1] || "" });
      });
      reader.addEventListener("error", () => reject(new Error("تعذرت قراءة الملف.")));
      reader.readAsDataURL(readyFile);
    } catch (error) {
      reject(error);
    }
  });
}

function renderAdminGallery() {
  const list = byId("admin-gallery-list");
  if (!list) return;
  if (!gallery.length) {
    list.innerHTML = '<div class="empty-state"><strong>المعرض فارغ</strong><p>ارفع أول صورة أو فيديو ليظهر هنا وعلى الموقع.</p></div>';
    return;
  }
  const query = byId("media-search")?.value.trim().toLowerCase() || "";
  const media = gallery.filter((item) => `${item.title} ${item.filename}`.toLowerCase().includes(query));
  if (!media.length) {
    list.innerHTML = '<div class="empty-state"><strong>لا توجد وسائط مطابقة</strong></div>';
    return;
  }
  list.innerHTML = media.map((item) => `<article class="admin-media-item">
    ${item.kind === "video" ? `<video class="admin-media-thumb" src="${escapeHTML(item.url)}" preload="metadata" controls controlsList="nodownload noremoteplayback" playsinline></video>` : item.kind === "document" ? '<span class="admin-media-thumb document-thumb">PDF</span>' : `<img class="admin-media-thumb" src="${escapeHTML(item.url)}" alt="" loading="lazy">`}
    <div class="admin-media-meta"><strong>${escapeHTML(item.title || item.fileName || (item.kind === "video" ? "فيديو" : "صورة"))}</strong><small>${item.kind === "video" ? "فيديو" : "صورة"} · ${new Intl.DateTimeFormat("ar-JO", { dateStyle: "medium" }).format(new Date(item.createdAt))}</small></div>
    <div class="admin-media-actions"><a href="${escapeHTML(item.url)}" target="_blank" rel="noreferrer">معاينة</a><button type="button" data-copy-media="${escapeHTML(item.url)}">نسخ الرابط</button><button type="button" class="remove-media" data-delete-media="${escapeHTML(item.id)}">حذف</button></div>
  </article>`).join("");
  list.querySelectorAll("[data-delete-media]").forEach((button) => button.addEventListener("click", async () => {
    if (!await confirmAction("هل أنت متأكد من حذف هذا العنصر من المعرض والموقع؟")) return;
    try {
      const result = await requestApi(`/api/admin/media/${encodeURIComponent(button.dataset.deleteMedia)}`, { method: "DELETE" });
      gallery = result.gallery;
      renderAdminGallery();
      renderGallery();
      showToast("تم حذف العنصر من المعرض.");
    } catch (error) { showToast(error.message); }
  }));
  list.querySelectorAll("[data-copy-media]").forEach((button) => button.addEventListener("click", async () => {
    await navigator.clipboard.writeText(new URL(button.dataset.copyMedia, location.href).href);
    showToast("تم نسخ رابط الملف.");
  }));
}

byId("gallery-upload-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = byId("gallery-file").files[0];
  const feedback = byId("gallery-feedback");
  if (!file) return;
  const kind = file.type === "application/pdf" ? "document" : file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : "";
  const limit = kind === "image" ? 12 * 1024 * 1024 : kind === "video" ? 80 * 1024 * 1024 : 20 * 1024 * 1024;
  if (!kind || file.size > limit) {
    feedback.textContent = "تحقق من صيغة الملف وحجمه قبل الرفع.";
    return;
  }
  feedback.textContent = "جارٍ رفع الملف...";
  try {
    const payload = await readUploadFile(file);
    const result = await requestApi("/api/admin/media", { method: "POST", body: { ...payload, kind, title: byId("gallery-title").value.trim() } });
    gallery = result.gallery;
    byId("gallery-upload-form").reset();
    feedback.textContent = "تم نشر الملف في المعرض.";
    renderAdminGallery();
    renderGallery();
    showToast("ظهر المحتوى الجديد في المعرض.");
  } catch (error) { feedback.textContent = error.message; }
});
byId("media-search").addEventListener("input", renderAdminGallery);
byId("media-grid-view").addEventListener("click", () => byId("admin-gallery-list").classList.remove("media-list-view"));
byId("media-list-view").addEventListener("click", () => byId("admin-gallery-list").classList.add("media-list-view"));

function renderAdminMembers() {
  const list = byId("admin-member-list");
  if (!list) return;
  byId("member-total").textContent = `${members.length.toLocaleString("ar-JO")} عضو`;
  if (!members.length) {
    list.innerHTML = '<div class="empty-state"><strong>لا توجد حسابات أعضاء بعد</strong><p>ستظهر الحسابات المنشأة من الموقع هنا.</p></div>';
    return;
  }
  list.innerHTML = members.map((member) => `<article class="admin-member-item">
    <span class="patient-avatar" aria-hidden="true">${escapeHTML(member.name?.trim().charAt(0) || "ع")}</span>
    <div class="member-meta"><strong>${escapeHTML(member.name)}${member.verified ? ' <span class="verified-mark" title="عضو موثّق">✓</span>' : ""}</strong><small>${escapeHTML(member.email)} · العمر ${Number(member.age) || "غير محدد"}</small><span class="member-state${member.banned ? " is-banned" : ""}">${member.banned ? "محظور" : "نشط"}</span></div>
    <div class="member-actions"><button type="button" data-member-flag="verified" data-member-id="${escapeHTML(member.id)}">${member.verified ? "إلغاء التوثيق" : "توثيق"}</button><button type="button" data-member-flag="banned" data-member-id="${escapeHTML(member.id)}">${member.banned ? "إلغاء الحظر" : "حظر"}</button><button type="button" class="member-delete" data-delete-member="${escapeHTML(member.id)}">حذف</button></div>
  </article>`).join("");
  list.querySelectorAll("[data-member-flag]").forEach((button) => button.addEventListener("click", async () => {
    const member = members.find((item) => item.id === button.dataset.memberId);
    if (!member) return;
    const flag = button.dataset.memberFlag;
    try {
      await requestApi(`/api/admin/members/${encodeURIComponent(member.id)}`, { method: "PATCH", body: { [flag]: !member[flag] } });
      await refreshAdminMembers();
      showToast(flag === "verified" ? "تم تحديث توثيق العضو." : "تم تحديث حالة حظر العضو.");
    } catch (error) { showToast(error.message); }
  }));
  list.querySelectorAll("[data-delete-member]").forEach((button) => button.addEventListener("click", async () => {
    const member = members.find((item) => item.id === button.dataset.deleteMember);
    if (!member || !await confirmAction(`هل أنت متأكد من حذف حساب ${member.name}؟`)) return;
    try {
      await requestApi(`/api/admin/members/${encodeURIComponent(member.id)}`, { method: "DELETE" });
      await refreshAdminMembers();
      showToast("تم حذف حساب العضو.");
    } catch (error) { showToast(error.message); }
  }));
}

function renderBrandingControls() {
  const logoPreview = byId("logo-preview");
  const badgePreview = byId("badge-preview");
  if (!logoPreview || !badgePreview) return;
  logoPreview.innerHTML = settings.logoUrl ? `<img src="${escapeHTML(settings.logoUrl)}" alt="معاينة الشعار">` : "س";
  badgePreview.innerHTML = settings.badgeUrl ? `<img src="${escapeHTML(settings.badgeUrl)}" alt="معاينة التوثيق">` : "✓";
  byId("verified-toggle").checked = Boolean(settings.verified);
}

async function uploadBrandAsset(asset) {
  const input = byId(asset === "logo" ? "logo-file" : "badge-file");
  const file = input.files[0];
  const feedback = byId("branding-feedback");
  if (!file) {
    feedback.textContent = "اختر ملفًا من جهازك أولًا.";
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    feedback.textContent = "الحد الأقصى لحجم الشعار أو الشارة 2 ميجابايت.";
    return;
  }
  feedback.textContent = "جارٍ رفع الملف...";
  try {
    const payload = await readUploadFile(file);
    const result = await requestApi(`/api/admin/branding/${asset}`, { method: "POST", body: payload });
    settings = result.settings;
    updateClinicBranding();
    renderBrandingControls();
    input.value = "";
    feedback.textContent = "تم تحديث الهوية في الموقع.";
    showToast("تم تحديث هوية الموقع.");
  } catch (error) { feedback.textContent = error.message; }
}

byId("upload-logo").addEventListener("click", () => uploadBrandAsset("logo"));
byId("upload-badge").addEventListener("click", () => uploadBrandAsset("badge"));

async function removeBrandAsset(asset) {
  const feedback = byId("branding-feedback");
  try {
    const result = await requestApi(`/api/admin/branding/${asset}`, { method: "DELETE" });
    settings = result.settings;
    updateClinicBranding();
    renderBrandingControls();
    feedback.textContent = "تمت إزالة الملف من الموقع.";
  } catch (error) { feedback.textContent = error.message; }
}

byId("remove-logo").addEventListener("click", () => removeBrandAsset("logo"));
byId("remove-badge").addEventListener("click", () => removeBrandAsset("badge"));
byId("verified-toggle").addEventListener("change", async (event) => {
  try {
    const result = await requestApi("/api/admin/branding/verification", { method: "POST", body: { enabled: event.currentTarget.checked } });
    settings = result.settings;
    updateClinicBranding();
    renderBrandingControls();
    byId("branding-feedback").textContent = "تم تحديث ظهور علامة التوثيق.";
  } catch (error) {
    event.currentTarget.checked = !event.currentTarget.checked;
    byId("branding-feedback").textContent = error.message;
  }
});

function startServiceEdit(id) {
  const service = services.find((item) => item.id === id);
  if (!service) return;
  byId("service-edit-id").value = service.id;
  byId("service-name-input").value = service.name;
  byId("service-duration-input").value = service.duration;
  byId("service-price-input").value = service.price;
  byId("service-description-input").value = service.description;
  byId("service-image-input").value = service.imageUrl || "";
  byId("service-category-input").value = service.category || "";
  byId("service-doctor-input").value = service.doctorId || "";
  byId("service-status-input").value = service.status || "active";
  byId("service-form-title").textContent = "تعديل الخدمة";
  byId("cancel-service-edit").hidden = false;
  byId("service-name-input").focus();
}

function resetServiceForm() {
  byId("service-form").reset();
  byId("service-edit-id").value = "";
  byId("service-duration-input").value = "30";
  byId("service-image-input").value = "";
  byId("service-category-input").value = "";
  byId("service-doctor-input").value = "";
  byId("service-status-input").value = "active";
  byId("service-form-title").textContent = "إضافة خدمة";
  byId("cancel-service-edit").hidden = true;
}

byId("service-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = byId("service-edit-id").value;
  const oldService = services.find((service) => service.id === id);
  const service = {
    id: id || `service-${Date.now()}`,
    name: byId("service-name-input").value.trim(),
    duration: Number(byId("service-duration-input").value),
    price: byId("service-price-input").value.trim() || "يحدد بعد الفحص",
    description: byId("service-description-input").value.trim() || "رعاية مخصصة لاحتياجك.",
    imageUrl: byId("service-image-input").value.trim(),
    category: byId("service-category-input").value.trim(),
    doctorId: byId("service-doctor-input").value,
    status: byId("service-status-input").value,
    icon: oldService?.icon || SERVICE_ICONS[services.length % SERVICE_ICONS.length]
  };
  if (serverMode) {
    try {
      const result = await requestApi("/api/admin/services", { method: "POST", body: service });
      services = result.services;
    } catch (error) { showToast(error.message); return; }
  } else {
    services = id ? services.map((item) => item.id === id ? service : item) : [...services, service];
    writeStore(STORAGE_KEYS.services, services);
  }
  resetServiceForm();
  renderServices();
  renderAdminServices();
  renderTimeSlots();
  showToast("تم حفظ الخدمة.");
});

byId("cancel-service-edit").addEventListener("click", resetServiceForm);

function renderWeekdayOptions() {
  byId("weekday-options").innerHTML = WEEKDAYS.map((day, index) => `<label class="weekday-option"><input type="checkbox" name="workingDays" value="${index}" ${settings.workingDays.includes(index) ? "checked" : ""}><span>${day}</span></label>`).join("");
}

function fillSettingsForm() {
  byId("setting-clinic-name").value = settings.clinicName;
  byId("setting-doctor-name").value = settings.doctorName;
  byId("setting-whatsapp").value = settings.whatsapp;
  byId("setting-slot-duration").value = settings.slotDuration;
  byId("setting-open-time").value = settings.openTime;
  byId("setting-close-time").value = settings.closeTime;
  renderWeekdayOptions();
}

function fillCustomizationForm() {
  byId("custom-site-description").value = settings.siteDescription || "";
  byId("custom-clinic-email").value = settings.clinicEmail || "";
  byId("custom-phone").value = settings.phone || "";
  byId("custom-address").value = settings.address || "";
  byId("custom-seo-title").value = settings.seoTitle || "";
  byId("custom-seo-description").value = settings.seoDescription || "";
  byId("custom-footer-description").value = settings.footerDescription || "";
  byId("custom-hero-lead").value = settings.heroLead || "";
  byId("custom-hero-accent").value = settings.heroAccent || "";
  byId("custom-hero-description").value = settings.heroDescription || "";
  byId("custom-primary-color").value = settings.colors?.primary || "#286b57";
  byId("custom-secondary-color").value = settings.colors?.secondary || "#d3e9a5";
  byId("custom-background-color").value = settings.colors?.background || "#f7f8f5";
  byId("custom-text-color").value = settings.colors?.text || "#172722";
  byId("custom-font-family").value = settings.fontFamily || "IBM Plex Sans Arabic";
  byId("custom-font-size").value = settings.fontSize || 14;
  byId("custom-heading-size").value = settings.headingSize || 38;
  byId("custom-button-size").value = settings.buttonSize || 12;
  byId("social-instagram").value = settings.socialLinks?.instagram || "";
  byId("social-facebook").value = settings.socialLinks?.facebook || "";
  byId("social-linkedin").value = settings.socialLinks?.linkedin || "";
  let copyFields = byId("site-copy-fields");
  if (!copyFields) {
    copyFields = document.createElement("div");
    copyFields.id = "site-copy-fields";
    copyFields.className = "settings-grid";
    const form = byId("customization-form");
    const sectionHeading = [...form.querySelectorAll("h2")].find((heading) => heading.textContent === "نص الصفحة الرئيسية");
    sectionHeading.before(copyFields);
  }
  const copyLabels = { servicesTitle: "عنوان قسم الخدمات", servicesDescription: "وصف قسم الخدمات", bookingTitle: "عنوان الحجز", bookingDescription: "وصف الحجز", aboutTitle: "عنوان عن العيادة", aboutDescription: "وصف عن العيادة", closingTitle: "رسالة ختام الصفحة" };
  copyFields.innerHTML = Object.entries(copyLabels).map(([key, label]) => `<label>${label}<textarea class="field-control" data-copy-field="${key}">${escapeHTML(settings.copy?.[key] || "")}</textarea></label>`).join("");
  let sectionsFieldset = byId("site-sections-control");
  if (!sectionsFieldset) {
    sectionsFieldset = document.createElement("fieldset");
    sectionsFieldset.id = "site-sections-control";
    sectionsFieldset.className = "site-sections-control";
    byId("customization-form").insertBefore(sectionsFieldset, byId("customization-form").querySelector("button[type=submit]"));
  }
  const sectionNames = { header: "الشريط العلوي", footer: "التذييل", services: "الخدمات", doctors: "الأطباء", gallery: "المعرض", testimonials: "آراء المرضى", articles: "المقالات", faq: "الأسئلة الشائعة", about: "عن العيادة" };
  sectionsFieldset.innerHTML = `<legend>إظهار أقسام الموقع</legend>${Object.entries(sectionNames).map(([key, label]) => `<label class="weekday-option"><input type="checkbox" name="siteSections" value="${key}" ${(settings.sections?.[key] !== false) ? "checked" : ""}><span>${label}</span></label>`).join("")}`;
}

byId("customization-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const feedback = byId("customization-feedback");
  const input = {
    siteDescription: byId("custom-site-description").value.trim(),
    clinicEmail: byId("custom-clinic-email").value.trim(),
    phone: byId("custom-phone").value.trim(),
    address: byId("custom-address").value.trim(),
    seoTitle: byId("custom-seo-title").value.trim(),
    seoDescription: byId("custom-seo-description").value.trim(),
    footerDescription: byId("custom-footer-description").value.trim(),
    heroLead: byId("custom-hero-lead").value.trim(),
    heroAccent: byId("custom-hero-accent").value.trim(),
    heroDescription: byId("custom-hero-description").value.trim(),
    copy: Object.fromEntries([...byId("site-copy-fields").querySelectorAll("[data-copy-field]")].map((field) => [field.dataset.copyField, field.value.trim()])),
    fontFamily: byId("custom-font-family").value,
    fontSize: Number(byId("custom-font-size").value),
    headingSize: Number(byId("custom-heading-size").value),
    buttonSize: Number(byId("custom-button-size").value),
    colors: {
      primary: byId("custom-primary-color").value,
      secondary: byId("custom-secondary-color").value,
      background: byId("custom-background-color").value,
      text: byId("custom-text-color").value
    },
    socialLinks: { instagram: byId("social-instagram").value.trim(), facebook: byId("social-facebook").value.trim(), linkedin: byId("social-linkedin").value.trim() }
  };
  input.sections = Object.fromEntries([...byId("site-sections-control").querySelectorAll('input[name="siteSections"]')].map((checkbox) => [checkbox.value, checkbox.checked]));
  try {
    const result = await requestApi("/api/admin/customization", { method: "POST", body: input });
    settings = { ...DEFAULT_SETTINGS, ...result.settings };
    writeStore(STORAGE_KEYS.settings, settings);
    updateClinicBranding();
    feedback.textContent = "تم حفظ إعدادات الهوية وتطبيقها على الموقع.";
    showToast("تم تحديث مظهر الموقع.");
  } catch (error) { feedback.textContent = error.message; }
});

byId("settings-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const openTime = byId("setting-open-time").value;
  const closeTime = byId("setting-close-time").value;
  const whatsapp = byId("setting-whatsapp").value.trim();
  const workingDays = [...document.querySelectorAll('input[name="workingDays"]:checked')].map((input) => Number(input.value));
  const feedback = byId("settings-feedback");
  if (minutesFromTime(openTime) >= minutesFromTime(closeTime)) {
    feedback.textContent = "يجب أن يكون وقت الإغلاق بعد وقت بداية الدوام.";
    return;
  }
  if (normalizeWhatsApp(whatsapp).length < 10) {
    feedback.textContent = "أدخل رقم واتساب دوليًا صحيحًا مع رمز الدولة.";
    return;
  }
  if (!workingDays.length) {
    feedback.textContent = "اختر يوم عمل واحدًا على الأقل.";
    return;
  }
  settings = {
    ...settings,
    clinicName: byId("setting-clinic-name").value.trim(),
    doctorName: byId("setting-doctor-name").value.trim() || "فريق العيادة",
    whatsapp,
    slotDuration: Number(byId("setting-slot-duration").value),
    openTime,
    closeTime,
    workingDays
  };
  if (serverMode) {
    try {
      const result = await requestApi("/api/admin/settings", { method: "POST", body: settings });
      settings = result.settings;
    } catch (error) {
      feedback.textContent = error.message;
      return;
    }
  }
  writeStore(STORAGE_KEYS.settings, settings);
  sharedBookedSlots = serverMode ? sharedBookedSlots : [];
  updateClinicBranding();
  refreshBookingOptions();
  feedback.textContent = "تم حفظ إعدادات الموقع بنجاح.";
  showToast("تم تحديث إعدادات العيادة.");
});

byId("clear-appointments").addEventListener("click", async () => {
  if (!appointments.length) {
    showToast("لا توجد حجوزات لحذفها.");
    return;
  }
  if (!await confirmAction("هل أنت متأكد من حذف جميع الحجوزات من قاعدة بيانات العيادة؟")) return;
  if (serverMode) {
    try {
      await requestApi("/api/admin/appointments", { method: "DELETE" });
      await refreshAdminAppointments();
      await refreshServerState();
      renderTimeSlots();
      showToast("تم حذف جميع الحجوزات.");
    } catch (error) { showToast(error.message); }
    return;
  }
  appointments = [];
  writeStore(STORAGE_KEYS.appointments, appointments);
  renderAdmin();
  refreshBookingOptions();
  showToast("تم حذف جميع الحجوزات.");
});

byId("date-prev").addEventListener("click", () => {
  if (dateOffset <= 0) return;
  dateOffset -= 1;
  selectedDate = "";
  refreshBookingOptions();
});
byId("date-next").addEventListener("click", () => {
  dateOffset += 1;
  selectedDate = "";
  refreshBookingOptions();
});
byId("booking-service").addEventListener("change", () => {
  selectedTime = "";
  bookingTime.value = "";
  renderTimeSlots();
});

byId("menu-toggle").addEventListener("click", () => {
  const nav = document.querySelector(".main-nav");
  const isOpen = nav.classList.toggle("open");
  byId("menu-toggle").setAttribute("aria-expanded", String(isOpen));
});
document.querySelectorAll(".main-nav a").forEach((link) => link.addEventListener("click", () => {
  document.querySelector(".main-nav").classList.remove("open");
  byId("menu-toggle").setAttribute("aria-expanded", "false");
}));

function updateStorageDescriptions() {
  const dangerZone = document.querySelector(".danger-zone");
  dangerZone.querySelector("h2").textContent = "حذف الحجوزات من قاعدة البيانات";
  dangerZone.querySelector("p").textContent = "يحذف جميع الحجوزات المسجلة على الخادم. لا يمكن التراجع عن الحذف.";
  document.querySelector(".local-data-notice").textContent = "تُحفظ الحجوزات والصفحات والمرضى والوسائط في ملف قاعدة بيانات العيادة على الخادم، وتُدار من هذه اللوحة.";
}

async function initialize() {
  updateStorageDescriptions();
  updateClinicBranding();
  renderServices();
  selectedDate = "";
  renderDateStrip();
  renderTimeSlots();
  byId("footer-year").textContent = String(new Date().getFullYear());
  try {
    const state = await requestApi("/api/state");
    serverMode = true;
    settings = { ...DEFAULT_SETTINGS, ...state.settings };
    services = state.services;
    sharedBookedSlots = state.bookedSlots;
    gallery = state.gallery || [];
    updateClinicBranding();
    renderServices();
    renderGallery();
    renderBrandingControls();
    await loadPublicContent();
    refreshBookingOptions();
    const auth = await requestApi("/api/auth/me");
    if (auth.role === "user") applySignedInUser(auth.user);
    if (auth.role === "admin" || auth.role === "staff") {
      applySignedInUser(auth.role === "admin" ? { name: "مدير النظام", avatarUrl: settings.adminAvatarUrl, role: "admin" } : { ...auth.user, role: "staff" });
      await showAdminView();
    } else {
      applySignedInUser(null);
    }
  } catch (error) {
    console.error("Could not initialize the clinic server:", error);
    serverMode = false;
    showToast("تعذر الاتصال بخادم العيادة. بعض خدمات الموقع غير متاحة مؤقتًا.");
  }
  if (!serverMode) {
    signedInUser = null;
    localStorage.removeItem(STORAGE_KEYS.signedIn);
  } else {
    const authLink = new URL(window.location.href);
    const verificationToken = authLink.searchParams.get("verify");
    resetToken = authLink.searchParams.get("reset") || "";
    if (verificationToken || resetToken) {
      authLink.searchParams.delete("verify");
      authLink.searchParams.delete("reset");
      window.history.replaceState({}, document.title, `${authLink.pathname}${authLink.search}${authLink.hash}`);
      if (resetToken) {
        openAuthDialog(false, "reset");
      } else {
        openAuthDialog(false, "login");
        try {
          const result = await requestApi("/api/auth/verify-email", {
            method: "POST",
            body: { token: verificationToken }
          });
          byId("auth-message").classList.add("success");
          byId("auth-message").textContent = result.message;
        } catch (error) {
          byId("auth-message").textContent = error.message;
        }
      }
    }
  }
  window.setInterval(async () => {
    if (!serverMode) return;
    try {
      await refreshServerState();
      renderTimeSlots();
      if (!byId("admin-view").hidden) {
        await refreshAdminAppointments();
        if (signedInUser?.role === "admin") {
          await refreshAdminMembers();
          await loadDashboardData();
          await loadNotifications();
        }
      }
    } catch {}
  }, 20000);
}

initialize();
