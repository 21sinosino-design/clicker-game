export async function onRequest(context) {
  const db = context.env.RANKING_DB;
  const request = context.request;

  // 🔑 保存キー。ボスの仕様を変えたのでキーも新しくして作り直す。
  const DB_KEY = "raid_boss_v3";

  // 😈 レベルに応じたボスを作る（倒すほど強くなる無限ボス）
  function makeBoss(level) {
    const names = [
      "どでかスライム",
      "ブラック上司ゴーレム",
      "理不尽ドラゴン",
      "納期の悪魔",
      "社畜喰らいの魔王"
    ];
    const name = names[(level - 1) % names.length] + " Lv." + level;
    // レベルが上がるごとに最大HPが3倍になっていく
    const maxHp = Math.floor(5000000 * Math.pow(3, level - 1));
    return { name: name, level: level, maxHp: maxHp, hp: maxHp, defeatedBy: null, lastDefeated: null };
  }

  // 📖 GET: 今のボスの状態を返す
  if (request.method === "GET") {
    let boss = await db.get(DB_KEY, "json");
    if (!boss) {
      boss = makeBoss(1);
      await db.put(DB_KEY, JSON.stringify(boss));
    }
    return new Response(JSON.stringify(boss), { headers: { "Content-Type": "application/json" } });
  }

  // ⚔️ POST: ダメージを受け取ってボスを削る
  if (request.method === "POST") {
    const data = await request.json();
    let damage = Number(data.damage) || 0;
    const playerName = data.name || "名無し勇者";

    let boss = await db.get(DB_KEY, "json");
    if (!boss) boss = makeBoss(1);

    let justDefeated = false;

    if (boss.hp > 0 && damage > 0) {
      // 🛡️ 1回の通信で与えられるダメージは「最大HPの15%」まで。
      //    1人で一瞬で倒せないようにし、みんなで削る共闘感を出す。
      const cap = Math.ceil(boss.maxHp * 0.15);
      if (damage > cap) damage = cap;

      boss.hp -= damage;

      if (boss.hp <= 0) {
        // 🎉 討伐！次のレベルのボスが出現する
        const deadName = boss.name;
        const deadLevel = boss.level || 1;
        boss = makeBoss(deadLevel + 1);
        boss.lastDefeated = { name: deadName, by: playerName, level: deadLevel };
        justDefeated = true;
      }
      await db.put(DB_KEY, JSON.stringify(boss));
    }

    // justDefeated は「今この瞬間に倒した」合図。保存はせずレスポンスにだけ乗せる。
    const payload = Object.assign({}, boss, { justDefeated: justDefeated });
    return new Response(JSON.stringify(payload), { headers: { "Content-Type": "application/json" } });
  }

  return new Response("Method not allowed", { status: 405 });
}
