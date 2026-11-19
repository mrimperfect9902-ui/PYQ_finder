# UPSC PYQ Concept Finder

A local-first, installable web app prototype for indexing UPSC Prelims PYQ PDFs and searching extracted question text by concept.

## Run locally
Because PDF.js and service workers work best on HTTP, run a local server:
- Python: `python -m http.server 8000`
- Open `http://localhost:8000`

## Publish as a website
Upload the contents of this folder to a static host such as GitHub Pages, Netlify or Cloudflare Pages. Keep all files at the site root.

## Install on Android
1. Publish the site over HTTPS.
2. Open its URL in Chrome on Android.
3. Use Chrome menu > Install app / Add to Home screen.

This creates an installable PWA. A signed standalone APK is not included in this prototype.

## Important limitations in this first version
- PDF.js extracts selectable text; scanned PDFs need OCR and will be flagged when extraction is very limited.
- Question splitting uses numbering patterns and may need manual correction for unusual paper layouts.
- Concept expansion currently uses a starter synonym map plus keyword matching. It is not yet a trained semantic/AI retrieval system.
- Indexed data is stored in the browser's IndexedDB. It does not automatically sync between devices. Export/import the JSON backup to move data.
- This prototype does not claim an answer key is verified. Add verified answer/explanation data in a future version.

## Next development stage
Add OCR, better question-boundary detection, manual question editor, verified answer keys, richer subject taxonomy, embedding-based semantic search and optional cloud sync.
