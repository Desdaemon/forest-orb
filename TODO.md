# TODO: Svelte migration and feature parity

## Already migrated
- `src/routes/+page.svelte`: app shell, game canvas mounting, theme, chat + modals.
- `src/lib/modalStore.ts`: modal stack and navigation.
- `src/lib/components/ModalContainer.svelte`: central modal router.
- `src/lib/components/modals/BadgePickerModal.svelte`: full-screen badge picker.
- `src/lib/components/modals/BadgesModal.svelte`: full badge gallery, filters, tabs, virtual scroll.
- `src/lib/components/modals/LocationsModal.svelte`.
- `src/lib/components/modals/CommunityScreenshotsModal.svelte`.
- `src/lib/components/modals/SchedulesModal.svelte`.
- `src/lib/components/modals/RankingsModal.svelte`.
- `src/lib/badgeStore.ts` + `src/lib/api.ts`

## Untouched / legacy to migrate from `index.php` + `badges.js`
- Recreate complete badge modal behavior:
  - `badgeGameTabs` + `badgeCategoryTabs` group logic
  - filters: unlock status, sort order, search + query-specific behavior
  - `setBadge()` and preview selected behavior in UI state
  - badge overlay effects (using classed mask/dual types)
  - row/column progress bars, remove mode, presets (badgeGalleryModal + badgePresetModal)
- Migrate all modals from HTML to Svelte:
  - blocklist, chat settings, screenshot settings, notification settings, cache, account, password, events, rankings, etc.
- Replace direct DOM mutation and query selectors with Svelte reactivity and stores.
- Unify i18n translation (`data-i18n`) into Svelte i18n approach.
- Ensure keyboard / a11y semantics:
  - tabs as `<button>`
  - grid items as `<button>` for click events
- Remove unused `play.css` / duplicated styles; keep modal theme variables.

## Next action
1. Finish `BadgesModal.svelte` implementation to match legacy logic exactly.
2. Add unit/integration tests for modal behavior, badge setting, filter / tab flows.
3. Validate manual flows in browser: badge picker -> set badge -> show in header.
4. Use `npm run build && npm run preview` for final QA.
