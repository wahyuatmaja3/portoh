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
  particle hero, carousel swipe, glass bubble drag — yang terakhir dibangun lalu dihapus).
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
| Particle ink | `#ff7a1a` | `#c2410c` |
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

## Komponen Interaktif (22)

Semua komponen dibungkus `component(name, fn)` sehingga satu komponen yang gagal
tidak mematikan komponen lain, dan `prefers-reduced-motion` menonaktifkan motion.

1. `preloader` — gooey loader (SVG filter `gooey`), hilang sekali lalu dihapus dari DOM
2. `scroll-reveal` — IntersectionObserver, 19 elemen `[data-reveal]`
3. `tech-text` — wordmark nama hero di canvas, ala reactbits TechText
4. `role-reel` — judul peran berputar, keyframes digenerate dari jumlah item
5. `progress-ticks` — meter level segmented per skill
6. `click-spark` — canvas particle di seluruh halaman
7. `flex-carousel` — rail skill kontinu tanpa batas (reactbits FlexCarousel)
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
19. `carousel` — 5 slide proses, scroll-snap + drag + dots + keyboard
20. `fluid-glass` — lensa kaca (transmission) mengikuti pointer di atas hero
21. `gradual-blur` — band blur bertahap di tepi bawah viewport
22. `target-cursor` — kursor global empat siku (reactbits TargetCursor)

### Catatan komponen

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

**Cara pewarnaan.** Canvas particle diwarnai lewat properti `color` biasa
(`style.css`: `color: var(--particle-ink, var(--accent))`), dan JS menggambar
dengan computed `color` milik canvas itu sendiri — bukan membaca token dari
`:root`. Konsekuensinya:

- Tidak ada nama token di JS, jadi tema bebas mengganti tinta particle tanpa
  menyentuh `main.js`.
- Tidak ada palet hardcoded yang bisa basi. Sebelumnya ada fallback
  `#ff7a1a` dan `rgba(255, 122, 26, 0.34)` yang harus dijaga manual.
- Token `--accent-line` dihapus seluruhnya. Stroke lintasan orbit memakai tinta
  yang sama dengan `globalAlpha` yang lebih rendah, jadi satu warna cukup untuk
  dua tingkat visual.

Pembacaan tetap dijaga `MutationObserver` di `data-theme`, bukan per frame —
`getComputedStyle` tiap frame itu forced style recalc yang lebih mahal daripada
menggambarnya.

Hasil terukur: 81 badan/frame, 8 panggilan stroke, biaya canvas **0.17–0.26ms**
(1–2% dari budget 16.7ms). Histogram radius terukur menunjukkan empat pita
cincin bersih (r≈0.3, 0.56, 0.8, 1.0) dengan bin antar-cincin kosong, dan RGB
tinta yang benar-benar tergambar cocok persis dengan computed `color` canvas di
kedua tema.

**`glass-bubble`** (dihapus) — drag orb glass di section contact sempat dibangun lalu
dikeluarkan lagi: batas kept benar tapi interaksinya ganda dengan slide-to-confirm
yang berdampingan. Markup, CSS, dan komponen `glass-bubble` + `cursor-bubble`
sudah tidak ada di kode; kursor kembali ke native untuk semua pointer.

**`carousel`** — native scroll-snap dengan `scroll-padding` dan spacer buatan
agar slide terakhir bisa benar-benar reached. Drag mouse, dots, tombol
prev/next, dan tombol panah ber-keyboard.

**`fluid-glass`** — reinterprétasi vanilla dari *FluidGlass* reactbits (mode
`lens`) tanpa Three.js: aslinya lensa silinder GLB memakai
`MeshTransmissionMaterial` + render-to-texture untuk refraksi; di sini lensa
kaca bulat 24rem memakai `backdrop-filter: blur(6px) saturate(1.6)` sebagai
surface transmission-nya, `border-radius: 50%`, radial "thickness" terang ke
inti dan gelap ke rim, frinji kromatik merah/cyan lewat `box-shadow` inset
(pengganti dispersi shader — `backdrop-filter: url()` tak andal di Chromium),
dan kilau spekular di `::before` supaya terbaca sebagai kaca, bukan pane matte.
Lensa mengejar pointer di dalam rect hero (damping λ=8 via rAF). Rect komponen
**tidak** dibaca ulang per pointermove (`getBoundingClientRect` itu forced
layout — baca pada tiap move menurunkan frame rate), hanya saat scroll/resize;
scroll ikut mengevaluasi ulang containment jadi lensa ikut mati saat hero keluar
layar. `.hero__lens` memakai `overflow: clip` agar kotak statis lensa 24rem
tidak menghitung scroll overflow horizontal.

Biaya terukur: di jalur GPU (browser pengguna) p95 16.8ms saat lensa mengejar —
setara budget normal. Di Playwright headless, raster software tanpa GPU, blur
bergerak runtuh ke ~150–300ms; itu artefak lingkungan tes, bukan perilaku pengguna.

**`gradual-blur`** — reinterprétasi vanilla *GradualBlur* reactbits: 5 layer
`backdrop-filter` ber-step rapat (contoh reactbits `divCount={5}`, `strength={2}`,)
`height="7rem"`, kurva bezier + ramp eksponensial, `opacity={1}`) menempel di
`position: fixed` bawah viewport (7rem, z-index 90), non-interaktif
(`pointer-events: none`). Empat lapis terluar transparan, lapis terdalam
menyandang gradient mask `transparent 80% → #000` agar konten tenggelam
bertahap. Blur naik monoton dari ~3px ke ~12px (terukur). Band ini "page-footer" —
memberi kedalaman blur tanpa menghilangkan interaksi, dan berbeda dari pola
"read-more fade" karena memakai blur asli, bukan gradient teks.

Reduced motion: lensa fluid-glass disembunyikan penuh (`.hero__lens { display:none }`),
band gradual-blur tetap tampil statis tanpa transisi; print menyembunyikan keduanya.

**`tech-text`** — port reactbits *TechText* (varian canvas). Nama hero **tidak
lagi berupa teks DOM** — ia dilukis di `<canvas>` di atas `<h1>`, satu sprite per
huruf: satu sprite **isi** dan satu sprite **garis putus-putus** (stroke putus-putus
lalu interior di-*destination-out*, sehingga hanya siluetnya yang tersisa).

Huruf di bawah pointer bertukar dari isi ke garis putus-putus, dan sebuah
**frame seleksi** dengan bingkai, centang sudut, serta **spec** yang berkedip
menyusul. Huruf bisa **diseret** keluar dari baris lalu *spring* kembali
(`SPRING 320`, `DAMPING 22`), dengan bayangan siluet yang tertinggal selama
seretan. Saat pointer menjauh, *idle sweep* mengambil alih — melintas
sendiri sepanjang kata — menjaga nama tetap "hidup".

Kanvas hanya berjalan untuk mode `reveal="letter"` yang dipakai di sini; mode
`area` (lensa erase bergradien) tersedia di kode tapi tidak diaktifkan.

**Cara menjaga hero tetap persis.** Kanvas mengukur kotak `<h1>` yang sudah ada
lalu menskala wordmark agar muat di dalamnya, sehingga **posisi, lebar baris,
dan tinggi baris identik** dengan teks CSS biasa — bukan judul yang dipindahkan
ke dalam kanvas. Teks aslinya **tetap ada di DOM** dan hanya diberi
`color: transparent` lewat kelas `is-canvas`, jadi tetap terbaca screen reader,
tetap bisa di-*select*, dan **utuh tanpa JS**. `visibility`, bukan `display`,
dipakai untuk menyembunyikan teks, karena kotaknya justru yang diukur kanvas.

Kanvas `aria-hidden`, `pointer-events: none` (target seret ada di `<h1>`, bukan
di kanvas), DPR-aware (dibatasi 2), dan digambar ulang ulang saat
`ResizeObserver` / `IntersectionObserver` / pemuatan font / perpindahan tema
berjalan — perpindahan tema dibaca lewat `MutationObserver` atas `data-theme`,
bukan dibaca per frame.

**`flex-carousel`** — port reactbits *FlexCarousel* untuk section *Tech I reach
for* (menggantikan dua baris `draggable-marquee`). Bedanya dengan marquee: item
tidak di-clone ke track lebar tetap lalu di-*wrap*, tapi **daur ulang** — begitu
satu item benar-benar melewati tepi kiri, item itu dipindahkan ke ekor track dan
`translateX` ditambah stride-nya, sehingga secara visual item tersebut tidak
pernah terlihat keluar. Dua belas chip asli tetap utuh di DOM (yang berubah hanya
urutan anak track), sementara clone `aria-hidden` hanya menambah bahan sampai track
selebar 2× viewport, dan `stride` (lebar item + gap) di-cache per elemen karena
elemen yang berpindah tempat harus tetap membawa lebarnya.

Kecepatan 44px/s di-ease (`0.09` per frame) menuju target, `dt` dari
`performance.now()` dan di-clamp 50ms supaya tab yang tersendat tidak melompat.
Pause saat hover, ← → untuk keyboard (±⅓ viewport), rAF berhenti saat tab tidak
terlihat. Diukur: 12 chip asli + 7 clone, gap antar item konstan 12px, tidak
ada item tertinggal di luar tepi kiri, dan overflow horizontal halaman 0.

Dua fallback, keduanya dilayani CSS **dan** JS: `prefers-reduced-motion` dan
pointer yang tidak bisa hover (sentuh) mendapat strip `overflow-x: auto` biasa —
tanpa clone, tanpa `transform`, dan tanpa handler panah (browser sudah
menggeser container yang focusable). Pada 390px strip-nya 1864px lebar dan bisa
di-swipe.

**`target-cursor`** — port reactbits *TargetCursor*. Satu `div` fixed (posisi
`translate` + `rotate` ditulis JS tiap frame) membungkus `div` inner yang
membawa **empat siku** dan **satu dot** 4px.

**Siku berukuran konstan.** Tiap siku adalah kotak 18px (12px + border 3px,
`content-box` di aslinya) dengan **dua border dihapus**, sehingga yang tersisa
adalah pasangan lengan 3px. Ukurannya **tidak pernah** mengikuti ukuran target:
tombol selebar 655px tetap mendapat empat tanda 18px yang sama dengan dot
carousel 28px. Versi sebelumnya menykalakan panjang lengan siku mengikuti
half-extent target, dan itulah yang membuatnya terbaca jelek — tiap siku jadi
huruf-L raksasa ratusan piksel.

**Snap.** Saat target ditemukan, rotasi langsung disetel ke `0`, putaran
dihentikan, lalu tiap siku **bergerak sendiri** ke sudut target
(`rect.left - borderWidth` dan seterusnya), dengan `BORDER` menggeser siku ke
luar supaya membingkai, bukan menimpa. `strength` dinaikkan 0 ke 1 selama
`hoverDuration` (0.2s); selama fase itu time-constant siku 0.05, sehingga siku
tiba sekitar 96% dalam 200ms — inilah snap-nya. Setelah parkir, time-constant
naik ke 0.12 (mode parallax), atau 0.001 bila `parallaxOn` mati sehingga siku
dikunci rapat ke sudut. Melepas target mengembalikan siku ke cluster kecil di
sekitar pointer (time-constant 0.1) dan putaran lanjut 50ms kemudian.

Time constant di sini **bukan** durasi tween: tween 0.2s sudah selesai pada
0.2s, sedangkan tau 0.2 baru 63% — memakai tau 0.2 membuat snap terasa
meluncur.

**Parallax tidak dihitung terpisah.** Wrapper-nya sendiri tertinggal sekitar
0.08s di belakang pointer, dan posisi siku dihitung relatif terhadap wrapper,
sehingga siku ikut miring saat wrapper menyusul. Itu trik dari aslinya, dan
itulah yang membuat efeknya terasa berbobot, bukan sekadar tertinggal.

Dot **tidak** disembunyikan saat terkunci: siku membingkai sebuah elemen, sedangkan
dot ini tetap memberitahu posisi pointer yang sebenarnya. Tekanan mouse
menurunkan scale wrapper ke 0.9 (lewat `div` inner, supaya transisi CSS bisa
mengaturnya sendiri) dan 0.7 pada dot.

Warna diambil dari `mix-blend-mode: difference`: siku membalik apa pun yang ada
di bawahnya, jadi tetap terbaca di atas gradien hero, di sheet, dan di kedua
tema tanpa perlu theming per permukaan.

**Menentukan target dari posisi pointer, bukan dari event.** Tiap frame komponen
memakai `document.elementFromPoint` lalu `.closest('.cursor-target')`. Ini
sengaja: tombol `magnetic-button` memang bergerak ke arah pointer, sheet
meluncur, carousel maju — semuanya memindahkan elemen dari bawah kursor yang
berdiri diam, dan target berbasis event diam-diam kehilangan lock. Satu
hit-test per frame lebih murah daripada salah.

Kelas `cursor-target` dipasang pada **66 elemen** — link nav, tombol, chip
skill, slide carousel, tombol prev/next, dots (dibuat JS), item command bar
(dibuat JS), tautan repo, kanal, slider slide-to-confirm, input command bar,
dan aksi sheet. Target ditentukan per frame lewat `elementFromPoint`, jadi daftar
ini hanya perlu mencakup *permukaan*, bukan hanya elemen fokusable — chip
`.skill` dan slide `.carousel__slide` ikut karena permukaan itulah yang membuat
kursor terasa hidup. Satu-satunya elemen interaktif yang sengaja **tidak** diberi
target adalah `div.flex-carousel` — ia adalah area scroll, bukan target, dan
membingkai rel utuh hanya menghasilkan kotak raksasa yang ikut bergeser.

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
- **Rail skill**: clone ditandai `aria-hidden="true"` dan `data-skill` dicabut agar
  tidak diulang screen reader; strip statis (reduced motion / sentuh) menyembunyikan
  clone sepenuhnya lewat `.is-clone`.
- **Reduced motion**: lensa fluid-glass disembunyikan; band gradual-blur statis
  tanpa transisi; field particle disembunyikan sepenuhnya karena bergerak sendiri;
  `tech-text` tidak pernah scramble; rail skill jadi strip yang bisa di-scroll
  native. Kursor kustom tetap hidup — dia umpan balik pointer, bukan motion.
- **Test scroll**: harness harus scroll dengan `behavior: 'instant'`. Situs
  memakai `scroll-behavior: smooth`, jadi `scrollIntoView`/`scrollBy` default
  leave scroll di tengah jalan dan menghasilkan false negative pada
  semua tes yang memakai koordinat viewport.

## File

- `index.html` (813 baris) — struktur semantik seluruh section
- `style.css` (2368 baris) — design tokens, 2 tema, responsif, reduced-motion, print
- `main.js` (2314 baris) — 23 komponen terisolasi

Backup versi sebelum redesign disimpan di `.bak-v1/`
(`index.html`, `style.css`, `main.js`).
