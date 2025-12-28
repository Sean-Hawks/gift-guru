"use client";

import React, { useMemo, useState } from "react";

type ApiRecommendation = {
  title: string;
  reason: string;
  priceRange: string;
};

type ApiCard = {
  title: string;
  message: string;
  signature: string;
};

type RecommendResponse = {
  ok: boolean;
  received: any;
  tags: string[];
  recommendations: ApiRecommendation[];
  card: ApiCard;
  shareCaption: string;
};



type Relation = "同學" | "朋友" | "曖昧/交往" | "家人" | "同事" | "老師/學長姐" | "其他";
type Occasion = "生日" | "聖誕節" | "交換禮物" | "畢業" | "情人節" | "新年" | "其他";

export default function Page() {
  const [relation, setRelation] = useState<Relation>("朋友");
  const [occasion, setOccasion] = useState<Occasion>("生日");
  const [budget, setBudget] = useState<number>(800);
  const [interests, setInterests] = useState<string>("");
  const [impression, setImpression] = useState<string>("");

  const [socialQuery, setSocialQuery] = useState<string>("");
  const [socialPicked, setSocialPicked] = useState<string>("");

  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 調試：暴露到全局
  React.useEffect(() => {
    (window as any).__result = result;
    console.log("🔄 Result updated in effect:", result);
  }, [result]);

  const budgetText = useMemo(() => {
    if (!Number.isFinite(budget) || budget <= 0) return "—";
    return `NT$ ${budget.toLocaleString("en-US")}`;
  }, [budget]);

  async function generate() {
    console.log("🎯 generate() called, setting loading=true");
    setIsLoading(true);
    const payload = {
      relationship: relation,
      occasion,
      budget: Number(budget),
      interests,
      impression,
    };

    const res = await fetch("/api/recommand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert((err as any)?.error ?? "API error");
      setIsLoading(false);
      return;
    }

    const data = (await res.json()) as RecommendResponse;
    console.log("📦 Received data:", data);
    console.log("📦 Setting result state with:", data);
    setResult(data); // result state：拿來渲染 tags/ideas/card
    setIsLoading(false);
    console.log("✅ Loading set to false");
  }

  return (
    <main className="min-h-screen w-full bg-[#c9cfac] px-4 py-8 md:py-12">
      {/* 外框卡片 */}
      <section className="mx-auto w-full max-w-6xl rounded-[28px] bg-[#f6efd2] p-6 shadow-[0_12px_0_rgba(0,0,0,0.08)] md:p-10">
        {/* 標題 */}
        <header className="mb-8 text-center md:mb-10">
          <h1 className="text-4xl font-black tracking-wide text-[#1a1a1a] md:text-6xl">
            送禮物救星
          </h1>
          <p className="mt-3 text-sm text-[#2b2b2b]/70 md:text-base">
            不知道送什麼？讓我們幫你找到最適合的禮物
          </p>
        </header>

        {/* 內容區：左表單 + 右大輸入 */}
        <div className="grid gap-6 md:grid-cols-[1.05fr_0.95fr] md:gap-8">
          {/* 左：方塊表單 */}
          <div className="space-y-5">
            {/* 第一列：關係 / Occasion */}
            <div className="grid gap-5 md:grid-cols-2">
              <CardBox title="跟收禮人關係">
                <select
                  value={relation}
                  onChange={(e) => setRelation(e.target.value as Relation)}
                  className="w-full rounded-xl border-2 border-black bg-[#f2cd9a] px-4 py-3 text-base font-semibold outline-none focus:ring-2 focus:ring-black/30"
                >
                  <option>同學</option>
                  <option>朋友</option>
                  <option>曖昧/交往</option>
                  <option>家人</option>
                  <option>同事</option>
                  <option>老師/學長姐</option>
                  <option>其他</option>
                </select>
              </CardBox>

              <CardBox title="送禮場合">
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value as Occasion)}
                  className="w-full rounded-xl border-2 border-black bg-[#f2cd9a] px-4 py-3 text-base font-semibold outline-none focus:ring-2 focus:ring-black/30"
                >
                  <option>生日</option>
                  <option>聖誕節</option>
                  <option>交換禮物</option>
                  <option>畢業</option>
                  <option>情人節</option>
                  <option>新年</option>
                  <option>其他</option>
                </select>
              </CardBox>
            </div>

            {/* Budget */}
            <CardBox title="預算">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={Number.isFinite(budget) ? budget : 0}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full rounded-xl border-2 border-black bg-[#f2cd9a] px-4 py-3 text-base font-semibold outline-none focus:ring-2 focus:ring-black/30"
                  placeholder="例如：800"
                />
                <span className="whitespace-nowrap rounded-xl border-2 border-black bg-[#f2cd9a] px-4 py-3 text-sm font-bold">
                  {budgetText}
                </span>
              </div>
              <div className="mt-3">
                <input
                  type="range"
                  min={0}
                  max={5000}
                  step={50}
                  value={Number.isFinite(budget) ? budget : 0}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </CardBox>

            {/* 興趣（選填） */}
            <CardBox title="興趣（選填）">
              <input
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                className="w-full rounded-xl border-2 border-black bg-[#f2cd9a] px-4 py-3 text-base font-semibold outline-none focus:ring-2 focus:ring-black/30"
                placeholder="例如：露營、咖啡、日系穿搭、吉他、動漫"
              />
              <p className="mt-2 text-xs text-[#2b2b2b]/70">
                不知道也沒關係，之後可以改用「社群檢索」或「照片」補足。
              </p>
            </CardBox>

            {/* 社群檢索 */}
            <CardBox title="社群檢索">
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={socialQuery}
                  onChange={(e) => setSocialQuery(e.target.value)}
                  className="w-full flex-1 rounded-xl border-2 border-black bg-[#f2cd9a] px-4 py-3 text-base font-semibold outline-none focus:ring-2 focus:ring-black/30"
                  placeholder="貼 IG 帳號 / 關鍵字（先做假資料也行）"
                />
                <button
                  type="button"
                  onClick={() => setSocialPicked(socialQuery.trim())}
                  className="rounded-xl border-2 border-black bg-[#f2cd9a] px-5 py-3 text-base font-black shadow-[0_6px_0_rgba(0,0,0,0.15)] active:translate-y-[2px] active:shadow-[0_4px_0_rgba(0,0,0,0.15)]"
                >
                  搜尋
                </button>
              </div>
              {socialPicked ? (
                <div className="mt-3 rounded-xl border-2 border-black bg-white/60 px-4 py-3 text-sm">
                  <span className="font-bold">已選：</span>
                  <span className="break-all">{socialPicked}</span>
                </div>
              ) : (
                <div className="mt-3 rounded-xl border-2 border-dashed border-black/40 bg-white/30 px-4 py-3 text-sm text-black/60">
                  尚未選擇社群來源
                </div>
              )}
            </CardBox>

            {/* Upload 照片 */}
            <CardBox title="上傳照片">
              <label className="block">
                <span className="sr-only">上傳照片</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const arr = Array.from(e.target.files ?? []);
                    setFiles(arr);
                  }}
                  className="block w-full cursor-pointer rounded-xl border-2 border-black bg-[#f2cd9a] px-4 py-3 text-sm font-semibold file:mr-4 file:rounded-lg file:border-2 file:border-black file:bg-white/70 file:px-3 file:py-2 file:text-sm file:font-black"
                />
              </label>

              <div className="mt-3 rounded-xl border-2 border-black bg-white/60 px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold">已選 {files.length} 張</span>
                  {files.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFiles([])}
                      className="rounded-lg border-2 border-black bg-white/70 px-3 py-1 text-xs font-black"
                    >
                      清空
                    </button>
                  )}
                </div>

                {files.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {files.slice(0, 4).map((f) => (
                      <li key={f.name} className="break-all">
                        {f.name}
                      </li>
                    ))}
                    {files.length > 4 && (
                      <li className="text-black/60">…還有 {files.length - 4} 張</li>
                    )}
                  </ul>
                ) : (
                  <p className="mt-2 text-black/60">先不傳也可以，之後再補。</p>
                )}
              </div>
            </CardBox>

            {/* 生成按鈕 */}
            <button
              type="button"
              onClick={generate}
              className="mt-2 w-full rounded-2xl border-2 border-black bg-[#f2b7c4] px-6 py-4 text-lg font-black shadow-[0_8px_0_rgba(0,0,0,0.18)] active:translate-y-[2px] active:shadow-[0_6px_0_rgba(0,0,0,0.18)] disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? "分析中…" : "開始推薦禮物"}
            </button>
          </div>

          {/* 右：大輸入框（印象） */}
          <div className="rounded-3xl border-2 border-black bg-[#f2cd9a] p-5 md:p-6">
            <div className="mb-3 flex items-end justify-between gap-3">
              <h2 className="text-xl font-black md:text-2xl">對他的印象（選填）</h2>
              <span className="text-xs font-bold text-black/60">
                {impression.length}/400
              </span>
            </div>

            <textarea
              value={impression}
              onChange={(e) => setImpression(e.target.value.slice(0, 400))}
              placeholder={
                "例如：\n- 他最近迷露營、週末常跑戶外\n- 喜歡大地色、日系簡約\n- 不愛太浮誇但喜歡實用\n\n（寫幾句就很有幫助）"
              }
              className="min-h-[320px] w-full resize-none rounded-2xl border-2 border-black bg-[#f6efd2] px-4 py-4 text-base font-semibold leading-relaxed outline-none focus:ring-2 focus:ring-black/30 md:min-h-[520px]"
            />

            {/* 小提示區 */}
            <div className="mt-4 rounded-2xl border-2 border-black bg-white/55 px-4 py-3 text-sm">
              <p className="font-bold">小提示（讓推薦更準）：</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-black/80">
                <li>他最近在追什麼（劇/動漫/遊戲/歌手）？</li>
                <li>有沒有「不能送」的雷（香水/花/娃娃）？</li>
                <li>風格偏好：可愛 / 酷 / 文青 / 實用派</li>
              </ul>
            </div>
          </div>
        </div>
        {/* 結果區塊 */}
        {result && (
          <section className="mx-auto mt-8 w-full max-w-6xl rounded-3xl border-4 border-red-500 bg-yellow-100 p-6 shadow-[0_10px_0_rgba(0,0,0,0.15)]">
            <h3 className="mb-4 text-2xl font-black text-red-600">🎉 推薦結果</h3>
            <div className="mb-4">
              <div className="text-sm font-bold">標籤：</div>
              <div className="mt-1 flex flex-wrap gap-2">
                {result.tags && result.tags.map((t) => (
                  <span key={t} className="rounded-lg border-2 border-black bg-[#f2cd9a] px-3 py-1 text-sm font-semibold">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <div className="text-sm font-bold">推薦禮物：</div>
              <ul className="mt-2 space-y-2">
                {result.recommendations && result.recommendations.map((r) => (
                  <li key={r.title} className="rounded-xl border-2 border-black bg-[#f6efd2] p-3">
                    <div className="font-black">{r.title}</div>
                    <div className="text-sm">{r.reason}</div>
                    <div className="text-xs text-black/70">{r.priceRange}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-sm font-bold">卡片：</div>
              <div className="mt-2 rounded-xl border-2 border-black bg-[#f6efd2] p-3">
                <div className="font-black">{result.card?.title}</div>
                <pre className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{result.card?.message}</pre>
                <div className="mt-2 text-right text-sm font-semibold">— {result.card?.signature}</div>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function CardBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border-2 border-black bg-[#f2cd9a] p-5 shadow-[0_10px_0_rgba(0,0,0,0.10)]">
      <div className="mb-3 text-center text-lg font-black tracking-wide md:text-xl">
        {title}
      </div>
      {children}
    </div>
  );
}


