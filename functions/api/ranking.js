export async function onRequest(context) {
  const db = context.env.RANKING_DB;
  const request = context.request;

  // 📝 POST: スマホからスコアが送られてきた時の処理（登録）
  if (request.method === "POST") {
    const data = await request.json();
    const { name, score } = data;

    // 今のランキングをデータベースから取得
    let ranking = await db.get("top_scores", "json");
    if (!ranking) ranking = [];

    // 新しいスコアを追加
    ranking.push({ name, score });

    // スコアが高い順（降順）に並べ替え！
    ranking.sort((a, b) => b.score - a.score);
    
    // トップ10だけを残してデータベースに保存
    ranking = ranking.slice(0, 10);
    await db.put("top_scores", JSON.stringify(ranking));

    return new Response(JSON.stringify({ success: true, ranking }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // 📖 GET: スマホから「ランキング教えて」と言われた時の処理（取得）
  if (request.method === "GET") {
    let ranking = await db.get("top_scores", "json");
    if (!ranking) ranking = [];
    return new Response(JSON.stringify(ranking), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Method not allowed", { status: 405 });
}