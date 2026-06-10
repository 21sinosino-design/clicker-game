export async function onRequest(context) {
  const db = context.env.RANKING_DB;
  const request = context.request;

  // 😈 どでかスライム（HP 1万に弱体化！）
  const INITIAL_BOSS = {
    name: "どでかスライム",
    maxHp: 5000000, 
    hp: 5000000,
    defeatedBy: null
  };

  // 🔑 ここが魔法！保存するデータの「名札」を新しくすることで、5000兆の記憶をリセット！
  const DB_KEY = "raid_boss_test_02";

  if (request.method === "GET") {
    let boss = await db.get(DB_KEY, "json");
    if (!boss) {
      boss = INITIAL_BOSS;
      await db.put(DB_KEY, JSON.stringify(boss));
    }
    return new Response(JSON.stringify(boss), { headers: { "Content-Type": "application/json" } });
  }

  if (request.method === "POST") {
    const data = await request.json();
    const damage = data.damage || 0;
    const playerName = data.name || "名無し勇者";

    let boss = await db.get(DB_KEY, "json");
    if (!boss) boss = INITIAL_BOSS;

    if (boss.hp > 0 && damage > 0) {
      boss.hp -= damage;
      
      if (boss.hp <= 0) {
        boss.hp = 0;
        boss.defeatedBy = playerName;
      }
      await db.put(DB_KEY, JSON.stringify(boss));
    }

    return new Response(JSON.stringify(boss), { headers: { "Content-Type": "application/json" } });
  }

  return new Response("Method not allowed", { status: 405 });
}