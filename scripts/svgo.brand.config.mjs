// SVGO config for the Visor default-brand SVGs (VI-469).
//
// Goals:
//  - keep `viewBox` (scalability + intrinsic aspect ratio)
//  - keep `<title>` and `role`/`aria-label` (accessibility)
//  - never touch `fill="currentColor"` on the monochrome variant (theme tinting)
//  - leave embedded base64 `<image>` data URIs intact
export default {
  multipass: true,
  js2svg: { pretty: false },
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          removeViewBox: false, // keep viewBox for scaling
          removeTitle: false, // keep <title> for a11y
          // currentColor is a keyword, not a literal color — preset-default
          // does not rewrite it, but pin these off so nothing collapses it.
          convertColors: false,
        },
      },
    },
  ],
};
