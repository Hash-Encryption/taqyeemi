# Ueno Saryo Tea Experience

Single-page bilingual tea menu and ordering experience.

## Preview locally

Use the included range-enabled server so the browser can seek through the MP4 reliably:

```powershell
node serve.mjs
```

Then open `http://127.0.0.1:4173/`.

## WhatsApp orders

The cart works immediately using WhatsApp's share screen. To send orders directly to one business account, open `index.html` and set `WHATSAPP_NUMBER` to the full number with country code and digits only, for example `9665XXXXXXXX`.

## Files

- `index.html` — complete site, styles, localization, menu and cart logic
- `assets/matcha-pour.mp4` — scroll-driven hero video
- `validate.mjs` — offline syntax and content checks
- `design-system/` — generated design reference used during the build
