# Pocket Atlas

**English** · [简体中文](README.zh-CN.md)

A personal travel journal built around an interactive, LEGO-style globe.

[Explore the live site](https://bbeas.github.io/pocket-atlas/)

## Run locally

Requires Node.js 18+, npm and Python 3. There are currently no npm dependencies to install.

```sh
npm start
```

Open http://127.0.0.1:4173/. The server reads directly from `src/`; refresh after editing. There is no hot reload. Stop an existing preview before starting another server on the same port.

```sh
npm test
npm run build
npm run preview
```

The build creates `dist/`. The preview command serves that output on the same port, so stop the development server first. These npm commands do not push or deploy anything.

## Project structure

- `src/index.html`: page layout, procedural Three.js models and globe interactions.
- `src/antarctica-coastline.js`: Antarctic coastline data.
- `src/travel-ui.js` and `src/travel-ui.css`: destination menu, album panel and photo viewer.
- `src/destination-policy.js`: separates album destinations from hover-only discoveries.
- `src/albums.json`: photo lists grouped by destination and city.
- `src/i18n.js`: English/Chinese strings, place names and language preferences.
- `scripts/*.test.mjs`: language, destination-policy and project-path tests.
- `scripts/build.mjs`: copies public files from `src/` into `dist/` and creates `.nojekyll`.
- `.github/workflows/pages.yml`: GitHub Pages build and deployment.
- `dist/`: generated static site; excluded from Git.

## Features and implementation

Vanilla JavaScript and Three.js 0.164.1, loaded from jsDelivr through an import map. Fonts use Google Fonts, so the initial load requires access to these external services. There is no React, backend, database or photo-upload service.

- Instanced terrain and ordinary buildings, with grid-aligned landmark anchors and nearby scenery.
- Randomized landmark hover height, small tilts and scattered bricks that reassemble when the pointer leaves.
- Select a destination to rotate and zoom the globe, then open a desktop sidebar or mobile bottom sheet.
- The selected landmark stays scattered; other visible travel destinations remain interactive. Dragging does not accidentally open an album.
- **Travel Trails** provides quick navigation. Japan groups Tokyo and Osaka; the United Kingdom groups London and Edinburgh.
- Shanghai is a hover-only Easter egg: its tooltip and animation remain, but it has no menu entry or album. New York and Cairo are decorative.
- Japan uses Tokyo Tower; Singapore uses a compact, front-facing brick Merlion with a mane, open mouth, water stream and curled tail. Its size comes from fewer brick courses, not uniform model scaling.
- Cream, mint and yellow flat-card UI with fine outlines and a subtle grid.
- Thumbnail gallery, full-size viewer and previous/next arrow-key navigation. Escape closes the viewer first, then the album and restores the overview.
- In portrait mobile overview, the globe surface occupies approximately 60% of the screen height; horizontal cropping is intentional.

Long-term visual and construction constraints are documented in `AGENTS.md`. Preserve the terrain-grid alignment and physically assembled brick appearance.

## Languages

English is the primary language for documentation, code comments, metadata and default UI copy unless explicitly marked otherwise.

- `README.md` is the default English documentation; [README.zh-CN.md](README.zh-CN.md) is the Chinese version. The links at the top of both files switch between them.
- The top-right language icon toggles English and Chinese directly. First visits default to English; an explicit selection is remembered in `localStorage`.
- Switching languages preserves the globe view, selected destination and city.
- New UI strings belong in `src/i18n.js`, with English entries first and Chinese translations in the `zh` dictionary.
- Existing Chinese city keys in `albums.json` and the destination definitions are stable data identifiers, not the default display language. Keep them unchanged for compatibility.
- Explicit translations, language-test fixtures, proper names and user-written photo captions may retain their original language.

Run all checks with `npm test`, or only language checks with `node --test scripts/i18n.test.mjs`.

## Add photos

All albums are currently empty; sample stock photos are not presented as personal travel records.

**Add Photos** lets visitors select images on desktop or mobile and save them in this browser's IndexedDB, separately for each destination/city. Adding more photos appends to the album, and saved photos survive reloads. Open an added photo to remove it from the local album; the original file is untouched.

Photos are never uploaded, written to the repository or synced between devices. Clearing site data, private browsing or browser storage eviction can remove them: keep your originals. Localhost and the published website have separate storage. IndexedDB is scoped to the origin, not an authentication boundary between projects on the same domain.

Images are optimized to a maximum 1920px edge with 480px thumbnails before saving. Supported formats are JPEG, PNG, WebP and AVIF, up to 25 MB per input file and 10 photos per city (including published photos). HEIC/HEIF works only if the browser can decode it; otherwise export as JPEG. Storage and decode failures are reported without replacing existing photos.

To publish photos, put optimized images in `src/photos/<destination>/` and update the matching entry in `src/albums.json`. For example, the Paris entry can contain:

```json
{
  "paris": {
    "cities": {
      "巴黎": [
        {
          "src": "./photos/paris/seine.webp",
          "thumbnail": "./photos/paris/seine-thumb.webp",
          "caption": {
            "en": "An evening by the Seine",
            "zh": "塞纳河畔的傍晚"
          }
        }
      ]
    }
  }
}
```

Keep the existing city key (`巴黎` in this example). The UI translates its display label.

- `thumbnail` is optional; without it the original image is used. Separate thumbnails reduce bandwidth.
- `caption` accepts a plain string, displayed as written, or an object with `en` and `zh`. Missing translations fall back to the other language; captions are not automatically translated.
- Image paths are relative to `src/` and retain the same structure after building. Visitor-added local photos are not included in the build.
- Compress photos and remove any EXIF metadata you do not want to publish. Everything under `src/` becomes public site content: do not store original-image backups, credentials or private files there.

## GitHub Pages

- Repository: [bbeas/pocket-atlas](https://github.com/bbeas/pocket-atlas)
- Site: [bbeas.github.io/pocket-atlas/](https://bbeas.github.io/pocket-atlas/)
- Development and deployment branch: `dev`
- Active local workspace: `/Users/beibei/workdir/pocket-atlas`

Pages is already configured to use **GitHub Actions**. Pushing `dev` automatically runs tests, builds the site and deploys `dist/`. The workflow uses Node.js 24 and can also be run manually on `dev` from the Actions tab.

### Update the site

After reviewing and committing your changes:

```sh
git push origin dev
```

Check **Deploy Pocket Atlas to GitHub Pages** in the repository's Actions tab. A successful deployment updates the site.

### Initial setup for a new repository

1. In **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**.
2. Commit the project and workflow, then push `dev` with `git push -u origin dev`. This uploads the code and the branch's full history.
3. If the `github-pages` environment restricts deployment branches, allow `dev` under **Settings → Environments → github-pages**.
4. Check the workflow run. If it ran before Pages was enabled, rerun it after configuring Pages. Manual workflow dispatch requires the workflow to be on the default branch.

Only the static build output is uploaded as the Pages artifact, not repository metadata or development scripts. The website is public. Upload `dist/` directly; do not wrap it in another `pocket-atlas/` directory. Use relative `./...` asset and photo URLs rather than root-relative `/...` paths. No hash router is required.

This project does not take over `https://bbeas.github.io/`. The original `bbeas.github.io` repository, local copy and Pages settings remain unchanged.

## Migration and attribution

The migration preserved the original `dev` history and did not introduce React. Legacy CRA, Bootstrap, contact-route and September experiment code was backed up and moved out of the working tree. Old dependencies are no longer needed.

Antarctic coastline data is derived from Natural Earth's `ne_110m_admin_0_countries.geojson`; see the source comments in `src/antarctica-coastline.js`.
