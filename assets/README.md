# assets

`IBMPlexMono-Bold-subset.ttf` is the face drawn into the Open Graph card
(`src/app/opengraph-image.tsx`). It is the same display face the site uses for
its heading, cut down to the characters the card actually shows.

Any character missing from it silently falls back to a different face, so when
the card's copy changes, rebuild the subset:

```sh
curl -sL -o /tmp/IBMPlexMono-Bold.ttf \
  "https://github.com/google/fonts/raw/main/ofl/ibmplexmono/IBMPlexMono-Bold.ttf"

pyftsubset /tmp/IBMPlexMono-Bold.ttf \
  --text="next-unused Find the files nobody imports in your Next.js project. kkweb.io src/components/Unused.tsx src/lib/old-helper.ts 2 files" \
  --unicodes="U+0020-007E,U+00A0-00FF" \
  --output-file=assets/IBMPlexMono-Bold-subset.ttf \
  --no-hinting --desubroutinize --layout-features=''
```
