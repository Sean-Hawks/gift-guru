"use client";

import React, { useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import html2canvas from "html2canvas";

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

function decodeBase64Utf8(b64: string) {
  // 支援中文：先 atob，再用 Uint8Array 轉回 UTF-8
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export default function ResultPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const dataParam = sp.get("data") ?? "";
  const cardRef = useRef<HTMLDivElement>(null);

  const result = useMemo<RecommendResponse | null>(() => {
    if (!dataParam) return null;
    try {
      const jsonText = decodeBase64Utf8(dataParam);
      return JSON.parse(jsonText) as RecommendResponse;
    } catch {
      return null;
    }
  }, [dataParam]);

  // 可編輯的卡片內容
  const [cardTitle, setCardTitle] = useState("");
  const [cardMessage, setCardMessage] = useState("");
  const [cardSignature, setCardSignature] = useState("");

  // 初始化可編輯內容
  React.useEffect(() => {
    if (result?.card) {
      setCardTitle(result.card.title || "");
      setCardMessage(result.card.message || "");
      setCardSignature(result.card.signature || "");
    }
  }, [result]);

  const downloadCard = async () => {
    if (!cardRef.current) return;
    try {
      // 暫時替換 input/textarea 為普通元素，確保字體渲染一致
      const inputs = cardRef.current.querySelectorAll('input, textarea');
      const replacements: { element: Element; replacement: HTMLElement; parent: Node; nextSibling: Node | null }[] = [];
      
      inputs.forEach((input) => {
        const isTextarea = input.tagName === 'TEXTAREA';
        const replacement = document.createElement('div');
        const computedStyle = window.getComputedStyle(input);
        
        // 複製所有樣式
        replacement.textContent = (input as HTMLInputElement | HTMLTextAreaElement).value;
        replacement.className = input.className;
        
        // 複製關鍵樣式屬性
        replacement.style.cssText = computedStyle.cssText;
        replacement.style.border = 'none';
        replacement.style.outline = 'none';
        replacement.style.whiteSpace = isTextarea ? 'pre-wrap' : 'nowrap';
        replacement.style.wordBreak = isTextarea ? 'break-word' : 'normal';
        
        const parent = input.parentNode;
        const nextSibling = input.nextSibling;
        if (parent) {
          parent.replaceChild(replacement, input);
          replacements.push({ element: input, replacement, parent, nextSibling });
        }
      });

      // 截圖
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      // 恢復原本的 input/textarea
      replacements.forEach(({ element, replacement, parent, nextSibling }) => {
        if (nextSibling) {
          parent.insertBefore(element, nextSibling);
        } else {
          parent.appendChild(element);
        }
        replacement.remove();
      });

      const link = document.createElement("a");
      link.download = "gift-card.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Download failed:", err);
      alert("下載失敗，請重試");
    }
  };

  const copyCaption = () => {
    if (!result?.shareCaption) return;
    navigator.clipboard.writeText(result.shareCaption).then(() => {
      alert("已複製分享文案！");
    }).catch(() => {
      alert("複製失敗，請手動複製");
    });
  };

  if (!result) {
    return (
      <main className="min-h-screen bg-[#c9cfac] p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border-2 border-black bg-[#f6efd2] p-6">
          <h1 className="text-2xl font-black">結果頁</h1>
          <p className="mt-2 text-black/70">
            沒有收到結果資料（或資料壞掉）。請回首頁重新生成。
          </p>
          <button
            className="mt-4 rounded-xl border-2 border-black bg-[#f2b7c4] px-4 py-2 font-black"
            onClick={() => router.push("/")}
          >
            回首頁
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#c9cfac] p-6">
      <section className="mx-auto max-w-5xl rounded-3xl border-2 border-black bg-[#f6efd2] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-black">🎉 推薦結果</h1>
          <button
            className="rounded-xl border-2 border-black bg-white/70 px-4 py-2 font-black"
            onClick={() => router.push("/")}
          >
            再做一次
          </button>
        </div>

        {/* Tags */}
        <div className="mt-6">
          <div className="text-sm font-black">標籤</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {result.tags?.map((t) => (
              <span
                key={t}
                className="rounded-lg border-2 border-black bg-[#f2cd9a] px-3 py-1 text-sm font-semibold"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* 視覺卡片預覽區 */}
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-black">✨ 專屬卡片（可編輯）</div>
            <div className="flex gap-2">
              <button
                onClick={copyCaption}
                className="rounded-lg border-2 border-black bg-[#f2cd9a] px-3 py-2 text-xs font-black shadow-[0_4px_0_rgba(0,0,0,0.15)] active:translate-y-[1px] active:shadow-[0_2px_0_rgba(0,0,0,0.15)]"
              >
                📋 複製文案
              </button>
              <button
                onClick={downloadCard}
                className="rounded-lg border-2 border-black bg-[#f2b7c4] px-3 py-2 text-xs font-black shadow-[0_4px_0_rgba(0,0,0,0.15)] active:translate-y-[1px] active:shadow-[0_2px_0_rgba(0,0,0,0.15)]"
              >
                ⬇️ 下載卡片
              </button>
            </div>
          </div>
          
          {/* 卡片本體 */}
          <div
            ref={cardRef}
            className="relative overflow-hidden rounded-3xl border-4 border-black bg-gradient-to-br from-[#f6efd2] via-[#f2cd9a] to-[#f2b7c4] p-12 shadow-[0_12px_0_rgba(0,0,0,0.2)]"
            style={{ minHeight: "400px", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}
          >
            {/* 裝飾圖案 */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 text-6xl">🎁</div>
              <div className="absolute bottom-4 right-4 text-6xl">✨</div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl opacity-5">💝</div>
            </div>

            {/* 卡片內容 */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center" style={{ minHeight: "350px" }}>
              <input
                type="text"
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                className="mb-6 w-full bg-transparent text-center text-3xl font-black leading-tight text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40 md:text-4xl px-4"
                style={{ fontWeight: 900, letterSpacing: "0.02em" }}
                placeholder="標題"
              />
              <textarea
                value={cardMessage}
                onChange={(e) => setCardMessage(e.target.value)}
                className="mb-8 w-full max-w-xl resize-none bg-transparent text-center text-base font-semibold leading-relaxed text-[#2b2b2b] outline-none placeholder:text-[#2b2b2b]/40 md:text-lg px-6"
                style={{ fontWeight: 600, lineHeight: "1.8", letterSpacing: "0.01em" }}
                placeholder="訊息內容"
                rows={6}
              />
              <input
                type="text"
                value={cardSignature}
                onChange={(e) => setCardSignature(e.target.value)}
                className="w-full bg-transparent text-center text-lg font-black text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40 px-4"
                style={{ fontWeight: 900, letterSpacing: "0.01em" }}
                placeholder="— 署名"
              />
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-6">
          <div className="text-sm font-black">推薦禮物</div>
          <ul className="mt-2 space-y-3">
            {result.recommendations?.map((r) => (
              <li
                key={r.title}
                className="rounded-2xl border-2 border-black bg-white/60 p-4"
              >
                <div className="text-lg font-black">{r.title}</div>
                <div className="mt-1 text-sm">{r.reason}</div>
                <div className="mt-2 text-xs font-bold text-black/60">
                  {r.priceRange}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Card */}
        <div className="mt-6">
          <div className="text-sm font-black">卡片文案</div>
          <div className="mt-2 rounded-2xl border-2 border-black bg-white/60 p-4">
            <div className="text-lg font-black">{result.card?.title}</div>
            <pre className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
              {result.card?.message}
            </pre>
            <div className="mt-3 text-right text-sm font-semibold">
              — {result.card?.signature}
            </div>
          </div>
        </div>

        {/* Share caption */}
        <div className="mt-6">
          <div className="text-sm font-black">分享文案（可貼限動）</div>
          <div className="mt-2 rounded-2xl border-2 border-black bg-white/60 p-4 text-sm">
            {result.shareCaption}
          </div>
        </div>
      </section>
    </main>
  );
}
