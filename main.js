/* =============================================
   LOADER SCREEN
   ============================================= */
window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("loader").classList.add("hidden");
  }, 1200);
});

/* =============================================
   NAVBAR SCROLL
   ============================================= */
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 40);
});

/* =============================================
   HORIZONTAL SCROLL SETUP (Desktop only)
   ============================================= */
const scrollContainer = document.querySelector('body');
let isScrolling = false;

function isDesktop() {
  return window.innerWidth > 768 && window.matchMedia('(orientation: landscape)').matches;
}

window.addEventListener('wheel', (e) => {
  if (!isDesktop()) return; // Skip horizontal scroll on mobile/portrait

  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    e.preventDefault();
    window.scrollBy({
      left: e.deltaY,
      behavior: 'auto'
    });
  }
}, { passive: false });

/* =============================================
   INTERACTIVE CASE STUDY MODE
   ============================================= */
const caseStudies = {
  "deiji-marketplace": {
    title: "deiji-marketplace",
    summary:
      "Marketplace web app yang fokus ke experience belanja cepat dengan flow produk, katalog, dan checkout yang sederhana.",
    problem:
      "Perlu membangun fondasi e-commerce yang bersih agar mudah dikembangkan, sambil menjaga UI tetap ringan untuk user baru.",
    solution:
      "Menyusun struktur halaman dan komponen UI modular, memprioritaskan alur utama browsing produk hingga action pembelian.",
    stack: ["HTML", "CSS", "E-Commerce"],
    highlights: [
      "Struktur halaman modular agar mudah scale",
      "Visual hierarchy jelas untuk conversion flow",
      "Interaksi ringan agar performa tetap baik",
    ],
    repoUrl: "https://github.com/wahyuatmaja3/deiji-marketplace",
  },
  kyros: {
    title: "kyros",
    summary:
      "Project web berbasis PHP yang dibangun untuk kebutuhan pembelajaran sekaligus melatih praktik arsitektur backend dasar.",
    problem:
      "Membutuhkan project yang tidak hanya selesai secara fitur, tapi juga tetap rapih untuk proses belajar dan iterasi.",
    solution:
      "Menerapkan pola struktur route-view-data sederhana yang mudah dipahami, lalu mengoptimalkan alur CRUD inti.",
    stack: ["PHP", "Web", "School Project"],
    highlights: [
      "CRUD flow end-to-end",
      "Struktur folder mudah dipahami",
      "Baseline yang siap dikembangkan",
    ],
    repoUrl: "https://github.com/wahyuatmaja3/kyros",
  },
  figureiie: {
    title: "figureiie",
    summary:
      "Aplikasi Laravel Blade untuk menunjukkan kapabilitas full-stack web dari sisi rendering server hingga tampilan UI.",
    problem:
      "Perlu menyeimbangkan kecepatan delivery dan maintainability pada aplikasi berbasis template server-rendered.",
    solution:
      "Memanfaatkan Blade component untuk reuse tampilan, menjaga konsistensi antar halaman, dan mengurangi duplikasi.",
    stack: ["Blade", "Laravel", "PHP"],
    highlights: [
      "Komponen Blade reusable",
      "Konsistensi desain antarmuka",
      "Alur pengembangan lebih cepat",
    ],
    repoUrl: "https://github.com/wahyuatmaja3/figureiie",
  },
  "pendaftaran-siswa-smktag": {
    title: "pendaftaran-siswa-smktag",
    summary:
      "Sistem pendaftaran siswa berbasis Flutter untuk mempermudah proses input dan tracking data enrollment.",
    problem:
      "Alur pendaftaran manual rentan lambat dan sulit dipantau ketika jumlah pendaftar meningkat.",
    solution:
      "Merancang form, validasi, dan alur data yang terstruktur supaya proses pendaftaran lebih cepat dan minim kesalahan.",
    stack: ["Dart", "Flutter", "Education"],
    highlights: [
      "Form pendaftaran terstruktur",
      "Alur data lebih konsisten",
      "UI ramah operator sekolah",
    ],
    repoUrl: "https://github.com/wahyuatmaja3/pendaftaran-siswa-smktag",
  },
  yakusoku: {
    title: "yakusoku",
    summary:
      "Eksperimen JavaScript untuk mengeksplor pola interaksi modern dan pengalaman pengguna yang lebih hidup.",
    problem:
      "Butuh playground untuk mencoba pattern interaksi tanpa overhead framework yang berat.",
    solution:
      "Membangun interaksi langsung dengan vanilla JavaScript dan fokus pada transisi yang responsif.",
    stack: ["JavaScript", "Web"],
    highlights: [
      "Interaksi front-end responsif",
      "Animasi ringan dan halus",
      "Eksperimen pattern UI modern",
    ],
    repoUrl: "https://github.com/wahyuatmaja3/yakusoku",
  },
  artha: {
    title: "artha",
    summary:
      "Aplikasi Flutter yang dipakai untuk kebutuhan nyata dan berhasil menarik minat komunitas.",
    problem:
      "Membangun app yang tetap stabil untuk penggunaan real-world sambil menjaga kecepatan iterasi fitur.",
    solution:
      "Fokus pada pengalaman pengguna inti, optimasi flow penting, dan maintainability agar update bisa berjalan konsisten.",
    stack: ["Dart", "Flutter", "Mobile"],
    highlights: [
      "Dipakai untuk use case nyata",
      "Iterasi fitur berkelanjutan",
      "Mendapat respons komunitas",
    ],
    repoUrl: "https://github.com/wahyuatmaja3/artha",
  },
};

const caseStudyModal = document.getElementById("caseStudyModal");
const caseStudyClose = document.getElementById("caseStudyClose");
const caseStudyTitle = document.getElementById("caseStudyTitle");
const caseStudySummary = document.getElementById("caseStudySummary");
const caseStudyProblem = document.getElementById("caseStudyProblem");
const caseStudySolution = document.getElementById("caseStudySolution");
const caseStudyStack = document.getElementById("caseStudyStack");
const caseStudyHighlights = document.getElementById("caseStudyHighlights");
const caseStudyRepo = document.getElementById("caseStudyRepo");
const caseStudyDemo = document.getElementById("caseStudyDemo");

let activeCaseStudyTrigger = null;

function closeCaseStudyModal() {
  if (!caseStudyModal || !caseStudyModal.classList.contains("is-open")) return;
  caseStudyModal.classList.remove("is-open");
  caseStudyModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("case-study-open");
  if (activeCaseStudyTrigger) {
    activeCaseStudyTrigger.focus();
    activeCaseStudyTrigger = null;
  }
}

function openCaseStudyModal(triggerEl, data) {
  if (!caseStudyModal || !data) return;

  caseStudyTitle.textContent = data.title || "Case Study";
  caseStudySummary.textContent = data.summary || "";
  caseStudyProblem.textContent = data.problem || "";
  caseStudySolution.textContent = data.solution || "";

  caseStudyStack.innerHTML = "";
  (data.stack || []).forEach((item) => {
    const chip = document.createElement("span");
    chip.textContent = item;
    caseStudyStack.appendChild(chip);
  });

  caseStudyHighlights.innerHTML = "";
  (data.highlights || []).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    caseStudyHighlights.appendChild(li);
  });

  caseStudyRepo.href = data.repoUrl || triggerEl.href;

  if (data.demoUrl) {
    caseStudyDemo.href = data.demoUrl;
    caseStudyDemo.style.display = "inline-flex";
  } else {
    caseStudyDemo.style.display = "none";
  }

  activeCaseStudyTrigger = triggerEl;
  caseStudyModal.classList.add("is-open");
  caseStudyModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("case-study-open");
  caseStudyClose?.focus();
}

document.querySelectorAll(".project-card").forEach((card) => {
  card.addEventListener("click", (event) => {
    const projectId = card.dataset.projectId;
    const data = caseStudies[projectId];
    if (!data) return;
    event.preventDefault();
    openCaseStudyModal(card, data);
  });
});

caseStudyClose?.addEventListener("click", closeCaseStudyModal);

caseStudyModal?.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-case-study]")) {
    closeCaseStudyModal();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCaseStudyModal();
  }
});

/* =============================================
   INTERSECTION OBSERVER — Reveal & Skill Bars
   ============================================= */
const revealEls = document.querySelectorAll(
  "#about .section-header, .about-grid, #skills .section-header, .skill-category, " +
    "#projects .section-header, .project-card, #contact .section-header, .contact-card, " +
    ".stat-item, .card-inner",
);

revealEls.forEach((el, i) => {
  el.classList.add("reveal");
  el.style.transitionDelay = `${(i % 4) * 0.08}s`;
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.12 },
);

revealEls.forEach((el) => revealObserver.observe(el));

// Animate skill bars
const barObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll(".pill-fill").forEach((fill) => {
          const target = fill.style.width || "0";
          fill.style.width = "0";
          requestAnimationFrame(() => {
            setTimeout(() => {
              fill.style.width = target;
            }, 100);
          });
        });
        barObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.3 },
);

document
  .querySelectorAll(".skill-category")
  .forEach((cat) => barObserver.observe(cat));

/* =============================================
   ACTIVE NAV LINK ON SCROLL
   ============================================= */
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-links a");

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((a) => (a.style.color = ""));
        const activeLink = document.querySelector(
          `.nav-links a[href="#${entry.target.id}"]`,
        );
        if (activeLink) activeLink.style.color = "var(--text)";
      }
    });
  },
  { threshold: 0.3, rootMargin: "-80px 0px 0px 0px" },
);

sections.forEach((s) => sectionObserver.observe(s));

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    if (!targetId || !targetId.startsWith("#")) return;

    const targetEl = document.querySelector(targetId);
    if (!targetEl) return;

    event.preventDefault();
    const navbarHeight = navbar?.offsetHeight || 0;

    if (isDesktop()) {
      // Horizontal scroll for desktop
      const targetLeft = targetEl.offsetLeft - navbarHeight - 12;
      window.scrollTo({
        left: Math.max(targetLeft, 0),
        behavior: "smooth",
      });
    } else {
      // Vertical scroll for mobile/portrait
      const targetTop = targetEl.offsetTop - navbarHeight - 12;
      window.scrollTo({
        top: Math.max(targetTop, 0),
        behavior: "smooth",
      });
    }
  });
});

/* =============================================
   HANDLE ORIENTATION/RESIZE CHANGES
   ============================================= */
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    // Reset scroll position when switching between modes
    window.scrollTo({ top: 0, left: 0 });
  }, 250);
});

window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, 300);
});
