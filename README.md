# ✦ NIVEX SCRIPTS — Cinematic Cyber Portfolio & Script Engine

A scroll-driven, futuristic cyber portfolio engine with 3D parallax, procedural Web Audio synthesizer, split-apart background typography (`NI` / `VEX`), and interactive glassmorphism panels.

Designed and branded for **NIVEX SCRIPTS** with Electric Cyan and Ultraviolet Purple metallic aesthetic.

---

## 🚀 Quick Start (වෙබ් අඩවිය Run කරගන්නා ආකාරය)

```bash
# Option 1: Node.js හරහා
node server.js

# Option 2: npm හරහා
npm start
```
දැන් ඔබගේ browser එකෙන් **`http://localhost:3000`** වෙත පිවිසෙන්න.

---

## 📁 Project Structure (ගොනු සැකැස්ම)

```
d:\portfolio\
├── index.html                  # ප්‍රධාන HTML පිටුව (NIVEX SCRIPTS Brand)
├── style.css                   # Cyberpunk Glassmorphic Stylesheet (Electric Cyan + Ultraviolet)
├── main.js                     # 3D Tilt, Parallax, Audio Synthesizer, Split-text Engine
├── server.js                   # Zero-dependency local Node.js web server
├── package.json                # Project configurations & scripts
├── nivex-logo.png              # 3D Metallic Logo (< N > NIVEX SCRIPTS)
├── 2.mp3                       # Background cyber audio track
├── nivex_frames_transparent/   # Entrance animation frames
├── nivex2_100_transparent_frames/ # Idle loop animation frames
└── projects/                   # Project screenshots
    ├── snaprays.png            # SnapRays Photography screenshot
    ├── breathing-habitat.png   # Breathing Habitat Architecture screenshot
    ├── fivem-weather.png       # Snow Cloud FiveM Weather Control Center
    └── nivex-scripts.png       # NIVEX SCRIPTS Cinematic Engine
```

---

## ✨ Features (ප්‍රධාන විශේෂාංග)

1. **Brand Identity**: ඔබගේ official `< N > NIVEX SCRIPTS` 3D metallic logo එක Hero section, Navigation HUD, Preloader, සහ About avatar තුළ අලංකාර ලෙස යොදා ඇත.
2. **Logo-Matched Color Scheme**: Logo එකේ ඇති Electric Cyan (`#00f0ff`), Bright Sky Blue (`#38bdf8`), සහ Ultraviolet Purple (`#a855f7`) වර්ණ සංයෝජනය සම්පූර්ණ අඩවිය පුරා ක්‍රියාත්මක කර ඇත.
3. **Split-Apart 3D Background Typography**: Scroll කිරීමේදී හෝ Nav click කිරීමේදී පසුබිමේ ඇති "NI" සහ "VEX" අකුරු දෙපසට 3D perspective එකකින් split වී අදාළ glass panel එක මැදට පැමිණේ.
4. **Boot Sequence Terminal**: `NIVEX://CORE_BOOT` මගින් ආරම්භ වන dynamic typewriter terminal output එකක්.
5. **Background Music Player (2.mp3)**: `2.mp3` ගොනුව මගින් ක්‍රියාත්මක වන background cyber music player සහ Web Audio API UI blip sounds (♪ බොත්තම මගින් toggle කළ හැක).
6. **Permanent Cyberpunk Dark Theme**: Deep Cyberpunk Dark theme එක ස්ථිර ලෙස අතුරුමුහුණත පුරා සක්‍රීයව පවතී (High-contrast Neon Cyan & Purple accents).

---

## 🌐 Deployment & Hosting (වෙබ් අඩවිය Host කරගන්නා ආකාරය)

මෙම වෙබ් අඩවිය ඕනෑම Cloud හෝ Shared hosting platform එකක පහසුවෙන්ම host කළ හැකි පරිදි සකස් කර ඇත.

### 1. Netlify (නොමිලේ & පහසුම ක්‍රමය)
- [app.netlify.com](https://app.netlify.com) වෙත පිවිසෙන්න.
- ඔබගේ portfolio ෆෝල්ඩරය කෙලින්ම **Drag & Drop** කරන්න (නැතහොත් GitHub Repo එක connect කරන්න).
- අඩංගු කර ඇති `netlify.toml` සහ `_headers` මගින් සියලුම Caching සහ Redirects ස්වයංක්‍රීයව configure වේ.

### 2. Vercel
- [vercel.com](https://vercel.com) වෙත පිවිස GitHub Repo එක import කරන්න.
- Framework preset එක **Other** ලෙස තබන්න.
- අඩංගු කර ඇති `vercel.json` මගින් සියලු routing සහ static caching සකස් වේ.

### 3. Cloudflare Pages
- Cloudflare Dashboard එකෙන් Pages තෝරා GitHub Repo එක connect කරන්න.
- Build output directory එක `/` (root) ලෙස තබන්න.

### 4. cPanel / Apache / Shared Hosting (Hostinger, Namecheap, GoDaddy)
- cPanel එකේ **File Manager** වෙත ගොස් `public_html` ෆෝල්ඩරය විවෘත කරන්න.
- මෙම ෆෝල්ඩරයේ ඇති සියලුම files (ඇතුළත් කර ඇති `.htaccess` ගොනුවද සහිතව) zip කර upload කර Extract කරන්න.
- `.htaccess` ගොනුව මගින් Gzip compression, WebP/SVG MIME types, සහ URL rewrites ස්වයංක්‍රීයව ක්‍රියාත්මක වේ.

---

© 2026 Crafted for NIVEX SCRIPTS.

