import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "@piro0919/next-unused";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

const TITLE = "next-unused";
const DESCRIPTION = "Find the files nobody imports in your Next.js project.";

export default async function Image() {
  /* 見出しの書体はサイトと同じ IBM Plex Mono。使う文字だけに絞ったものを
     同梱している。文言を変えたら assets/README.md の手順で作り直す */
  const font = await readFile(join(process.cwd(), "assets/IBMPlexMono-Bold-subset.ttf"));

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        padding: "0 80px",
        background: "#0b0b0f",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: 600,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 700,
            letterSpacing: -1,
          }}
        >
          {TITLE}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 32,
            marginTop: 28,
            lineHeight: 1.4,
            color: "#a1a1aa",
          }}
        >
          {DESCRIPTION}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            marginTop: 48,
            color: "#71717a",
          }}
        >
          kkweb.io
        </div>
      </div>

      {/* 何をするパッケージなのかを右に置く。名前と説明だけだと、
          9件が同じ絵になってタイムラインで見分けが付かない */}
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flex: 1,
          justifyContent: "center",
        }}
      >
        {/* 使われていないファイルが挙がってくる、という出力そのもの */}
        <div
          style={{
            background: "#15151c",
            border: "1px solid #26262f",
            borderRadius: 14,
            display: "flex",
            flexDirection: "column",
            padding: "22px 24px",
            width: 380,
          }}
        >
          {["src/components/Unused.tsx", "src/lib/old-helper.ts"].map((path) => (
            <div
              key={path}
              style={{
                alignItems: "center",
                color: "#f59e0b",
                display: "flex",
                fontSize: 20,
                gap: 12,
                padding: "10px 0",
              }}
            >
              <div
                style={{
                  background: "#f59e0b",
                  borderRadius: 999,
                  height: 8,
                  width: 8,
                }}
              />
              {path}
            </div>
          ))}
          <div
            style={{
              borderTop: "1px solid #26262f",
              color: "#71717a",
              display: "flex",
              fontSize: 18,
              marginTop: 10,
              paddingTop: 14,
            }}
          >
            2 files
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [{ data: font, name: "IBM Plex Mono", style: "normal", weight: 700 }],
    },
  );
}
