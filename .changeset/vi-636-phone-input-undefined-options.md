---
"@loworbitstudio/visor": patch
---

VI-636: `phone-input` no longer hands `intl-tel-input` an explicit `undefined` for its two optional pass-through props.

The block spread `countrySelectorMode` and `classNames` into `<IntlTelInput>` unconditionally. v29 validates every option key it is given, and a key set to `undefined` is still an own key — so `Object.entries()` picks it up and it fails validation. A consumer that set neither prop therefore got two `console.warn` lines on every mount:

```
[intl-tel-input] Option 'classNames' must be an object; got undefined. Ignoring.
[intl-tel-input] Option 'countrySelectorMode' must be one of "OFF", "DROPDOWN", "FULLSCREEN", "AUTO"; got undefined. Ignoring.
```

Both keys are now carried on a spread object that only holds a key when the consumer actually set one. The props are omitted rather than defaulted: `countrySelectorMode` has no correct default to invent — the library's own default is `AUTO`, and hard-coding that would pin behaviour that is the library's to change.

Behaviour is unchanged. The library already ignored the invalid option and fell back to its default, so this is a console-noise fix only — but the noise landed in every consumer's console, and in one consumer's CI visual lane it was 12 warnings across a 25-test run.
