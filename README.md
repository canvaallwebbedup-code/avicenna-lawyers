# Avicenna Lawyers — Google Ads Landing Pages

Two standalone, conversion-focused landing pages for **Avicenna Lawyers**, a boutique
multilingual law firm in Merrylands, NSW. Each page is the destination for a separate
Google Ads campaign. The single job of each page is to convert an ad click into a phone
call or form enquiry.

## Pages

| File | Campaign / audience | Tone & theme |
| --- | --- | --- |
| `criminal-traffic.html` | People charged with a **Local Court** criminal or traffic matter (traffic offences, drink/drug driving, licence appeals, AVOs, minor/first-time charges). Stressed, urgent, searching now. | Reassuring, discreet, calm. `.theme-calm` (sage / clay) |
| `corporate-commercial.html` | Business owners and directors needing commercial dispute or corporate advice. Considered, comparing firms. | Sharp, confident, commercial. `.theme-corporate` (deep navy / gold) |

**Note:** the criminal/traffic page is intentionally scoped to **Local Court matters
only** — no District Court, serious-crime, or custodial framing. Keep it that way.

## How it's built

- Static HTML/CSS/JS — **no build step**. Open the `.html` files directly to preview.
- One design-token base in `styles.css` with two theme classes (`.theme-calm`,
  `.theme-corporate`).
- Mobile-first (designed at 380px up), semantic HTML, inline SVG icons + CSS gradients
  so there are no render-blocking images.
- Accessible: skip link, labelled fields, visible focus states. FAQ works without JS.
- `main.js` handles the FAQ accordion, form validation, success/error states, a honeypot,
  and analytics hooks.

## Files

```
criminal-traffic.html      Landing Page 1
corporate-commercial.html  Landing Page 2
styles.css                 Shared tokens + two theme variants
main.js                    FAQ, form handling, tracking hooks
vercel.json                Clean-URL config for Vercel
assets/README.md           Notes on optional imagery
```

## Deployment

Hosted on **Vercel**, connected to this GitHub repo — every push to `main`
auto-deploys. `vercel.json` enables clean URLs, so pages serve at `/criminal-traffic`
and `/corporate-commercial` (no `.html`). Point Google Ads at the clean URLs.

## ⚠️ Before going live — launch checklist

These MUST be done before any paid traffic is pointed at the pages:

- [x] **Enquiry form wired to a real endpoint.** Both pages + main.js POST to the firm's
      Google Apps Script web app (no-cors); a resolved request is treated as success.
- [ ] **Fill every `[[PLACEHOLDER]]`** — phone, email, address, ABN, hours, solicitor
      names. A `tel:[[PHONE]]` link is a dead call button.
- [ ] **Add GA4 + Google Ads conversion tracking** — real Measurement ID, Ads
      Conversion ID, and conversion events on both form submit and `tel:` clicks.
- [ ] **Replace placeholder testimonials** with real Google reviews, or remove the block.
- [ ] **Verify NSW legal-advertising compliance** — no guaranteed-outcome language.
- [ ] **Re-check the criminal page** for any drift beyond Local Court scope.
