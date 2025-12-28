import { NextResponse } from "next/server";

type RecommendRequest = {
  relationship: string; // 跟收禮人關係
  occasion: string;     // 場合
  budget: string;       // 預算
  interests?: string;   // 興趣（選填）
  impression?: string;  // 你的印象（選填）
};

type GiftIdea = {
  title: string;
  reason: string;
  priceRange: string;
  tags: string[];
};

type RecommendResponse = {
  profileTags: string[];
  styleRadar: {
    practical: number;
    romantic: number;
    trendy: number;
    cute: number;
    minimal: number;
  };
  gifts: GiftIdea[];
  card: {
    short: string;
    long: string;
  };
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export async function POST(req: Request) {
  const body = (await req.json()) as RecommendRequest;

  const relationship = (body.relationship || "").trim();
  const occasion = (body.occasion || "").trim();
  const budget = (body.budget || "").trim();
  const interests = (body.interests || "").trim();
  const impression = (body.impression || "").trim();

  if (!relationship || !occasion || !budget) {
    return NextResponse.json(
      { error: "relationship / occasion / budget 為必填" },
      { status: 400 }
    );
  }

  // --- Mock：根據輸入做一些「看起來有在分析」的變化 ---
  const text = `${relationship} ${occasion} ${budget} ${interests} ${impression}`.toLowerCase();

  const score = {
    practical: clamp01((text.includes("實用") ? 0.8 : 0.45) + (text.includes("工程") ? 0.15 : 0)),
    romantic: clamp01((text.includes("情人") || text.includes("告白")) ? 0.85 : 0.35),
    trendy: clamp01((text.includes("潮") || text.includes("時尚") || text.includes("日系")) ? 0.8 : 0.4),
    cute: clamp01((text.includes("可愛") || text.includes("毛") || text.includes("療癒")) ? 0.8 : 0.35),
    minimal: clamp01((text.includes("極簡") || text.includes("黑白") || text.includes("質感")) ? 0.8 : 0.45),
  };

  const profileTags = [
    relationship.includes("同學") ? "同儕友誼" : "關係親密度可調",
    occasion,
    interests ? `興趣：${interests}` : "興趣未知",
    impression ? `印象：${impression}` : "印象未知",
  ];

  const gifts: GiftIdea[] = [
    {
      title: "質感香氛蠟燭／擴香（中性安全牌）",
      reason: `適合「${occasion}」，不容易踩雷；如果對方偏「質感/極簡」，更加分。`,
      priceRange: "NT$600–1500",
      tags: ["安全牌", "質感", "居家"],
    },
    {
      title: "手沖咖啡小禮盒／茶包禮盒（可客製口味）",
      reason: interests
        ? `你填了興趣「${interests}」，這類禮盒很容易做出「懂他」的感覺。`
        : "可用口味/產地做客製，讓禮物看起來更有心。",
      priceRange: "NT$400–1200",
      tags: ["客製", "日常", "不尷尬"],
    },
    {
      title: "拍立得相機底片／相片小卡組（互動性）",
      reason: `如果你們是「${relationship}」，這種禮物會把「一起用」變成記憶點。`,
      priceRange: "NT$300–900",
      tags: ["互動", "回憶", "可延伸"],
    },
  ];

  const cardShort = `祝你在「${occasion}」這天超開心！希望這份小禮物能陪你更常笑～`;
  const cardLong =
    `嗨！\n\n` +
    `一直覺得你給人的感覺很特別${impression ? `（尤其是「${impression}」）` : ""}。\n` +
    `這次想送你一份不只是「東西」，而是能讓你在日常也覺得被好好照顧的小禮物。\n\n` +
    `祝「${occasion}」快樂！\n` +
    `— 送你禮物的人`;

  const resp: RecommendResponse = {
    profileTags,
    styleRadar: score,
    gifts,
    card: { short: cardShort, long: cardLong },
  };

  return NextResponse.json(resp);
}
