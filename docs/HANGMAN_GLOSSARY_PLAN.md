# Hangman Glossary — Content Checklist

**Done.** All 24 domains across all 4 certs are authored: 197 terms total,
every domain at 8 or more (CCAO 56, CCDV 59, CCAF 41, CCAP 41). Every term
was compiled from that cert's own `lessons[].b` prose — never invented,
never sourced from memory — with hints paraphrased rather than copied at
length. `test/smoke.js` enforces the ≥8-per-domain floor and validates
shape (non-empty term/hint, valid id, in-range domain, no duplicates within
a domain) so this can't silently regress.

This glossary now powers three consumers: Glossary Hangman's word pool
(`js/11-hangman.js`), the Glossary &amp; Reference view
(`glossaryReferenceView` in `js/09-suites.js`), and — since each entry
carries a domain, and `lessonForDomain()` maps a domain to the lesson that
teaches it — a real "review in lesson" link from both of those.
