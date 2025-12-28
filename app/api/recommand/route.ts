import { NextResponse } from "next/server";
import OpenAI from "openai";

function toPrompt(body: any) {
  const rel = body?.relationship ?? "朋友";
  const occ = body?.occasion ?? "生日";
  const bud = typeof body?.budget === "number" ? body.budget : Number(body?.budget ?? 800);
  const interests = (body?.interests ?? "").toString();
  const impression = (body?.impression ?? "").toString();

  return `你是一個「送禮推薦助理」Gift-Guru。
輸入包含：關係(${rel})、場合(${occ})、預算(NT$${bud})、興趣(${interests})、印象(${impression})。
請只輸出一段 JSON（不要多餘文字、不要程式碼區塊），格式如下：
{
  "tags": ["..."],
  "recommendations": [
    { "title": "...", "reason": "...", "priceRange": "NT$ x–y" },
    { "title": "...", "reason": "...", "priceRange": "NT$ x–y" }
  ],
  "card": { "title": "...", "message": "...", "signature": "Gift-Guru" }
}
規則：
- 標籤精簡、貼近風格/興趣/場合；中文繁體。
- 價格區間符合預算（可略超一點）。
- reason 直白具體，避免空話。
- 僅輸出 JSON，不要加註解或說明。`;
}

function safeParseJson(text: string): any | null {
  try {
    // 嘗試取出可能的 JSON 片段
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const slice = text.slice(start, end + 1);
      return JSON.parse(slice);
    }
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error("❌ OPENAI_API_KEY not found in environment");
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    console.log("🔑 Using OPENAI_API_KEY (length:", apiKey.length, ")");

    try {
      const openai = new OpenAI({ apiKey });
      const prompt = toPrompt(body);
      
      console.log("📝 Sending prompt to OpenAI...");
      const resp = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      });
      
      const text = resp.choices[0]?.message?.content || "";
      
      console.log("✅ OpenAI response received:", text.substring(0, 200), "...");
      
      const llm = safeParseJson(text);
      
      if (!llm || !llm.tags || !llm.recommendations || !llm.card) {
        console.error("❌ Invalid JSON from OpenAI:", llm);
        return NextResponse.json(
          { ok: false, error: "Invalid response format from OpenAI" },
          { status: 500 }
        );
      }

      const result = {
        ok: true,
        received: body,
        tags: llm.tags,
        recommendations: llm.recommendations,
        card: llm.card,
        shareCaption:
          "我用 Gift-Guru 幫朋友挑禮物，一鍵生成推薦＋卡片文案！✨ #送禮物救星 #GiftGuru",
      };

      console.log("✅ Returning result from OpenAI");
      return NextResponse.json(result);
    } catch (aiError: any) {
      console.error("❌ OpenAI API error:", aiError?.message || aiError);
      return NextResponse.json(
        { ok: false, error: `OpenAI error: ${aiError?.message || "Unknown error"}` },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("❌ Request parsing error:", err);
    return NextResponse.json(
      { ok: false, error: "Invalid JSON or server error." },
      { status: 400 }
    );
  }
}
