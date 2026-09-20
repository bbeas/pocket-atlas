# Pocket Atlas — project memory

## Visual and construction constraints (user preferences)

- The confirmed project/brand name is **Pocket Atlas**, without a leading “A”. The user accepts the name overlap with other projects. Keep page titles, UI branding and documentation consistent.

- This is a LEGO-style travel globe. Buildings should look physically assembled onto the terrain, not like rotated display plates placed over it.
- Align landmark anchors and ordinary city buildings with the underlying terrain grid as closely as the curved surface permits: use actual terrain-cell centers, face normals, and local grid axes.
- Keep ground-contact pieces on the terrain. Avoid floating foundations, arbitrary yaw of entire models, or oversized shared base plates. Decorative curves, tower braces, and temporary hover tilt are exceptions; they must return to the aligned resting pose.
- Use consistent brick dimensions and grid-compatible subdivisions. To make a landmark smaller, redesign its construction with fewer courses/pieces or a smaller footprint; do not simply reduce the whole model's scale. In particular, the Merlion must be a compact rebuild, not a miniature scaled copy.
- Preserve recognizable landmark silhouettes, studs, and existing selected/hover scatter behavior when changing models.
- Merlion direction/style: face the viewer in the selected view (local +Z), use a simplified compact brick construction rather than a highly detailed side-profile sculpture. Keep the resting model on the grid axes.
- Ordinary scenery is already seated on individual terrain cells. Preserve that behavior and verify landmark-adjacent trees/buildings too.

## Workflow

- Work in this repository (`bbeas.github.io`), not the old Documents/Codex copy.
- Preview locally on http://127.0.0.1:4173/. Do not push or deploy unless explicitly requested. Commit only when requested.
- Run the static build and verify relevant desktop/mobile interactions after visual changes.
- Keep these preferences updated when the user changes them.
- UI supports English and Chinese, defaults to English on a first visit, and remembers an explicit choice. Keep all new UI text in `src/i18n.js`; preserve stable destination IDs and existing album-city keys when translating labels.
- Top-right navigation is icon-only: a location pin opens the travel index for quick destination selection; a language icon toggles English/Chinese directly. No Explore/About text links or language select dropdown. Preserve accessible labels and keyboard focus feedback.
