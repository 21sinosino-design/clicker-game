// ============================================================
// 🔎 Stripe の支払いをサーバー側で検証する API
//   フロントから GET /api/verify-purchase?session_id=cs_xxx で呼ばれ、
//   実際に支払い済みかどうかを Stripe に問い合わせて返す。
//
//   必要な設定（Cloudflare の環境変数）:
//     STRIPE_SECRET_KEY = sk_test_xxx または sk_live_xxx
//   任意（あれば購入記録を残す）:
//     RANKING_DB = KV namespace
// ============================================================

export async function onRequest(context) {
  const { request, env } = context;

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId || !sessionId.startsWith("cs_")) {
    return json({ premium: false, error: "セッションIDが正しくありません" }, 400);
  }

  const key = env.STRIPE_SECRET_KEY;
  if (!key) {
    return json({ premium: false, error: "STRIPE_SECRET_KEY が未設定です" }, 500);
  }

  try {
    const res = await fetch(
      "https://api.stripe.com/v1/checkout/sessions/" + encodeURIComponent(sessionId),
      { headers: { "Authorization": `Bearer ${key}` } }
    );
    const data = await res.json();

    if (!res.ok) {
      return json({ premium: false, error: (data.error && data.error.message) || "確認に失敗しました" }, 400);
    }

    const paid = data.payment_status === "paid";

    // 任意：購入記録を KV に残す（あれば）。無くても動く。
    if (paid && env.RANKING_DB) {
      try {
        await env.RANKING_DB.put(
          "premium_" + sessionId,
          JSON.stringify({ at: Date.now(), amount: data.amount_total, currency: data.currency }),
          { expirationTtl: 60 * 60 * 24 * 365 * 3 } // 3年
        );
      } catch (e) { /* 記録失敗は無視（解放には影響させない） */ }
    }

    return json({ premium: paid });
  } catch (e) {
    return json({ premium: false, error: "Stripe への通信に失敗しました" }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
