# Oryx for Car Accessories — landing page

Single-page site. No build step, no framework, no npm. Open `index.html` in a browser
or drop the folder on any host (Netlify, Vercel, cPanel, S3 — anything that serves files).

```
oryx-landing/
├─ index.html           ← DESIGN 02 — light, editorial (current default homepage)
├─ index2.html          ← DESIGN 01 — dark, technical
├─ index3.html          ← DESIGN 03 — maroon poster
├─ index4.html          ← DESIGN 04 — glass, quiet luxury
├─ assets/
│  ├─ css/style.css     ← design 01
│  ├─ css/style2.css    ← design 02
│  ├─ css/style3.css    ← design 03
│  ├─ css/style4.css    ← design 04
│  ├─ js/hero.js        ← 01: Three.js particle streams
│  ├─ js/main.js        ← 01: interactions
│  ├─ js/hero2.js       ← 02: Three.js shaded ribbons
│  ├─ js/main2.js       ← 02: interactions
│  ├─ js/main3.js       ← 03: interactions (no WebGL)
│  ├─ js/main4.js       ← 04: interactions (no WebGL)
│  └─ img/              ← logo + artwork (shared by all four)
└─ README.md
```

## Four designs, one content set

All four pages carry the same copy, the same logo, the same artwork and the same
(demo) contact details — so the choice is about direction, not detail.

| | **02** `index.html` | **01** `index2.html` | **03** `index3.html` | **04** `index4.html` |
|---|---|---|---|---|
| Mood | Light, editorial | Dark, technical | Bold poster | Light glass, quiet luxury |
| Base | Warm paper `#F4F2F0` | Near-black `#101216` | Maroon `#61121F` **is** the page | Warm white `#F8F5F3` under a drifting rose wash |
| Type | Fraunces + DM Sans | Sora + Inter | Anton + Archivo (heavy caps) | Cormorant Garamond + Jost (fine serif) |
| Surfaces | Flat, ruled | Solid cards | Flat blocks | **Frosted white glass** — every panel blurs the wash behind it |
| Navigation | Top bar | Top bar | Fixed left rail | Floating glass pill |
| Hero | Three.js shaded ribbons | Three.js particle streams | Giant type, solid/outline/shine | Centred serif + 3D-tilting glass pane |
| Services | Horizontal scroll strip | Card grid, 3D tilt | Index list, cursor preview | Glass cards, cursor light + sheen sweep |
| Process | Accordion | Pinned scroll story | Drawn timeline | Glowing vertical line that fills on scroll |
| Reveals | Mask + rise | Fade + rise | Fade + wipe | **Blur-in** (frosted → sharp) |
| WebGL | Yes | Yes | None | None |

**Design 04's signature:** a fixed wash of four blurred lights — dusty rose, soft
maroon, cool lilac and warm peach — drifts behind everything on 26–36 second
cycles, and every `class="gl"` panel is white frosted glass that blurs whatever
colour passes behind it. So the page keeps moving even when nothing is animating
on top, and each panel picks up a slightly different tint depending on where it
sits. Panels also catch a maroon light sweep and a white cursor-tracked bloom on
hover. It's the heaviest of the four to paint (`backdrop-filter` isn't free), but
still lighter than the WebGL pages.

The dark blueprint illustrations are kept as-is on this page — dark tiles on warm
white read as expensive, and they give the glass something with real contrast to
sit against.

Designs 03 and 04 use no WebGL at all, which makes them the most robust on old
phones — worth mentioning if the client asks about speed.

A small **Design 01 / 02 / 03 / 04** switcher sits bottom-left on every page so the
client can flip between them live. **Delete that block from all four HTML files
before launch** — search for `class="swap"`.

Once a direction is picked, delete the other three pages and their `style*.css` /
`*.js` files. Nothing is shared between them except the images and the logo.

---

## ⚠️ Read this before the site goes live

The page is filled in with **demo content** so it presents as a finished site.
Two categories of it are not real and must be replaced:

**1. Contact details.** Every phone number, address, email and map link is invented.
Each one is tagged `data-demo` in the HTML — search the project for `data-demo`
and you'll find all of them (every page carries its own set). To see them highlighted in the browser,
uncomment the `[data-demo]` rule near the top of `assets/css/style.css`.

| Demo value | Where | Replace with |
|---|---|---|
| `+974 4468 2200` | header, mobile menu, branch 01, contact, footer | main line |
| `+974 4468 3300` | branch 02 card | second branch line |
| `+974 3312 2200` | WhatsApp link, floating button, `CONFIG.whatsapp` in `main.js` | real WhatsApp number |
| `info@oryxcaraccessories.qa` | contact, footer, `CONFIG.email` in `main.js` | real inbox |
| `Street 38, Industrial Area, Doha` | branch 01, footer | branch 01 address |
| `Street 12, Al Wakrah Industrial Area` | branch 02, footer | branch 02 address |
| `google.com/maps/search/?…` | both **Directions** buttons | real Google Maps place links |
| `Since 2011` | about badge | the year the shop opened |
| Opening hours | branch cards, contact, footer | real hours |
| Stat figures (`10k+` cars, `98%`, `12mo`) | hero + why section — the `data-count` attributes | real numbers, or drop the ones you can't back up |

The WhatsApp number lives in **two** places for each: the `href` in the page
*and* `CONFIG.whatsapp` at the top of its `main*.js` (e.g. `index2.html` pairs
with `assets/js/main.js`, that one powers the quote form). Change both, on
every page.

**2. The three testimonials** in the "says" section are written samples, not real
customers. Replace them with genuine quotes or delete the section before launch —
publishing invented reviews is a real problem, not a cosmetic one.

---

## The logo

Save the real logo as **`assets/img/logo.png`** (transparent PNG, ~1000px wide).
One file covers the preloader, header, about panel and footer.

Until it exists the page falls back to `assets/img/logo.svg` — a hand-built
approximation of the mark, not the real artwork. Replace it as soon as you can.

> The header logo sits on the dark hero, so CSS inverts it to white
> (`filter: brightness(0) invert(1)`). To show the full-colour logo everywhere,
> delete that line from `.brand__logo` in `style.css`.

## The artwork

There are no photographs in this build. Every image slot holds a **generated SVG
technical illustration** in the brand colours — blueprint-style line art on dark
graphite with maroon accents. They're intentional-looking placeholders, small
(2–4 KB each) and sharp at any size, but they are illustrations, not the shop.

The **about panel is a live animated scene** rather than a flat image: it's an
inline `<svg class="scene">` in `index2.html` (Design 01), animated entirely from CSS —
radar arcs pulsing out of the logo swoosh, the car drawing itself in when the
panel scrolls into view, wheels turning, and a blueprint scan sweeping down.
No video file, no JS animation library, a few KB in total.

**To put real video there instead**, replace the whole `<div class="about__img">`
block with the `<video>` snippet in the HTML comment just above it — an
autoplaying, muted, looping MP4 with a poster frame. Keep it short (8–15s),
under ~3 MB, and always supply the `poster` image so something sensible shows
on slow connections and on iOS Low Power Mode, where autoplay is blocked.

| File | Slot | Swap for |
|---|---|---|
| `why-01.svg` | why-us panel | workshop / bay wide shot |
| `work-01.svg` | tall tile | full leather retrim interior |
| `work-02.svg` | tile | tinted glass, ideally a half-done car |
| `work-03.svg` | tile | LED or wiring work |
| `work-05.svg` | wide tile | battery fitting |
| `work-04.svg` | full-width band | finished 4×4 accessory build |
| `og.png` | social share card, 1200×630 | rebuild with a real hero photo |

To swap one in: save the photo as e.g. `work-01.jpg` and change that one filename
in each HTML page that references it (all four do) — each slot carries its own inline
`style="background-image:url('assets/img/work-01.svg'),var(--fb-photo)"`.
Keep the `var(--fb-photo)` part; it's the gradient that shows if the file is
missing. (Don't move the URL into a CSS custom property — Chrome resolves
relative `url()` inside custom properties against the stylesheet, not the page,
which silently breaks the path.) You can replace
them one at a time — mixing photos and illustrations still looks fine because they
share the palette. Compress the JPGs before uploading; they'll be the only heavy
assets on the page.

## Branch maps

The branch cards use a styled abstract map. To swap in a real embedded map,
replace `<div class="branch__map">…</div>` with a Google Maps iframe:

```html
<iframe class="branch__map" src="https://www.google.com/maps/embed?pb=…"
        loading="lazy" title="Oryx main branch" style="border:0"></iframe>
```

---

## What's animated

| Effect | Where | Tech |
|---|---|---|
| Flowing particle streams echoing the logo swooshes | hero background | Three.js `Points` on baked Catmull-Rom curves, additive blending |
| Mouse parallax + scroll dolly on the 3D scene | hero | camera/group lerp |
| Looping blueprint scene — radar pulse, self-drawing car, turning wheels, scan sweep | about panel | inline SVG + CSS keyframes; draw-on triggered by `data-inview` |
| Layered parallax | about frame, why panel, work tiles | `data-parallax="0.06"` → transform on scroll |
| Line-by-line headline reveal | hero H1 | CSS clip + stagger |
| Word-by-word heading reveal | every section title | `data-split` + IntersectionObserver |
| Fade/rise reveal | most blocks | `data-reveal` (+ `data-delay="120"`) |
| Pinned 4-step scroll story | *How it works* | 400vh section, `position: sticky` |
| 3D tilt + cursor-tracking glow | service cards | `data-tilt` |
| Magnetic buttons | CTAs | `data-magnetic` |
| Animated counters | hero stats, why meters | `data-count` / `data-suffix` |
| Custom cursor, grain, scroll progress, marquee, testimonial slider, preloader | global | CSS + `main.js` |

Everything respects `prefers-reduced-motion`, and the page stays fully usable
if WebGL is unavailable (the hero falls back to animated gradient orbs).

### Adding your own animated element

- Fade in on scroll: `<div data-reveal data-delay="150">`
- Parallax: `<div data-parallax="0.08">` (negative values move the other way)
- Counter: `<b data-count="250" data-suffix="+">0</b>`

## Performance notes

- Three.js loads from CDN (`three@0.149.0`) with a second CDN as fallback.
  For an offline/self-hosted build, download `three.min.js` into `assets/js/`
  and point the `<script>` tag at it.
- The hero render loop pauses when the hero scrolls out of view.
- Pixel ratio is capped at 2; field of view widens on narrow screens.
- Total page weight right now is well under 200 KB excluding fonts and Three.js.

## Brand colours (sampled from the logo)

| Token | Hex | Use |
|---|---|---|
| `--maroon` | `#7A1F2E` | primary |
| `--maroon-deep` | `#58101C` | gradients, hovers |
| `--maroon-lift` | `#9A3243` | accents, glow |
| `--silver` | `#B9BFC4` | secondary / Arabic text |
| `--ink` | `#101216` | dark sections |
| `--paper` | `#F7F6F5` | light sections |

All defined at the top of `assets/css/style.css` — change them there and the whole page follows.
