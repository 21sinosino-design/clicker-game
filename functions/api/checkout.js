// ============================================================
// 💳 Stripe Checkout セッションを作成する API
//   フロントの「購入する」ボタンから POST で呼ばれ、
//   Stripe の決済ページURLを返す。
//
//   必要な設定（Cloudflare の環境変数）:
//     STRIPE_SECRET_KEY = sk_test_xxx または sk_live_xxx
// ============================================================

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const key = env.STRIPE_SECRET_KEY;
  if (!key) {
    // キー未設定（＝まだセットアップしていない）
    return json({ error: "STRIPE_SECRET_KEY が未設定です。Cloudflare の環境変数を確認してください。" }, 500);
  }

  // 決済後に戻ってくる先（このサイトのオリジン）
  const origin = new URL(request.url).origin;

  // Stripe API へ送るパラメータ（フォームエンコード）
  const params = new URLSearchParams();
  params.append("mode", "payment");
  // {CHECKOUT_SESSION_ID} は Stripe が実際のセッションIDに置き換えてくれる
  params.append("success_url", `${origin}/?premium_session={CHECKOUT_SESSION_ID}`);
  params.append("cancel_url", `${origin}/?premium_cancel=1`);
  params.append("line_items[0][quantity]", "1");
  params.append("line_items[0][price_data][currency]", "jpy");
  params.append("line_items[0][price_data][unit_amount]", "500"); // ¥500（JPYは少数なしなので500=¥500）
  params.append("line_items[0][price_data][product_data][name]", "プレミアム支援パック（村人Bの過労死クリッカー）");

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      return json({ error: (data.error && data.error.message) || "Stripe でエラーが発生しました" }, 500);
    }

    return json({ url: data.url });
  } catch (e) {
    return json({ error: "Stripe への通信に失敗しました" }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
