import React from "react";
import { AbsoluteFill } from "remotion";

export type NoteImageId =
  | "top"
  | "compoundFlow"
  | "projectionTable"
  | "breakdown"
  | "growthChart"
  | "startSmall"
  | "checkpoints"
  | "summary";

export interface GenzMoneyNoteImageProps {
  imageId?: NoteImageId;
}

const c = {
  green: "#0A8F5A",
  green2: "#11B87A",
  mint: "#E6F5EF",
  mint2: "#F3FBF7",
  dark: "#1B252B",
  muted: "#5D6B66",
  line: "#B9DED1",
  yellow: "#F5C84B",
  blue: "#2F80ED",
  red: "#E85B5B",
  white: "#FFFFFF",
};

const font = `"Noto Sans JP", "Yu Gothic", "Meiryo", sans-serif`;

const Deco = () => (
  <>
    <div
      style={{
        position: "absolute",
        right: -80,
        top: -90,
        width: 290,
        height: 290,
        borderRadius: "50%",
        background: "#DFF2EA",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: -90,
        bottom: -110,
        width: 330,
        height: 330,
        borderRadius: "50%",
        background: "#EEF8F4",
      }}
    />
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={`dot-a-${i}`}
        style={{
          position: "absolute",
          left: 740 + i * 18,
          top: 34,
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "#B7D8CC",
        }}
      />
    ))}
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={`dot-b-${i}`}
        style={{
          position: "absolute",
          right: 54,
          top: 458 + i * 18,
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "#C7E4DA",
        }}
      />
    ))}
    {[
      { left: 690, top: 64 },
      { left: 1010, top: 54 },
      { left: 540, top: 404 },
      { left: 1110, top: 248 },
    ].map((p, i) => (
      <div
        key={`plus-${i}`}
        style={{
          position: "absolute",
          ...p,
          color: "#89C9B0",
          fontSize: 28,
          fontWeight: 900,
        }}
      >
        +
      </div>
    ))}
  </>
);

const Canvas: React.FC<{ children: React.ReactNode; footer?: string }> = ({ children, footer }) => (
  <AbsoluteFill
    style={{
      width: 1280,
      height: 720,
      background: `linear-gradient(135deg, ${c.white} 0%, ${c.mint2} 100%)`,
      fontFamily: font,
      color: c.dark,
      overflow: "hidden",
    }}
  >
    <Deco />
    <div style={{ position: "absolute", inset: 0, padding: 34 }}>{children}</div>
    {footer ? (
      <div
        style={{
          position: "absolute",
          left: 34,
          right: 34,
          bottom: 22,
          height: 48,
          borderRadius: 18,
          background: "rgba(10,143,90,0.08)",
          border: `1px solid ${c.line}`,
          display: "flex",
          alignItems: "center",
          padding: "0 22px",
          gap: 12,
          fontSize: 19,
          color: c.muted,
          fontWeight: 700,
        }}
      >
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: c.green,
            color: c.white,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
          }}
        >
          i
        </span>
        <span style={{ lineHeight: 1.25, whiteSpace: "nowrap" }}>{footer}</span>
      </div>
    ) : null}
  </AbsoluteFill>
);

const Pill: React.FC<{ children: React.ReactNode; width?: number }> = ({ children, width }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width,
      minHeight: 44,
      padding: "0 24px",
      borderRadius: 999,
      background: `linear-gradient(135deg, ${c.green}, ${c.green2})`,
      color: c.white,
      fontSize: 25,
      fontWeight: 900,
      letterSpacing: 1,
      boxShadow: "0 10px 22px rgba(10,143,90,0.18)",
    }}
  >
    {children}
  </div>
);

const H1: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 62 }) => (
  <div style={{ fontSize: size, lineHeight: 1.14, fontWeight: 900, letterSpacing: -1.5 }}>
    {children}
  </div>
);

const Em: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = c.green }) => (
  <span style={{ color, fontWeight: 900 }}>{children}</span>
);

const Card: React.FC<{
  children: React.ReactNode;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  border?: string;
  bg?: string;
}> = ({ children, x, y, w, h, border = c.line, bg = "rgba(255,255,255,0.86)" }) => (
  <div
    style={{
      position: x == null || y == null ? "relative" : "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: 22,
      border: `2px solid ${border}`,
      background: bg,
      boxShadow: "0 14px 30px rgba(20,80,55,0.08)",
      padding: 22,
    }}
  >
    {children}
  </div>
);

const CheckBullet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, fontWeight: 800, marginTop: 15 }}>
    <span
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: c.green,
        color: c.white,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 21,
        fontWeight: 900,
      }}
    >
      ✓
    </span>
    <span>{children}</span>
  </div>
);

const MoneyIcon = ({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: `scale(${scale})`,
      transformOrigin: "top left",
    }}
  >
    <div
      style={{
        width: 138,
        height: 88,
        borderRadius: 14,
        background: `linear-gradient(135deg, ${c.green}, #75C7A7)`,
        transform: "rotate(-9deg)",
        boxShadow: "0 16px 30px rgba(10,143,90,0.20)",
      }}
    >
      <div style={{ position: "absolute", left: 18, top: 20, color: c.white, fontSize: 34, fontWeight: 900 }}>¥</div>
      <div style={{ position: "absolute", right: 18, bottom: 18, color: c.white, fontSize: 18, fontWeight: 800 }}>
        NISA
      </div>
    </div>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: 96 + i * 34,
          top: 58 + i * 9,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${c.yellow}, #FFE189)`,
          border: "3px solid #E4B63A",
          color: c.green,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 27,
          fontWeight: 900,
          boxShadow: "0 8px 18px rgba(180,130,20,0.18)",
        }}
      >
        P
      </div>
    ))}
  </div>
);

const PhoneVisual = () => (
  <div style={{ position: "absolute", right: 112, top: 72, width: 250, height: 420 }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 42,
        border: `9px solid ${c.green}`,
        background: c.white,
        boxShadow: "0 22px 48px rgba(10,143,90,0.18)",
        transform: "rotate(7deg)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 12,
          width: 94,
          height: 18,
          borderRadius: 999,
          background: c.green,
        }}
      />
      <div style={{ position: "absolute", top: 82, left: 34, right: 34, textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            padding: "8px 20px",
            borderRadius: 999,
            background: c.green,
            color: c.white,
            fontSize: 22,
            fontWeight: 900,
          }}
        >
          複利
        </div>
        <div style={{ marginTop: 28, color: c.green, fontSize: 58, fontWeight: 900, lineHeight: 1 }}>2,500</div>
        <div style={{ color: c.green, fontSize: 25, fontWeight: 900 }}>万円</div>
        <div style={{ margin: "26px auto 0", width: 150, height: 18, borderRadius: 999, background: c.mint }}>
          <div style={{ width: 64, height: 18, borderRadius: 999, background: c.blue }} />
        </div>
        <div style={{ margin: "12px auto 0", width: 150, height: 18, borderRadius: 999, background: c.green }} />
      </div>
    </div>
  </div>
);

const TopImage = () => (
  <Canvas footer="本記事は情報提供を目的としており、特定の商品をすすめるものではありません。投資にはリスクがあります。">
    <Pill>完全ガイド</Pill>
    <div style={{ marginTop: 24 }}>
      <H1 size={58}>
        月3万円を30年続けると
        <br />
        <Em>約2,500万円</Em>？
      </H1>
    </div>
    <div style={{ marginTop: 18, fontSize: 33, fontWeight: 900 }}>
      複利の考え方と注意点をやさしく解説
    </div>
    <div style={{ display: "flex", gap: 14, marginTop: 24 }}>
      <div
        style={{
          padding: "14px 24px",
          borderRadius: 18,
          background: c.mint,
          fontSize: 23,
          fontWeight: 900,
          color: c.green,
        }}
      >
        20代・初心者向け
      </div>
      <div
        style={{
          padding: "14px 24px",
          borderRadius: 18,
          background: "rgba(255,255,255,0.9)",
          border: `1px solid ${c.line}`,
          fontSize: 22,
          fontWeight: 800,
        }}
      >
        試算の中身とリスクも確認
      </div>
    </div>
    <div style={{ marginTop: 24 }}>
      <CheckBullet>
        元本 <Em color={c.blue}>1,080万円</Em> と増えた分 <Em>約1,420万円</Em>
      </CheckBullet>
      <CheckBullet>10年・20年・30年で差の広がりを確認</CheckBullet>
      <CheckBullet>月1,000円からでも続けられる金額でOK</CheckBullet>
    </div>
    <MoneyIcon x={670} y={390} scale={1.06} />
    <PhoneVisual />
    <div
      style={{
        position: "absolute",
        right: 28,
        top: 46,
        width: 154,
        height: 154,
        borderRadius: "50%",
        background: "#FFFBEA",
        border: "2px dashed #DCCB7D",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: c.green,
        fontWeight: 900,
        fontSize: 21,
        lineHeight: 1.45,
      }}
    >
      試算は
      <br />
      一例です
    </div>
    <div
      style={{
        position: "absolute",
        left: 34,
        right: 34,
        bottom: 88,
        height: 70,
        borderRadius: 20,
        background: "rgba(255,255,255,0.9)",
        border: `1px solid ${c.line}`,
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        overflow: "hidden",
      }}
    >
      {["複利の仕組み", "2,500万円の中身", "差の広がり", "少額からOK", "注意点"].map((text, i) => (
        <div
          key={text}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            borderRight: i < 4 ? `1px dashed ${c.line}` : undefined,
            fontSize: 19,
            fontWeight: 900,
          }}
        >
          <span style={{ color: c.green, fontSize: 26 }}>●</span>
          {text}
        </div>
      ))}
    </div>
  </Canvas>
);

const CompoundFlow = () => (
  <Canvas footer="複利は、増えた分も次の運用に回るという考え方です。">
    <Pill>ステップ1</Pill>
    <H1 size={49}>
      複利の基本イメージ
      <br />
      <Em>増えた分も、次に働く</Em>
    </H1>
    <div style={{ position: "absolute", left: 72, top: 230, right: 72, height: 330 }}>
      {[
        { title: "1年目", main: "元本", sub: "まず運用する", x: 0, h: 68 },
        { title: "2年目", main: "元本 + 増えた分", sub: "合計が次の元本", x: 370, h: 116 },
        { title: "3年目", main: "さらに増えた分も合流", sub: "後半ほど差が広がりやすい", x: 740, h: 178 },
      ].map((step, i) => (
        <div key={step.title}>
          <Card x={step.x} y={0} w={310} h={180} border={i === 0 ? c.blue : c.green}>
            <div style={{ color: c.green, fontSize: 24, fontWeight: 900 }}>{step.title}</div>
            <div style={{ marginTop: 20, fontSize: 32, fontWeight: 900 }}>{step.main}</div>
            <div style={{ marginTop: 12, fontSize: 20, color: c.muted, fontWeight: 700 }}>{step.sub}</div>
          </Card>
          <div
            style={{
              position: "absolute",
              left: step.x + 102,
              top: 236,
              width: 106,
              height: step.h,
              borderRadius: 18,
              background: `linear-gradient(180deg, ${c.green2}, ${c.green})`,
              boxShadow: "0 14px 26px rgba(10,143,90,0.18)",
            }}
          />
        </div>
      ))}
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 330 + i * 370,
            top: 70,
            color: c.green,
            fontSize: 54,
            fontWeight: 900,
          }}
        >
          →
        </div>
      ))}
      <div style={{ position: "absolute", left: 16, top: 194, fontSize: 24, fontWeight: 900 }}>
        繰り返すほど、増えた分も次の運用に回っていく
      </div>
    </div>
  </Canvas>
);

const ProjectionTable = () => (
  <Canvas footer="毎月3万円を積み立て、年率5%で運用できたと仮定した単純試算です。">
    <Pill>試算表</Pill>
    <H1 size={47}>
      月3万円 × 30年
      <br />
      <Em>10年・20年・30年で見ると</Em>
    </H1>
    <div
      style={{
        position: "absolute",
        left: 56,
        right: 56,
        top: 220,
        borderRadius: 28,
        overflow: "hidden",
        border: `2px solid ${c.line}`,
        background: c.white,
        boxShadow: "0 18px 40px rgba(20,80,55,0.08)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "0.8fr 1.3fr 1.4fr 1.15fr",
          background: c.green,
          color: c.white,
          fontSize: 25,
          fontWeight: 900,
        }}
      >
        {["期間", "積み立てた元本", "試算上の評価額", "元本との差"].map((h) => (
          <div key={h} style={{ padding: "18px 22px", borderRight: "1px solid rgba(255,255,255,0.25)" }}>
            {h}
          </div>
        ))}
      </div>
      {[
        ["10年", "360万円", "約466万円", "約106万円"],
        ["20年", "720万円", "約1,230万円", "約510万円"],
        ["30年", "1,080万円", "約2,500万円", "約1,420万円"],
      ].map((row, r) => (
        <div
          key={row[0]}
          style={{
            display: "grid",
            gridTemplateColumns: "0.8fr 1.3fr 1.4fr 1.15fr",
            background: r === 2 ? "#F0FBF6" : c.white,
            fontSize: r === 2 ? 34 : 30,
            fontWeight: 900,
            color: r === 2 ? c.green : c.dark,
            borderTop: `1px solid ${c.line}`,
          }}
        >
          {row.map((cell, i) => (
            <div
              key={`${row[0]}-${cell}`}
              style={{
                padding: r === 2 ? "25px 22px" : "23px 22px",
                borderRight: i < 3 ? `1px solid ${c.line}` : undefined,
                textAlign: i === 0 ? "center" : "right",
              }}
            >
              {cell}
            </div>
          ))}
        </div>
      ))}
    </div>
    <div
      style={{
        position: "absolute",
        right: 70,
        top: 108,
        padding: "14px 22px",
        borderRadius: 999,
        background: "#FFFBEA",
        border: "2px solid #EAD572",
        color: c.muted,
        fontSize: 22,
        fontWeight: 900,
      }}
    >
      手数料・税金・値動きは未反映
    </div>
  </Canvas>
);

const Breakdown = () => (
  <Canvas footer="約2,500万円は、元本と運用で増えた分を分けて見ると理解しやすくなります。">
    <Pill>ステップ2</Pill>
    <H1 size={49}>
      約2,500万円の
      <Em>中身</Em>
    </H1>
    <div style={{ position: "absolute", left: 96, top: 220, width: 1088 }}>
      <div
        style={{
          height: 90,
          borderRadius: 24,
          overflow: "hidden",
          border: `2px solid ${c.line}`,
          display: "flex",
          boxShadow: "0 16px 34px rgba(20,80,55,0.10)",
        }}
      >
        <div style={{ width: "43.2%", background: `linear-gradient(135deg, ${c.blue}, #7BB6FF)` }} />
        <div style={{ width: "56.8%", background: `linear-gradient(135deg, ${c.green2}, ${c.green})` }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 28 }}>
        <Card border={c.blue}>
          <div style={{ color: c.blue, fontSize: 27, fontWeight: 900 }}>積み立てた元本</div>
          <div style={{ marginTop: 14, fontSize: 54, color: c.blue, fontWeight: 900 }}>1,080万円</div>
        </Card>
        <Card border={c.green}>
          <div style={{ color: c.green, fontSize: 27, fontWeight: 900 }}>運用で増えた分</div>
          <div style={{ marginTop: 14, fontSize: 54, color: c.green, fontWeight: 900 }}>約1,420万円</div>
        </Card>
      </div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, marginTop: 32 }}>
        <span style={{ fontSize: 48, color: c.blue, fontWeight: 900 }}>1,080万円</span>
        <span style={{ fontSize: 50, color: c.yellow, fontWeight: 900 }}>+</span>
        <span style={{ fontSize: 48, color: c.green, fontWeight: 900 }}>約1,420万円</span>
        <span style={{ fontSize: 50, color: c.muted, fontWeight: 900 }}>=</span>
        <span style={{ fontSize: 56, color: c.green, fontWeight: 900 }}>約2,500万円</span>
      </div>
    </div>
  </Canvas>
);

const GrowthChart = () => {
  const x = (year: number) => 100 + (year / 30) * 1000;
  const y = (value: number) => 360 - (value / 2500) * 260;
  const total = [
    [0, 0],
    [10, 466],
    [20, 1230],
    [30, 2500],
  ];
  const principal = [
    [0, 0],
    [10, 360],
    [20, 720],
    [30, 1080],
  ];
  const points = (arr: number[][]) => arr.map(([year, value]) => `${x(year)},${y(value)}`).join(" ");
  return (
    <Canvas footer="実際の値動きは上下します。ここでは複利のイメージをつかむための単純試算です。">
      <Pill>ステップ3</Pill>
      <H1 size={47}>
        後半ほど
        <Em>差が広がりやすい</Em>
      </H1>
      <svg width="1160" height="430" viewBox="0 0 1160 430" style={{ position: "absolute", left: 60, top: 190 }}>
        {[0, 625, 1250, 1875, 2500].map((v) => (
          <g key={v}>
            <line x1="80" x2="1100" y1={y(v)} y2={y(v)} stroke="#D6E9E2" strokeDasharray="7 7" />
            <text x="30" y={y(v) + 7} fontFamily={font} fontSize="20" fill={c.muted} fontWeight="700">
              {v.toLocaleString()}
            </text>
          </g>
        ))}
        <polyline points={points(principal)} fill="none" stroke={c.blue} strokeWidth="6" strokeDasharray="12 10" />
        <polyline points={points(total)} fill="none" stroke={c.green} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        {[0, 10, 20, 30].map((year) => (
          <g key={year}>
            <line x1={x(year)} x2={x(year)} y1="360" y2="374" stroke={c.muted} />
            <text x={x(year)} y="405" textAnchor="middle" fontFamily={font} fontSize="23" fill={c.muted} fontWeight="800">
              {year}年
            </text>
          </g>
        ))}
        {total.slice(1).map(([year, value], i) => (
          <g key={year}>
            <circle cx={x(year)} cy={y(value)} r="15" fill={c.yellow} stroke={c.white} strokeWidth="5" />
            <rect
              x={x(year) - (i === 2 ? 72 : 62)}
              y={y(value) - 58}
              width={i === 2 ? 144 : 124}
              height="38"
              rx="19"
              fill="#FFFBEA"
              stroke="#EAD572"
            />
            <text
              x={x(year)}
              y={y(value) - 31}
              textAnchor="middle"
              fontFamily={font}
              fontSize="21"
              fill={c.green}
              fontWeight="900"
            >
              {year === 10 ? "約466万円" : year === 20 ? "約1,230万円" : "約2,500万円"}
            </text>
          </g>
        ))}
        <rect x="665" y="18" width="205" height="44" rx="22" fill="#EFF8F4" stroke={c.line} />
        <line x1="690" x2="730" y1="40" y2="40" stroke={c.blue} strokeWidth="5" strokeDasharray="10 8" />
        <text x="744" y="49" fontFamily={font} fontSize="22" fill={c.muted} fontWeight="800">
          積立元本
        </text>
        <rect x="888" y="18" width="155" height="44" rx="22" fill="#EFF8F4" stroke={c.line} />
        <line x1="912" x2="952" y1="40" y2="40" stroke={c.green} strokeWidth="7" />
        <text x="968" y="49" fontFamily={font} fontSize="22" fill={c.green} fontWeight="900">
          合計
        </text>
      </svg>
    </Canvas>
  );
};

const StartSmall = () => (
  <Canvas footer="金額の大きさより、生活費と分けて無理なく続けられる形を優先します。">
    <Pill>ステップ4</Pill>
    <H1 size={49}>
      大きな金額じゃなくても
      <br />
      <Em>続けられる金額からでOK</Em>
    </H1>
    <div style={{ position: "absolute", left: 88, right: 88, top: 244 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {[
          ["月1,000円", "まず慣れる"],
          ["月5,000円", "続けられるか確認"],
          ["月1万円", "家計に合わせて見直す"],
        ].map(([amount, sub]) => (
          <Card key={amount} h={150} border={c.green}>
            <div style={{ color: c.green, fontSize: 42, fontWeight: 900, textAlign: "center" }}>{amount}</div>
            <div style={{ marginTop: 12, color: c.muted, fontSize: 22, fontWeight: 800, textAlign: "center" }}>{sub}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 28, color: c.green, fontSize: 58, fontWeight: 900 }}>
        ↓
      </div>
      <Card border={c.green} bg="#F0FBF6">
        <div style={{ textAlign: "center", color: c.green, fontSize: 43, fontWeight: 900 }}>
          続けられる金額を選ぶ
        </div>
      </Card>
    </div>
  </Canvas>
);

const Checkpoints = () => (
  <Canvas footer="試算は一例です。利益保証ではなく、値動きや下落、元本割れの可能性があります。">
    <Pill>ステップ5</Pill>
    <H1 size={49}>
      この数字を見る前に
      <br />
      <Em>確認したいこと</Em>
    </H1>
    <div style={{ position: "absolute", left: 78, right: 78, top: 218, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
      {[
        ["この数字は一例", c.blue],
        ["手数料は未反映", c.blue],
        ["値動き・下落あり", c.red],
        ["利益保証ではない", c.red],
        ["生活費とは分ける", c.green],
      ].map(([text, color], i) => (
        <div
          key={text}
          style={{
            gridColumn: i === 4 ? "1 / span 2" : undefined,
            height: 82,
            borderRadius: 20,
            border: `2px solid ${color}`,
            background: i === 4 ? "#F0FBF6" : "rgba(255,255,255,0.88)",
            display: "flex",
            alignItems: "center",
            padding: "0 28px",
            gap: 18,
            boxShadow: "0 12px 24px rgba(20,80,55,0.07)",
          }}
        >
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: color,
              color: c.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            ✓
          </span>
          <span style={{ fontSize: 31, fontWeight: 900 }}>{text}</span>
        </div>
      ))}
    </div>
  </Canvas>
);

const Summary = () => (
  <Canvas footer="複利は大きな数字だけで判断せず、続けられる設計とリスク確認をセットで考えます。">
    <Pill>まとめ</Pill>
    <H1 size={50}>
      複利は「すごい数字」より
      <br />
      <Em>続ける設計</Em> が大事
    </H1>
    <div style={{ position: "absolute", left: 72, right: 72, top: 245, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
      {[
        ["1", "複利は時間で効く", "短期間で一気に増える魔法ではありません"],
        ["2", "金額より継続設計", "月1,000円でも続けられる形から"],
        ["3", "試算は一例", "値動き・下落・元本割れの可能性も確認"],
      ].map(([num, title, body]) => (
        <Card key={num} h={255} border={num === "3" ? c.red : c.green}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: num === "3" ? c.red : c.green,
              color: c.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 27,
              fontWeight: 900,
            }}
          >
            {num}
          </div>
          <div style={{ marginTop: 24, fontSize: 30, lineHeight: 1.25, fontWeight: 900 }}>{title}</div>
          <div style={{ marginTop: 18, fontSize: 21, lineHeight: 1.55, color: c.muted, fontWeight: 700 }}>{body}</div>
        </Card>
      ))}
    </div>
  </Canvas>
);

const views: Record<NoteImageId, React.FC> = {
  top: TopImage,
  compoundFlow: CompoundFlow,
  projectionTable: ProjectionTable,
  breakdown: Breakdown,
  growthChart: GrowthChart,
  startSmall: StartSmall,
  checkpoints: Checkpoints,
  summary: Summary,
};

export const GenzMoneyNoteImage: React.FC<GenzMoneyNoteImageProps> = ({ imageId = "top" }) => {
  const View = views[imageId] ?? TopImage;
  return <View />;
};
