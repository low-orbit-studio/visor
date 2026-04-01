# W007: intl-tel-input Focus Loss Prevention

## Symptom

Phone input field loses focus immediately after typing a single digit.

## Root Cause

When `handleChange` (passed to intl-tel-input event listeners) is created with `useCallback` depending on `onChange`, and the initialization `useEffect` depends on `handleChange`:

1. User types a digit
2. `handleChange` fires → calls `onChange(number, isValid)`
3. Parent updates state → re-renders → new `onChange` reference
4. `handleChange` recreates (useCallback dependency changed)
5. useEffect re-runs → intl-tel-input destroys and recreates
6. **Input loses focus**

## Solution

Store callbacks in refs. The `handleChange` function reads from refs instead of closing over props:

```tsx
const onChangeRef = useRef(onChange);
useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

const handleChange = useCallback(() => {
  onChangeRef.current?.(number, isValid); // reads from ref
}, []); // empty deps — never recreates
```

This ensures:
- `handleChange` never changes (empty dependency array)
- The initialization useEffect never re-runs due to callback changes
- The latest callback is always invoked via the ref

## Key Principle

When wrapping third-party libraries that manage their own DOM, never include callback props in useCallback dependencies for handlers used in initialization effects. Use the "latest ref" pattern instead.

## Origin

Ported from Blacklight (`~/Code/blacklight/docs/wisdom/phone_input_focus.md`). Original fix applied after discovering the cycle in production.
