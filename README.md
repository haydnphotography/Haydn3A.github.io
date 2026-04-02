# HAYDN 3A — Photography Portfolio
### Aviation · Architecture · Astrophotography

---

## 📁 File Structure

```
haydn3a/
├── index.html       ← Main site (don't touch unless customising layout)
├── style.css        ← All styles
├── app.js           ← All interactivity (don't touch unless customising behaviour)
├── photos.js        ← ⭐ YOUR FILE — add/remove photos here
├── _headers         ← Netlify security headers
└── images/
    ├── aviation/
    ├── architecture/
    └── astro/
```

---

## ➕ How to Add Photos

1. **Drop your image** into the correct folder under `/images/`
   - Aviation → `images/aviation/`
   - Architecture → `images/architecture/`
   - Astrophotography → `images/astro/`

2. **Open `photos.js`** and add an entry to the right category:

```js
{
  src: "images/aviation/my-new-photo.jpg",
  title: "My Shot Title",
  location: "Airport, UK",
  date: "2025",
  gear: "Sony A7IV · 400mm",
  featured: false    // set true to show in the hero slideshow
}
```

3. Save and push to GitHub / deploy to Netlify. Done.

---

## 🎨 Customisation

| What | Where |
|---|---|
| Your bio text | `SITE.bio` in `photos.js` |
| Site name & tagline | `SITE.name` / `SITE.tagline` in `photos.js` |
| Social links | `SITE.social` in `photos.js` |
| About/portrait image | `<img id="aboutImg">` in `index.html` |
| Colours / fonts | CSS variables at top of `style.css` |

---

## 🚀 Hosting

### Netlify (recommended)
1. Drag the `haydn3a/` folder onto [netlify.com/drop](https://app.netlify.com/drop)
2. Done. Security headers in `_headers` are applied automatically.
3. For a custom domain: Site settings → Domain management

### GitHub Pages
1. Push this folder to a GitHub repo
2. Settings → Pages → Source: `main` branch, `/ (root)`
3. Note: GitHub Pages does not support `_headers` — use Netlify for full security header support, or add a `netlify.toml` if you later move.

---

## 🔒 Security Features

| Feature | Details |
|---|---|
| No CMS / no login | Zero attack surface. No backend = nothing to hack. |
| CSP headers | Blocks inline scripts and external resource injection |
| No right-click on images | Soft deterrent against casual saving |
| F12 / Ctrl+U deterrent | Soft keyboard shortcut blocking |
| No form / no input | No injection vectors |
| HTTPS enforced | HSTS header forces secure connection |
| No third-party JS | No CDN scripts, analytics, or trackers loaded |

> **Note:** Watermarking your images is the strongest protection. Consider embedding a subtle watermark and hosting at ~2000px max width to deter commercial theft.

---

## 💡 Tips

- Use WebP format for fastest load times (`cwebp -q 85 photo.jpg -o photo.webp`)
- Keep hero images at 1920×1080, gallery images at 1400px max width
- Set `featured: true` on 3–5 photos for the best hero slideshow
- The site works offline once cached (progressive by design)
