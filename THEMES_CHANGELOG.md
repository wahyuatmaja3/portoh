# Theme Changelog

Riwayat perubahan sistem tema `portoh`.

## v4 — Retint oranye + komponen Bencho baru

Aksen lime/violet di v3 diganti menjadi keluarga oranye, dan tiga pola interaksi
dari Bencho ditambahkan.

### Retint aksen

| Token | `obsidian` (v3 → v4) | `prism` (v3 → v4) |
| --- | --- | --- |
| `--accent` | `#d6ff3f` → **`#ff7a1a`** | `#4b32e0` → **`#c2410c`** |
| `--accent-ink` | baru | baru |
| `--accent-soft` | baru | baru |
| `--accent-line` | baru | baru |

`prism` **tidak** memakai `#ff7a1a` yang sama seperti `obsidian`. Accent terang
yang lolos di atas `#08080a` (7.67:1) gagal di atas `#f4f2ed` (2.33:1 — di bawah
batas 3:1 untuk teks besar), jadi tema terang memakai orange burnt `#c2410c`
(4.63:1) yang lolos AA untuk teks normal.

Token baru:

- `--accent-ink` — warna teks di atas permukaan accent. `#1a0d02` di `obsidian`
  (7.30:1), `#ffffff` di `prism` (5.18:1).
- `--accent-soft` — fill accent transparan, untuk chip dan hover.
- `--accent-line` — stroke accent, dipakai canvas particle dan border dekoratif
  supaya warna partikel tetap mengikuti tema tanpa palet JS terpisah.

Wash `prism` juga diubah dari iridescent (ungu/magenta/teal) menjadi warm paper,
agar konsisten dengan aksen oranye.

### Komponen baru

- `particles` — dua sistem orbit di belakang hero (inti + 4 cincin konsentris,
  82 badan), warna dari token accent. Cincin dalam paling cepat dan padat, luar
  paling lambat dan jarang. Cursor mendorong badan lalu/spring balik ke orbit.
- `glass-bubble` — orb glass draggable di section contact.
- `carousel` — 5 slide proses, section `#process` baru di antara Work dan Contact.

### Sweep kontras

- 287 node teks per tema (naik dari 265) lolos WCAG AA via computed style.
- Sweep berbasis piksel tambahan: 93 node teks yang duduk di atas background
  halaman, diukur dari screenshot full-page. Ini menutup celah yang tidak
  terlihat oleh sweep computed style, karena `body::before` tidak punya
  `background-color` yang bisa dibaca. 0 kegagalan di kedua tema.

### Reduced motion

Field particle disembunyikan total (bergerak sendiri). Glass bubble justru
**tetap terlihat dan tetap bisa di-drag** — drag adalah gerakan yang dipicu
pengguna, bukan animasi otomatis — tapi squash, momentum, bounce, dan transisi
dimatikan sehingga orb hanya mengikuti pointer.

---

## v3 — Dua tema: Obsidian ⇄ Prism (redesign total)

Menyederhanakan **6 tema** menjadi **2 tema** yang saling berpasangan, sekaligus
mengubah layout dari horizontal scroll menjadi vertical scroll.

### Tema yang dipertahankan (dirombak penuh)

- **`obsidian`** (dark, accent lime `#d6ff3f`) — tema utama.
  Grain halus, panel elevated, teks terang di atas `#08080a`.
- **`prism`** (light, accent violet `#4b32e0`) — padanan terang.
  Mendapat *iridescent wash* dari tiga `radial-gradient` (ungu, magenta, teal)
  yang melayang di atas background.

### Tema yang dihapus

Neobrutalism, Y2K / Web 1.0 Retro, Acid / Cyberpunk, Maximalism, Vibrant Bento.

Alasannya: tiap tema membawa pattern dekoratif sendiri (polkadot, CRT scanlines,
checkerboard, gradient mesh) sehingga tema terasa seperti skin yang ditumpuk,
bukan satu sistem desain. reducing ke dua tema yang benar-benar berlawanan
(dark/light) membuat pilihan tema terasa bermakna, dan pattern dekoratif yang
tidak perlu bisa hilang.

Asset `y2k-asset.png` masih ada di repo tetapi tidak lagi direferensikan.

### Mekanisme tema

- Tema berada di atribut `<html data-theme="obsidian|prism">`.
- Disimpan di `localStorage` dengan key **`portoh-theme`**.
- Toggle memakai komponen *liquid toggle* (`aria-checked`, bukan checkbox).
- Tidak ada lagi key CSS `theme-*` per tema.

### Layout

- Horizontal scroll dihapus. Setiap section sekarang satu viewport penuh
  dalam alur vertical, tanpa `width: 100vw` per section.
- Di v3, **265 node di kedua tema sudah di-sweep WCAG AA** (rasio 4.5:1 untuk
  teks normal, 3:1 untuk teks besar). Angka ini menjadi 287 di v4 setelah
  section process dan carousel ditambahkan.

### Perbaikan token kontras

`--text-3` (teks muted) dinaikkan agar lolos AA di atas permukaan elevated:

| Tema | Nilai lama | Nilai baru | Rasio di `--surface` |
| --- | --- | --- | --- |
| `obsidian` | `#6b6b78` | `#7d7d92` | 3.81 → **4.57** |
| `prism` | `#8b8b95` | `#6b6b76` | 3.02 → **4.70** |

Keduanya dinaikkan karena background `--surface` lebih terang dari `--bg`, jadi
rasio teks di dalam card selalu lebih rendah daripada rasio di atas background utama.

---

## v2 — Enam tema (superseded)

Sistem multi-tema sebelum disederhanakan. Detail per tema:

- **Neobrutalism** — motif polkadot `radial-gradient`, hard shadow, border hitam tebal.
- **Y2K / Web 1.0 Retro** — kolase era 2000-an, pola grid/ubin `repeating-linear-gradient`.
- **Acid / Cyberpunk** — overlay CRT scanlines, background grid hijau neon.
- **Maximalism** — checkerboard, teks raksasa bertumpuk, warna bertabrakan.
- **Vibrant Bento** — gradient mesh `radial-gradient`, sudut melengkung.
- **Obsidian-lite** — variasi dark pertama.

### Perbaikan layout v2 (telah dibatalkan)

v2 memaksa tiap section mengambil tepat 1 viewport agar transisi horizontal rapi:

```css
section {
    width: 100vw;
    flex: 0 0 100vw;
    overflow-y: auto;
    overflow-x: hidden;
}
```

Pendekatan ini sudah **tidak berlaku** — horizontal scroll dihapus di v3.
