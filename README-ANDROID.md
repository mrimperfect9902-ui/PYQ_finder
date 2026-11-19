# UPSC PYQ Concept Finder — Android APK project

This wraps the existing local-first web prototype in an Android WebView and includes a GitHub Actions workflow that builds a debug APK.

## Build in GitHub
1. Upload the **contents** of this folder into the root of your GitHub repository (keep the `.github/workflows/build-apk.yml` path).
2. Open the repository's **Actions** tab.
3. Select **Build Android APK** and tap **Run workflow** (or push changes to `main`).
4. Open the completed workflow run, then download the artifact named `UPSC-PYQ-Finder-debug-apk`.
5. Extract the artifact ZIP on Android and install `app-debug.apk`. If Android asks, allow Chrome/Files to install unknown apps.

## Notes
- This is a debug APK for personal testing, not a Play Store release.
- PDF.js is loaded from its existing CDN URL, so PDF text extraction requires internet access.
- Imported PDFs and indexed questions are stored locally by the web app; they are not uploaded to GitHub.
- The prototype currently extracts selectable PDF text. Scanned PDFs require OCR.
