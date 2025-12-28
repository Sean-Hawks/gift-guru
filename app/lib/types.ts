export type Occasion =
  | "生日"
  | "聖誕節"
  | "交換禮物"
  | "畢業"
  | "情人節"
  | "新年";

export type Relationship =
  | "同學"
  | "朋友"
  | "曖昧"
  | "情侶"
  | "家人"
  | "老師";

export type RecommendRequest = {
  relationship: Relationship;
  occasion: Occasion;
  budgetTWD: number;
  impressionText: string;
  socialHint?: string; // IG連結/公開貼文描述（先用文字）
};

export type GiftIdea = {
  title: string;
  priceRange: string;
  why: string;
  alternatives: string[];
  avoid: string[];
};

export type RecommendResponse = {
  personaTags: string[];
  styleRadar: { key: string; value: number }[]; // 0~100
  giftIdeas: GiftIdea[];
  cardMessage: { long: string; short: string };
  shareCaption: string;
};
