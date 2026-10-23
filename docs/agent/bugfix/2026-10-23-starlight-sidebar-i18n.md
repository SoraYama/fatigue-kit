> **Date / Revised**: 2026-10-23

# Starlight Chinese sidebar stayed English

## 1. Background & Problem

The Simplified Chinese documents and routes existed, but after switching to `/zh-cn/docs/`, the sidebar section and item labels still rendered in English.

## 2. Root Cause / Approach

Starlight localizes sidebar labels by calling `pickLang(translations, localeToLang(locale))`. For the `zh-cn` route configured with `lang: 'zh-CN'`, the lookup key is the BCP-47 language tag `zh-CN`, not the route key `zh-cn`. The sidebar `translations` dictionaries incorrectly used `zh-cn`, so every lookup missed and fell back to the English `label`.

Keep `zh-cn` as the URL locale key, but key every sidebar translation dictionary by `zh-CN`.

## 3. Key Changes

- `website/astro.config.mjs`: sidebar `translations` keys now use `zh-CN`; route locale remains `zh-cn`.
- `website/scripts/check-sidebar-i18n.mjs`: inspects generated Chinese HTML, requires representative Chinese labels, and rejects leaked English labels.
- `website/package.json`: runs the sidebar localization check in every website build.

## 4. Conclusions / Lessons

Starlight sidebar translation keys are language tags, not locale route directory names. When the route key and `lang` differ in case or format, use the `lang` value for `translations`. Page parity checks alone cannot verify rendered navigation localization; inspect generated localized HTML in CI.
