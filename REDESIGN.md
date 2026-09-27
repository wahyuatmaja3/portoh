# Design Redesign — Obsidian ⇄ Prism

Redesign total `portoh` dari layout **horizontal scroll** multi-tema menjadi satu
halaman **vertical scroll** dengan dua tema yang saling berpasangan.

> Status dokumen ini sesuai implementasi terbaru di `index.html`, `style.css`, dan `main.js`.

## Filosofi

**Dari**: 6 tema (Neobrutalism, Y2K, Acid, Maximalism, Vibrant Bento, Y2K-lite)
dengan pattern dekoratif tiap tema, hero full-screen, dan scroll horizontal antar section.

**Ke**: Editorial minimal dengan tipografi kontras tinggi, satu aksen warna per
tema, dan motion yang berpusat pada interaksi konten — bukan hiasan.

Pola interaksi di-*port manual* ke vanilla JS dari referensi yang admired:

- **ObsidianUI** — pola React, ditulis ulang tanpa framework.
- **Bencho** — pola interaktif (command bar, progress ticks, sheet, slide-to-confirm,
  particle hero, carousel swipe, glass bubble drag).
- **DesignSpells** — referensi rasa visual dan micro-interaction, bukan sumber kode.

## Dua Tema

Keduanya memakai keluarga oranye, dengan nilai yang di-retint supaya tetap
membaca sebagai "terang/gelap" dan bukan sekadar hue yang sama.

| Token | `obsidian` | `prism` |
| --- | --- | --- |
| Peran | Dark, tanda tangan utama | Light, padanan terang |
| Background | `#08080a` | `#f4f2ed` |
| Text | `#f4f4f5` | `#12121a` |
| Muted (`--text-3`) | `#7d7d92` | `#6b6b76` |
| Accent | `#ff7a1a` (orange) | `#c2410c` (burnt orange) |
| Accent ink | `#1a0d02` | `#ffffff` |
| Accent soft | `rgba(255,122,26,.14)` | `rgba(194,65,12,.10)` |
| Accent line | `rgba(255,122,26,.34)` | `rgba(194,65,12,.30)` |
| Karakter | Grain halus + warm glow | Warm paper wash (3 radial gradient) |

`prism` memakai accent yang lebih gelap karena warna terang memakai background
putih: `#ff7a1a` di atas `#f4f2ed` hanya 2.33:1 (gagal bahkan untuk teks besar),
sedangkan `#c2410c` mencapai 4.63:1 dan lolos AA untuk teks normal. Di `obsidian`
`#ff7a1a` di atas `#08080a` mencapai 7.67:1. Kedua tema juga pakai `--accent-ink`
untuk teks di atas permukaan accent (`#1a0d02` di `obsidian` 7.30:1, `#ffffff`
di `prism` 5.18:1).

Theme disimpan di `<html data-theme>` dan `localStorage` key **`portoh-theme`**.
Toggle memakai komponen *liquid toggle*, bukan checkbox biasa.

## Tipografi

- **Display**: Instrument Serif — judul hero dan section title.
- **Body**: Inter — paragraf, navigasi, label.
- **Mono**: JetBrains Mono — eyebrow, tag, angka, dan teks bergaya terminal.

Ketiganya dimuat via Google Fonts. `<em>` di dalam section title dan lede memakai
Instrument Serif italic dengan warna accent. Hero title memakai `--fs-display`
(`clamp(3rem, 1.35rem + 8.2vw, 8.5rem)`).

## Struktur Halaman

`preloader` → `nav` + `command bar` → `hero` → `about` → `skills` →
`projects` → `process` → `contact` → `footer`, plus `case-study sheet`,
`click-spark canvas`, dan `hero particle canvas` yang menempel di luar flow.

Layout vertikal; **horizontal scroll dihapus seluruhnya**. Semua section memakai
shell `--shell` (1131px) dengan padding responsif. Nav menjadi 5 link
(01 About, 02 Skills, 03 Work, 04 Process, 05 Contact).

## Komponen Interaktif (20)

Semua komponen dibungkus `component(name, fn)` sehingga satu komponen yang gagal
tidak mematikan komponen lain, dan `prefers-reduced-motion` menonaktifkan motion.

1. `preloader` — gooey loader (SVG filter `gooey`), hilang sekali lalu dihapus dari DOM
2. `scroll-reveal` — IntersectionObserver, 19 elemen `[data-reveal]`
3. `flip-text` — judul hero, karakter demi karakter
4. `role-reel` — judul peran berputar, keyframes digenerate dari jumlah item
5. `progress-ticks` — meter level segmented per skill
6. `click-spark` — canvas particle di seluruh halaman
7. `draggable-marquee` — marquee bisa di-drag, dengan inertia dan keydown support
8. `tilt-card` — tilt 3D + glare pada kartu project
9. `magnetic-button` — tombol yang tertarik ke cursor
10. `slide-to-confirm` — slider untuk compose email, dengan fallback link
11. `inline-confirm` — konfirmasi aksi di tempat (copy email, dll)
12. `nav` — auto-hide saat scroll turun, restore saat fokus masuk
13. `stat-counters` — angka statistik beranimasi saat masuk viewport
14. `visit-count` — penghitung kunjungan, `localStorage` (static-friendly)
15. `case-study-sheet` — 6 case study dalam satu panel, focus trap
16. `command-bar` — `Ctrl/⌘ K`, 12 command, filter, wrap-around
17. `smooth-anchors` — scroll offset-aware, memindahkan fokus untuk a11y
18. `particles` — canvas particle hero, repelled cursor + tether, DPR-aware
19. `glass-bubble` — orb glass yang bisa di-drag, momentum + squash + bounce
20. `carousel` — 5 slide proses, scroll-snap + drag + dots + keyboard

### Catatan tentang tiga komponen baru

**`particles`** — canvas di belakang hero (`z-index: -1`, `pointer-events: none`).
Field acak diubah menjadi **sistem orbit**: dua orrery, masing-masing inti +
empat cincin konsentris. Total **82 badan** (dari 700 pada versi field padat).

Cincin di squash vertikal 0.6 supaya terbaca sebagai orbit, bukan lingkaran datar.
Cincin dalam paling cepat dan paling rapat (5 badan di r=0.3), cincin luar paling
lambat dan terjarang (13 badan di r=1.0) — kepadatan menipis ke luar seperti
sistem sungguhan, dan shear antar-cincin itulah yang membuatnya hidup. Tiap badan
punya drift dan wobble radial sendiri, jadi satu cincin tidak pernah terbaca
sebagai lingkaran putus-putus.

Pusat sistem ditempatkan sebagai fraksi dari kotak hero, di **pita atas judul** —
satu-satunya area yang bebas dari teks hero di semua ukuran yang diukur. Sistem
kedua mengambil margin kiri.

Cursor mendorong badan keluar dari orbit, lalu badan itu **spring kembali ke
slotnya**: pola boleh terganggu tapi tidak pernah rusak.

Dua hal yang membuatnya tetap murah pada jumlah ini:

- Pencarian tetangga dan pengelompokan link yang dipakai versi field padat sudah
  dihapus — sistem orbit punya jumlah bodies tetap yang diketahui, jadi tidak ada
  yang perlu dicari per frame.
- **Palet hanya dibaca saat `data-theme` berubah** (`MutationObserver`),
  sebelumnya `getComputedStyle` dipanggil tiap frame.

Hasil terukur: 81 badan/frame, 8 panggilan stroke, biaya canvas **0.17–0.26ms**
(1–2% dari budget 16.7ms). Histogram radius terukur menunjukkan empat pita
cincin bersih (r≈0.3, 0.56, 0.8, 1.0) dengan bin antar-cincin kosong.

**`glass-bubble`** —[posisi istirahat dihitung runtime dari geometri section]
dengan slot di samping slide-to-confirm bila ruang cukup, kalau tidak dipakai
padding bawah section. Offset drag di-*clamp* terhadap batas section **selama
ditahan** (bukan hanya saat dilepas), sehingga orb tidak pernah keluar area lalu
"snapped" balik. `FRICTION 0.92` supaya lemparan penuh redam dalam ~1 detik.

**`carousel`** — native scroll-snap dengan `scroll-padding` dan spacer buatan
agar slide terakhir bisa benar-benar reached. Drag mouse, dots, tombol
prev/next, dan tombol panah ber-keyboard.

## Catatan Teknis Penting

- **Fokus overlay**: `.sheet` dan `.cmd` memakai `visibility 0s` saat *open* dan
  `visibility 0s linear var(--dur)` saat *close*. Tanpa ini, `visibility` masih
  `hidden` saat `focus()` dipanggil sehingga fokus tidak pernah masuk overlay.
- **Reel**: `--reel-line` (CSS) menjadi satu sumber kebenaran untuk tinggi clip
  window, line box tiap item, dan langkah `translateY` yang digenerate `main.js`.
- **Kontras**: 287 node teks di kedua tema di-sweep lewat computed style dan
  semuanya lolos WCAG AA. Sweep itu tidak membaca `::before`, jadi ada sweep
  kedua berbasis piksel (full-page screenshot di-decode lewat canvas) yang
  mengukur 93 node teks yang duduk langsung di atas background halaman — titik
  yang justru bisa terkena wash. Dua sweep itu 0 kegagalan.
- **Marquee**: clone ditandai `aria-hidden="true"` agar tidak diulang screen reader.
- **Reduced motion**: orb tetap terlihat dan tetap bisa di-drag (drag adalah
  gerakan yang dipicu pengguna, bukan animasi otomatis), tapi squash, momentum,
  bounce, dan transisi dimatikan. Field particle disembunyikan sepenuhnya karena
  bergerak sendiri.
- **Test scroll**: harness harus scroll dengan `behavior: 'instant'`. Situs
  memakai `scroll-behavior: smooth`, jadi `scrollIntoView`/`scrollBy` default
  leave scroll di tengah jalan dan menghasilkan false negative pada
  semua tes yang memakai koordinat viewport.

## File

- `index.html` (814 baris) — struktur semantik seluruh section
- `style.css` (2255 baris) — design tokens, 2 tema, responsif, reduced-motion, print
- `main.js` (2331 baris) — 20 komponen terisolasi

Backup versi sebelum redesign disimpan di `.bak-v1/`
(`index.html`, `style.css`, `main.js`).
