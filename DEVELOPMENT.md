# Poly-Clash redesign

Upstream baseline: f79338d4fedc1cace57a40f4527bddfc35947fc0.
Remote backup: backup/pre-redesign-2026-10-23. Account database: vhtaayjvgdjgxuwcvjis (matches js/config.js). No other project is in scope.

## Audit

- Static global-script application; Three.js r128 and Supabase UMD loaded from CDN. No package manifest or automated runner.
- rig.js contains detailed legacy meshes but forces a separate six-part rig to use the same noob palette for every skin. Elbow and knee animation channels target empty groups in this rig.
- game.js mixes input, simulation, network messages, bot AI and rendering. Fighter levels and weapons multiply combat stats without a cap.
- features.js purchases and app.js rewards modify client profiles. backend.js saves balances, inventory and XP directly. Existing RLS alone does not establish economic integrity.
- Multiplayer accepts peer-supplied damage and KO messages. Duel scores are local counters; no authoritative rounds or two-client verification.
- Graphics controls exist but game startup ignores their values. Regeneration starts immediately after damage. Blocking resets its parry timer each frame while inactive, allowing repeat parries.
- Existing console smoke script is manual and does not verify visuals or online authority.

## Connected stages

1. **Playable foundation:** bounded XP-based avatar stats, fighter-specific move pools and independent avatar customization, pose transitions, correct skin palettes and original clothing details, responsive movement, training modes/statistics, graphics settings and reduced motion. Automated simulation and real Chromium rendering checks.
2. **Secure economy:** transactional server purchases, immutable reward balances, server-verified match rewards; migrate legacy ownership without deleting it. Test authorization with separate accounts before enabling.
3. **Authoritative multiplayer:** trusted combat simulation, input validation and sequence IDs, duel countdown/round resets/disconnect/rematch, real two-client tests. Realtime broadcast is transport, not combat authority.
4. **Content and polish:** full customization catalog, equipment previews, original move library and sound design, cinematic choreography, emote/shop previews and owner language tools.
5. **Release gate:** desktop/mobile gameplay recordings, visual review, persistence and purchase tests against isolated accounts, security checks, measured performance. Publish only verified behavior; keep unfinished systems explicit.

## Preservation

Keep legacy character IDs, ownership arrays, levels and grants. They remain saved for compatibility but do not multiply health, damage or speed; selected fighter IDs still select move pools in the redesign. No resets, deletion, new login scheme, or changes to the inactive project. Database migrations require inspecting the deployed functions and policies first; never run the historical setup SQL against existing accounts.

## Known release blockers

Server-authoritative combat, tamper-proof rewards/purchases, duel round synchronization, complete cosmetic catalog, cinematic finishers and live two-client tests remain separate deliverables. Offline screenshots cannot validate these systems.

## Verified first release

Real Chromium with WebGL: 22 checks passed, including startup/active damage timing, movement, jump/landing, collision, cooldown, training reset, emote cancellation, avatar guest persistence, appearance independence from fighter selection, fighter-dependent move pools, graphics settings and mobile touch controls. Screenshots and recordings are in artifacts/. Supabase CDN was explicitly blocked in this isolated offline suite; online persistence, economy, owner permissions and two-client multiplayer are NOT certified by it.

## Updated product direction

The owner clarified that fighters should remain as combat styles with selectable four-move loadouts. Avatar appearance must remain independent, with free starter clothing and accessories. Diamonds will be the cosmetic-shop currency, with server-validated exchange into coins and bundles containing cosmetics, fighters and weapons. Diamond rewards and bundle pricing are not implemented in this first release. The reference videos/images have not arrived in the visible conversation.
