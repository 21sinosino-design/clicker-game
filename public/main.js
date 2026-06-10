
// ==========================================
// 🧠 ゲームの裏側のプログラム
// ==========================================

let gold = 0;
let goldPerSecond = 0;


// 👇 おそらくこの2つが消えてしまっているので、追加してください！
let totalPulls = 0;
let lifetimeClicks = 0;
// ステップ3：JavaScriptで「全プレイヤーのダメージ」を送信する

//「毎回通信するとサーバーがパンクする」ので、**スマホの中でダメージを数秒間貯めてから、裏でこっそりまとめて送信する（非同期通信）**というプロの技を使います。

//ダメージを蓄積する変数を追加（`main.js`の一番上付近の `let gold = 0;` の下あたりに追記）**

let pendingDamage = 0; // サーバーにまだ送っていない「貯まったダメージ」
let myPlayerName = "名無し勇者"; // あなたの名前

let boostTimeRemaining = 0;
let boostInterval = null;

let isPremium = false; // 👑 プレミアム購入フラグ

// 🎲 1. 【最重要】ここにGeminiが生成した100個のデータを貼り付けます！
const itemDataMaster = [
  // ▼▼▼ この下に「[ {id:1...}, ..., {id:100...} ]」というJSON配列をそのまま貼り付けてください ▼▼▼

  { "id": 1, "name": "駆け出しの剣士 アレン", "rarity": "N", "desc": "「俺の剣に迷いはない！」と叫ぶが、道にはよく迷う。", "income": 1 },
  { "id": 2, "name": "見習い魔法使い エル", "rarity": "N", "desc": "火球を放つ練習で、すでに村の納屋を3つ全焼させている。", "income": 2 },
  { "id": 3, "name": "村の青年 トム", "rarity": "N", "desc": "ただの農民だが、鍬を持たせると異常なスイングスピードを誇る。", "income": 3 },
  { "id": 4, "name": "はぐれスライム", "rarity": "N", "desc": "群れからはぐれた哀れなスライム。プルプルして同情を誘う。", "income": 4 },
  { "id": 5, "name": "ゴブリンの斥候", "rarity": "N", "desc": "偵察任務中だが、落ちていた光る石に夢中で仕事をしていない。", "income": 5 },
  { "id": 6, "name": "酔いどれドワーフ ギム", "rarity": "N", "desc": "エールビールさえあれば24時間戦えるが、常に千鳥足。", "income": 8 },
  { "id": 7, "name": "新米プリースト マリア", "rarity": "N", "desc": "回復魔法の詠唱をよく噛むので、たまに毒を付与してしまう。", "income": 11 },
  { "id": 8, "name": "野盗のザック", "rarity": "N", "desc": "「命が惜しくば金を出せ！」が口癖だが、実家からの仕送りで生活している。", "income": 15 },
  { "id": 9, "name": "おしゃべりな妖精 ピック", "rarity": "N", "desc": "有益な情報をくれるかと思いきや、近所の井戸端会議のネタばかり。", "income": 21 },
  { "id": 10, "name": "森の狩人 ロビン", "rarity": "N", "desc": "百発百中の弓の腕を持つが、極度の鳥目なので夕方以降は役立たず。", "income": 30 },
  { "id": 11, "name": "鉄壁の重騎士 ガルド", "rarity": "N", "desc": "鎧が重すぎて一度転ぶと自力で起き上がれない。", "income": 41 },
  { "id": 12, "name": "気まぐれな踊り子 シルビア", "rarity": "N", "desc": "彼女の舞は味方を鼓舞するが、チップを弾まないとすぐ帰る。", "income": 58 },
  { "id": 13, "name": "行商人 ポロ", "rarity": "N", "desc": "ガラクタを伝説の武具と偽って売りつける詐欺スレスレの商人。", "income": 81 },
  { "id": 14, "name": "街の衛兵 ジョン", "rarity": "N", "desc": "「昔はお前のような冒険者だったが…」と語りたがるおじさん。", "income": 114 },
  { "id": 15, "name": "臆病なコボルト", "rarity": "N", "desc": "自分の影に驚いて気絶するほど臆病。でも金目の物には目ざとい。", "income": 160 },
  { "id": 16, "name": "熱血武闘家 リュウ", "rarity": "N", "desc": "修行のために滝に打たれすぎて、年中風邪をひいている。", "income": 223 },
  { "id": 17, "name": "自称・天才錬金術師", "rarity": "N", "desc": "鉛を金に変える実験に失敗し、借金だけが錬成された。", "income": 313 },
  { "id": 18, "name": "スケルトン・ソルジャー", "rarity": "N", "desc": "カルシウム不足でよく骨折するアンデッド。", "income": 438 },
  { "id": 19, "name": "迷子のオーク", "rarity": "N", "desc": "いかつい顔で道を聞いてくるので、全員から逃げられている。", "income": 613 },
  { "id": 20, "name": "魔法学園の落第生", "rarity": "N", "desc": "理論は完璧だが、魔力が絶望的に少ない悲しき秀才。", "income": 858 },
  { "id": 21, "name": "双剣の傭兵 レオン", "rarity": "N", "desc": "カッコつけて剣を回すが、よく自分の指を切って絆創膏を貼っている。", "income": 1500 },
  { "id": 22, "name": "森の薬草摘み クロエ", "rarity": "N", "desc": "毒草と薬草を「匂い」だけで嗅ぎ分けるが、鼻詰まりの日は危険。", "income": 2700 },
  { "id": 23, "name": "からくり人形 零号機", "rarity": "N", "desc": "ロストテクノロジーの産物だが、現在は肩たたき機として稼働中。", "income": 4800 },
  { "id": 24, "name": "さすらいのギャンブラー", "rarity": "N", "desc": "「俺の全財産を赤に賭ける！」と叫び、いつもすっからかん。", "income": 8600 },
  { "id": 25, "name": "宿屋の看板娘 アリス", "rarity": "N", "desc": "彼女の笑顔目当てで冒険者が貢ぐため、経済効果がすさまじい。", "income": 15000 },
  { "id": 26, "name": "マッド・サイエンティスト", "rarity": "N", "desc": "キメラを創造しようとして、ただの可愛い犬を生み出してしまった。", "income": 27000 },
  { "id": 27, "name": "ポンコツメイドロボ", "rarity": "N", "desc": "ご主人様のために紅茶を淹れるが、必ず熱湯をこぼす。", "income": 48000 },
  { "id": 28, "name": "吟遊詩人 リュート", "rarity": "N", "desc": "彼の弾くバラードは美しすぎるあまり、味方まで熟睡させる。", "income": 86000 },
  { "id": 29, "name": "地下迷宮の案内人", "rarity": "N", "desc": "「安全な道はこちらです」と案内し、トラップに引っかかるプロ。", "income": 154000 },
  { "id": 30, "name": "哀しきゴーレム", "rarity": "N", "desc": "花を愛する優しい心を持つが、握力がありすぎて潰してしまう。", "income": 278000 },
  { "id": 31, "name": "疾風の剣士 アルト", "rarity": "R", "desc": "風のように素早く敵を斬るが、スタミナが持たず3分で息切れする。", "income": 500000 },
  { "id": 32, "name": "紅蓮の魔道士 カーラ", "rarity": "R", "desc": "強力な爆発魔法を操るが、味方もろとも吹き飛ばす癖がある。", "income": 900000 },
  { "id": 33, "name": "聖騎士 ガウェイン", "rarity": "R", "desc": "清く正しく美しい騎士だが、重度の潔癖症で泥の中は歩けない。", "income": 1600000 },
  { "id": 34, "name": "暗黒街の元締め", "rarity": "R", "desc": "裏社会を牛耳る男だが、娘の反抗期には手も足も出ない。", "income": 2900000 },
  { "id": 35, "name": "エルフの狙撃手 リファ", "rarity": "R", "desc": "数キロ先から的を射抜くが、近眼のメガネを外すと何も見えない。", "income": 5200000 },
  { "id": 36, "name": "獣人戦士 ガルダ", "rarity": "R", "desc": "戦場では鬼神の如き強さだが、マタタビを嗅がされるとゴロゴロ鳴く。", "income": 9400000 },
  { "id": 37, "name": "雷帝の末裔 ライト", "rarity": "R", "desc": "雷を操る由緒正しき一族。しかし本人は極度の静電気恐怖症。", "income": 17000000 },
  { "id": 38, "name": "氷の魔女 フローリア", "rarity": "R", "desc": "冷徹な態度で敵を凍らせるが、実は重度の冷え性で厚着している。", "income": 30000000 },
  { "id": 39, "name": "海賊船長 ドレイク", "rarity": "R", "desc": "七つの海を制覇した男。ただしカナヅチなので浮き輪は必須。", "income": 54000000 },
  { "id": 40, "name": "カラクリ忍者 飛鳥", "rarity": "R", "desc": "サイボーグ化された忍者。充電が切れるとただの重い鉄の塊。", "income": 97000000 },
  { "id": 41, "name": "神殿の巫女 セリア", "rarity": "R", "desc": "神の託宣を聞くことができるが、大抵は神の個人的な愚痴。", "income": 240000000 },
  { "id": 42, "name": "幻影の怪盗 シャト", "rarity": "R", "desc": "華麗に宝を盗み出すが、予告状に誤字脱字が多くてよくイジられる。", "income": 600000000 },
  { "id": 43, "name": "竜騎士 ザイン", "rarity": "R", "desc": "飛竜を駆る誇り高き騎士。ただし飛竜が言うことを聞かない。", "income": 1500000000 },
  { "id": 44, "name": "錬金ギルド長 メル", "rarity": "R", "desc": "不老不死の秘薬を研究しているが、アンチエイジング化粧品で妥協した。", "income": 3.7e9 },
  { "id": 45, "name": "狂戦士 ベルセルク", "rarity": "R", "desc": "血を見ると理性を失い暴れ狂うが、定期健診の採血でも暴れる。", "income": 9.3e9 },
  { "id": 46, "name": "風水師 リン", "rarity": "R", "desc": "地形の運気を操り金運を上げる。彼女自身の財布はいつも空っぽ。", "income": 2.3e10 },
  { "id": 47, "name": "黒魔道士 ゾーマ", "rarity": "R", "desc": "世界を闇に染めようと目論むが、日焼けが嫌なだけである。", "income": 5.8e10 },
  { "id": 48, "name": "召喚士 ユウナ", "rarity": "R", "desc": "伝説の幻獣を喚び出せるが、餌代がかかりすぎて家計が火の車。", "income": 1.4e11 },
  { "id": 49, "name": "魔犬 ガルム", "rarity": "R", "desc": "地獄の番犬。しかし「おすわり」と言われると反射的に座ってしまう。", "income": 3.6e11 },
  { "id": 50, "name": "吸血鬼 ヴァン", "rarity": "R", "desc": "気高き夜の貴族。ニンニクたっぷりペペロンチーノが密かな好物。", "income": 9.0e11 },
  { "id": 51, "name": "砂漠の王 ジャミル", "rarity": "R", "desc": "灼熱の砂漠を統べる王。最近、乾燥肌に悩んでいる。", "income": 2.2e12 },
  { "id": 52, "name": "星詠みの占星術師", "rarity": "R", "desc": "星の配置から未来を完璧に予知するが、自分の明日の夕飯は当てられない。", "income": 5.5e12 },
  { "id": 53, "name": "大富豪 ゴルド", "rarity": "R", "desc": "金で解決できない問題はないと豪語するが、愛だけは買えなかった。", "income": 1.3e13 },
  { "id": 54, "name": "暗黒騎士 ゼロ", "rarity": "R", "desc": "「俺に近づくな…怪我するぜ」と中二病全開だが、実はすごく寂しがり屋。", "income": 3.4e13 },
  { "id": 55, "name": "白銀の狼 フェンリル", "rarity": "R", "desc": "伝説の魔狼だが、フライングディスクを投げられると全力で取りに行く。", "income": 8.5e13 },
  { "id": 56, "name": "植物学者 フローラ", "rarity": "R", "desc": "新種の魔界植物を発見したが、うっかり部屋で育ててしまい家を占拠された。", "income": 2.1e14 },
  { "id": 57, "name": "退魔の符術士", "rarity": "R", "desc": "悪霊を退散させるお札を貼るが、セロハンテープで止めている。", "income": 5.2e14 },
  { "id": 58, "name": "夢魔 サキュバス", "rarity": "R", "desc": "人間の精気を吸う悪魔。最近はSNSの「いいね」を吸うだけで満腹になる。", "income": 1.3e15 },
  { "id": 59, "name": "機工士 シド", "rarity": "R", "desc": "飛空艇の設計図を完成させたが、予算不足で自転車の改造に落ち着いた。", "income": 3.2e15 },
  { "id": 60, "name": "冥界の渡し守 カロン", "rarity": "R", "desc": "死者の魂を運ぶ船頭。最近は電子マネー決済にも対応した。", "income": 8.0e15 },
  { "id": 61, "name": "剣聖 グランツ", "rarity": "SR", "desc": "万の剣を極めた達人。強すぎて暇になり、今は盆栽にハマっている。", "income": 3.2e16 },
  { "id": 62, "name": "大賢者 マーリン", "rarity": "SR", "desc": "世界中の知識を持つが、パスワードを忘れてログインできなくなることが多い。", "income": 1.2e17 },
  { "id": 63, "name": "光の巫女 アリア", "rarity": "SR", "desc": "すべてを包み込む慈愛の聖女。ただし寝起きはスッピンで口が悪い。", "income": 5.1e17 },
  { "id": 64, "name": "影の執行者 アサシン", "rarity": "SR", "desc": "決して姿を見せない伝説の暗殺者だが、足音がキュッキュ鳴る靴を履いている。", "income": 2.0e18 },
  { "id": 65, "name": "竜王 バハムート（人型）", "rarity": "SR", "desc": "人間の姿に化けているが、うっかり尻尾でコーヒーカップを割る。", "income": 8.1e18 },
  { "id": 66, "name": "精霊王 オベロン", "rarity": "SR", "desc": "自然を統べる王。花粉症がひどく、春先は魔力が半減する。", "income": 3.2e19 },
  { "id": 67, "name": "魔界の公爵 ヴァッサゴ", "rarity": "SR", "desc": "冷酷無比な悪魔の貴族だが、契約書にはやたらと可愛い印鑑を押す。", "income": 1.3e20 },
  { "id": 68, "name": "聖十字騎士団長", "rarity": "SR", "desc": "正義のために命を懸ける男。日課は部下への長すぎる朝礼。", "income": 5.2e20 },
  { "id": 69, "name": "炎の帝王 イフリート", "rarity": "SR", "desc": "全てを焼き尽くす炎の魔神。猫舌なので熱いスープは飲めない。", "income": 2.0e21 },
  { "id": 70, "name": "氷の女王 シヴァ", "rarity": "SR", "desc": "世界を氷河期に変える力を持つが、コタツから一歩も出たがらない。", "income": 8.0e21 },
  { "id": 71, "name": "死霊魔術師 ネクロマンサー", "rarity": "SR", "desc": "何万ものアンデッドを操るが、全員の名前を覚えている律儀な性格。", "income": 3.2e22 },
  { "id": 72, "name": "時空の放浪者", "rarity": "SR", "desc": "あらゆる時代を旅する男。いつも時代遅れのファッションをしている。", "income": 1.2e23 },
  { "id": 73, "name": "戦乙女 ヴァルキリー", "rarity": "SR", "desc": "勇者の魂を神殿へ導く天使。最近はカーナビに頼り切っている。", "income": 5.1e23 },
  { "id": 74, "name": "錬金神 ヘルメス", "rarity": "SR", "desc": "錬金術の祖。石を黄金に変えすぎて市場の金相場を崩壊させた。", "income": 2.0e24 },
  { "id": 75, "name": "九尾の妖狐 玉藻", "rarity": "SR", "desc": "国を滅ぼすほどの妖艶な美女。抜け毛の季節はブラッシングが大変。", "income": 8.1e24 },
  { "id": 76, "name": "機巧神将 オメガ", "rarity": "SR", "desc": "古代兵器の最高傑作。しかしOSが古すぎて現代のWi-Fiに繋がらない。", "income": 3.2e25 },
  { "id": 77, "name": "星海の歌姫 マリン", "rarity": "SR", "desc": "銀河中を熱狂させるアイドル。裏アカでアンチとレスバしている。", "income": 1.3e26 },
  { "id": 78, "name": "冥王 ハデス", "rarity": "SR", "desc": "死者の国を治める冷酷な神。妻の尻に敷かれており、お小遣い制。", "income": 5.2e26 },
  { "id": 79, "name": "豊穣の女神 デメテル", "rarity": "SR", "desc": "彼女が微笑めば大地は潤うが、怒るとそこら中からタケノコが生える。", "income": 2.0e27 },
  { "id": 80, "name": "天翔ける天馬 ペガサス", "rarity": "SR", "desc": "気高き神の乗り物。高所恐怖症なので低空飛行しかできない。", "income": 8.0e27 },
  { "id": 81, "name": "伝説の勇者 ロト（仮）", "rarity": "SSR", "desc": "世界を救ったという伝説の勇者。実はただのそっくりさん。", "income": 6.4e28 },
  { "id": 82, "name": "魔王 サタン", "rarity": "SSR", "desc": "世界征服を目論む恐怖の象徴。確定申告の時期は徹夜で事務作業をする。", "income": 5.1e29 },
  { "id": 83, "name": "創造神 ブラフマー", "rarity": "SSR", "desc": "宇宙を創造した偉大なる神。最近はプラモデル作りに精を出している。", "income": 4.0e30 },
  { "id": 84, "name": "破壊神 シヴァ", "rarity": "SSR", "desc": "世界を無に還す神。うっかりお気に入りのお茶碗まで破壊して落ち込んでいる。", "income": 3.2e31 },
  { "id": 85, "name": "太陽神 アポロン", "rarity": "SSR", "desc": "彼がいる限り世界は明るい。眩しすぎて本人は常にサングラス着用。", "income": 2.5e32 },
  { "id": 86, "name": "月読命 ツクヨミ", "rarity": "SSR", "desc": "夜と静寂を愛する神。極度の夜更かしゲーマー。", "income": 2.0e33 },
  { "id": 87, "name": "天帝 ゼウス", "rarity": "SSR", "desc": "神々を束ねる最高神。浮気がバレて妻から雷を落とされる毎日。", "income": 1.6e34 },
  { "id": 88, "name": "混沌の化身 ニャルラトホテプ", "rarity": "SSR", "desc": "這い寄る混沌。這い寄りすぎてよく人に踏まれる。", "income": 1.2e35 },
  { "id": 89, "name": "世界樹の精霊 ユグドラシル", "rarity": "SSR", "desc": "すべての生命の源。根元に犬がおしっこをしていくのが最近の悩み。", "income": 1.0e36 },
  { "id": 90, "name": "次元の覇者 ギルガメッシュ", "rarity": "SSR", "desc": "すべての財宝を集めた英雄王。収納スペースが足りず、実家の倉庫に送っている。", "income": 8.0e36 },
  { "id": 91, "name": "全知全能の神", "rarity": "UR", "desc": "世界の全てを知り尽くしているが、「昨日の夕飯何食べたっけ？」は思い出せない。", "income": 6.4e37 },
  { "id": 92, "name": "無限を統べる者 エンドレス", "rarity": "UR", "desc": "時間が永遠に続く空間の支配者。カップラーメンの3分が待てない。", "income": 5.1e38 },
  { "id": 93, "name": "概念喰らい ヴォイド", "rarity": "UR", "desc": "「存在」そのものを食べてしまう恐るべき怪物。しかしカロリーゼロ。", "income": 4.0e39 },
  { "id": 94, "name": "因果律の調律者", "rarity": "UR", "desc": "過去と未来のパラドックスを修正する存在。たまに寝坊して歴史が変わる。", "income": 3.2e40 },
  { "id": 95, "name": "平行世界の創造主", "rarity": "UR", "desc": "無数のマルチバースを管理しているが、エクセルのマクロで自動化している。", "income": 2.5e41 },
  { "id": 96, "name": "真理の扉の番人", "rarity": "UR", "desc": "宇宙の真理を求める者に試練を与える。最近はなぞなぞマイブーム。", "income": 2.0e42 },
  { "id": 97, "name": "第四の壁の監視者", "rarity": "UR", "desc": "「ねえ、そこの君。ずっと画面タップしてて指疲れない？」", "income": 1.6e43 },
  { "id": 98, "name": "終焉と創世の覇竜 ウロボロス・プライム", "rarity": "LR", "desc": "世界の始まりと終わりを同時に内包する絶対的な竜。その咆哮は宇宙を砕く。", "income": 1.2e44 },
  { "id": 99, "name": "深淵の超越者 ヴォイド・カオス・レクイエム", "rarity": "LR", "desc": "全てを虚無へ帰す存在。視認しただけで魂が次元の彼方へと消し飛ぶ。", "income": 1.0e45 },
  { "id": 100, "name": "神格機巧 アポカリプス・ゼノン・オーバーロード", "rarity": "LR", "desc": "因果律すら書き換える神をも殺す機神。発動すれば世界線が分岐する。", "income": 8.0e45 }
  // ▲▲▲ ここまで ▲▲▲
];

// ⚖️ 神のバランス調整機能（レアリティ基準＆超アタリ枠あり！）
// ⚖️ 神のバランス調整機能（10倍刻みの美しいインフレ＆アタリ枠あり！）
itemDataMaster.forEach(char => {
  // 1. レアリティごとの「基本給」を 1, 10, 100... と10倍刻みに設定！
  const baseIncome = {
    "N": 1,          // 1 G
    "R": 10,         // 10 G
    "SR": 100,       // 100 G
    "SSR": 1000,     // 1 K (1,000 G)
    "UR": 10000,     // 10 K (10,000 G)
    "LR": 100000     // 100 K (100,000 G)
  };

  // 2. そのキャラの基本給をセット（念のため設定ミス時は1Gにする防弾処理）
  let income = baseIncome[char.rarity] || 1;

  // 3. 個体差（アタリ・ハズレ）を作る！
  // キャラIDを使って 0.8倍 〜 1.7倍 のランダムな個体差を出す
  let luck = (char.id * 13) % 10;
  let multiplier = 0.8 + (luck * 0.1);

  // 👑 【超アタリ枠】10分の1の確率で、稼ぎが3倍の超優秀な社畜が誕生！
  if (luck === 9) {
    multiplier = 3.0;
    // 図鑑でアタリだと分かるように、説明文に王冠を足す
    if (!char.desc.includes("👑")) {
      char.desc += " 【👑 超アタリ個体！】";
    }
  }

  // 最終的な稼ぎを計算してキャラに登録！（小数点以下は切り捨て）
  char.income = Math.floor(income * multiplier);
});

// ゲーム内で動的に管理するアイテム配列（セーブデータと同期）
let gameStateItems = {};

// 📺 ショップのアイテム画面を動的に生成する（100回繰り返す）


// 🔢 数字を「1K, 1M, 1B」のカッコいい表記にする機能
function formatNumber(num) {
  if (isNaN(num)) return "0";
  // 英語圏の「コンパクト表記」を呼び出す魔法の呪文！
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
}

// 💰 毎秒の稼ぎ（GPS）を計算する機能（プレミアム2倍対応版！）
function calculateGPS() {
  goldPerSecond = 0;

  itemDataMaster.forEach(data => {
    const state = gameStateItems[data.id];
    if (state && state.count > 0) {
      const safeIncome = data.income || 0;
      if (!isNaN(safeIncome) && !isNaN(state.count)) {
        goldPerSecond += safeIncome * state.count;
      }
    }
  });

  if (isNaN(goldPerSecond)) {
    goldPerSecond = 0;
  }

  // 👑 プレミアム特典：自動稼ぎが永久に「2倍」！！
  if (typeof isPremium !== 'undefined' && isPremium) {
    goldPerSecond *= 2;
  }
}

// ==========================================
// 💀 村人Bの悲鳴（Web Speech API）＆ 浮かび上がる文字
// ==========================================
const patheticVoices = ["ヒィッ！", "アァッ！", "お許しを…！", "痛いっ！", "もう休ませて…"];

function playPatheticVoiceAndText() {
  const text = patheticVoices[Math.floor(Math.random() * patheticVoices.length)];

  // 🗣️ ブラウザの機能を使って、実際に喋らせる！（MP3不要！）
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel(); // 連打した時に前の声をキャンセルして「ヒ、ヒ、ヒィッ！」と吃音っぽくする
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.8;  // 早口で焦った感じ
    utterance.pitch = 1.8; // 高くて情けない裏声
    utterance.volume = 0.6;
    speechSynthesis.speak(utterance);
  }

  // 💬 タップした場所に悲鳴の文字を浮かび上がらせる
  const textEl = document.createElement("div");
  textEl.innerText = text;
  textEl.style.position = "absolute";
  textEl.style.color = "#e74c3c"; // 血のような赤色
  textEl.style.fontSize = (Math.random() * 10 + 20) + "px";
  textEl.style.fontWeight = "bold";
  textEl.style.pointerEvents = "none";
  textEl.style.textShadow = "2px 2px 0 #000";

  // 画面の中央（村人Bの周辺）にランダムに配置
  const x = window.innerWidth / 2 + (Math.random() * 100 - 50);
  const y = 300 + (Math.random() * 50 - 25); // 画像の高さに合わせて微調整
  textEl.style.left = x + "px";
  textEl.style.top = y + "px";

  // ふわっと上に消えるアニメーション
  textEl.style.transition = "all 1s ease-out";
  document.body.appendChild(textEl);

  setTimeout(() => {
    textEl.style.transform = "translateY(-50px)";
    textEl.style.opacity = "0";
  }, 10);

  setTimeout(() => textEl.remove(), 1000);
}

// 🧠 音声合成エンジン（ブラウザ内蔵のシンセサイザー）
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;





// 💧 村人Bをクリックした時の処理（プレミアム2倍対応版！）
document.getElementById("slimeBtn").addEventListener("click", () => {

  let clickGold = 1; // 基本は1G

  // ⚡ 秘薬効果中（赤画面）ならベースが10Gに！
  if (typeof boostTimeRemaining !== 'undefined' && boostTimeRemaining > 0) {
    clickGold = 10;
  }

  // 👑 プレミアム特典：タップの稼ぎも永久に「2倍」！！
  // （通常時は2G、秘薬中はなんと20Gになる！）
  if (typeof isPremium !== 'undefined' && isPremium) {
    clickGold *= 2;
  }

  gold += clickGold;
  lifetimeClicks += 1;

  if (typeof updateVillagerFace === 'function') updateVillagerFace();
  playPatheticVoiceAndText();

  updateUI();
  saveGame();
});



// 各ガチャの設定（値段と、排出されるレアリティの確率）
// ==========================================
// 💎 階級別ガチャシステム（神バランス調整版！）
// ==========================================

const gachaTiers = {
  // 🌱 ノーマルガチャ (50G) : N(90%), R(9%), SR(1%)
  'normal': {
    cost: 500,
    pools: [
      { rarity: 'N', chance: 90 },
      { rarity: 'R', chance: 99 },
      { rarity: 'SR', chance: 100 }
    ]
  },
  // 🏴 ブラックガチャ (50万Gに値上げ！) : R(85%), SR(13%), SSR(2%)
  'black': {
    cost: 500000, // 👈 50K から 500K に変更！
    pools: [
      { rarity: 'R', chance: 85 },
      { rarity: 'SR', chance: 98 },
      { rarity: 'SSR', chance: 100 }
    ]
  },
  // 👑 魔王級ガチャ (5億G) : SR(80%), SSR(18%), UR(2%) / ※LRは絶対に出ない！
  'demon': {
    cost: 500000000,
    pools: [
      { rarity: 'SR', chance: 80 },
      { rarity: 'SSR', chance: 98 },
      { rarity: 'UR', chance: 100 }
    ]
  }
};

// 🎰 ガチャを回す機能
function rollGacha(tier) {
  const gacha = gachaTiers[tier];

  if (gold < gacha.cost) {
    document.getElementById("gachaResult").innerText = `❌ ゴールドが足りない！`;
    document.getElementById("gachaResult").style.color = "#e74c3c";
    return;
  }

  // お金を消費！
  gold -= gacha.cost;
  totalPulls += 1; // 記録用（使わなくてもOKですが残しておきます）

  // 🎲 確率計算（どのレアリティが出るか？）
  const rand = Math.random() * 100;
  let selectedRarity = 'N';
  for (let i = 0; i < gacha.pools.length; i++) {
    if (rand < gacha.pools[i].chance) {
      selectedRarity = gacha.pools[i].rarity;
      break;
    }
  }

  // 選ばれたレアリティの中から、ランダムで1体選ぶ！
  const poolItems = itemDataMaster.filter(data => data.rarity === selectedRarity);
  if (poolItems.length === 0) {
    alert(`エラー：${selectedRarity} のキャラがデータにいません！`);
    gold += gacha.cost; // エラー時はお金を返す
    return;
  }
  const pulledChar = poolItems[Math.floor(Math.random() * poolItems.length)];

  // キャラを付与！
  if (!gameStateItems[pulledChar.id]) gameStateItems[pulledChar.id] = { count: 0, cost: 0 };
  gameStateItems[pulledChar.id].count += 1;

  // 演出！
  document.body.style.animation = "feverFlash 0.3s ease";
  setTimeout(() => document.body.style.animation = "", 300);

  const resDiv = document.getElementById("gachaResult");
  resDiv.innerHTML = `✨ 【${pulledChar.rarity}】 ${pulledChar.name} をゲット！`;
  resDiv.style.color = (selectedRarity === 'UR' || selectedRarity === 'LR') ? "#ff00ff" : "#00ff00";

  // 全画面更新
  calculateGPS();
  updateUI();
  if (typeof updateCollectionUI === 'function') updateCollectionUI();
  if (typeof updateSynthesisUI === 'function') updateSynthesisUI();
  saveGame();
}


// ==========================================
// 📖 図鑑（コレクション）の画面を更新する（ポケモン図鑑・スマート版！）
// ==========================================
function updateCollectionUI() {
  const container = document.getElementById("collection-items");
  container.innerHTML = ""; // 一度空にする

  // 💡 スマホでも自動で3〜4列に並ぶ「魔法の整列設定（CSS Grid）」をJavaScriptから直接注入！
  container.style.display = "grid";
  container.style.gridTemplateColumns = "repeat(auto-fill, minmax(100px, 1fr))"; // 最低100pxで敷き詰める
  container.style.gap = "8px";
  container.style.justifyContent = "start";

  let hasCharacter = false;

  itemDataMaster.forEach(data => {
    const state = gameStateItems[data.id];
    if (state && state.count > 0) {
      hasCharacter = true;

      // レア度によって枠と文字の色を変える！
      let borderColor = "#7f8c8d"; // N (グレー)
      if (data.rarity === "R") borderColor = "#3498db";   // 青
      if (data.rarity === "SR") borderColor = "#9b59b6";  // 紫
      if (data.rarity === "SSR") borderColor = "#f1c40f"; // 金
      if (data.rarity === "UR") borderColor = "#ff00ff";  // ピンク
      if (data.rarity === "LR") borderColor = "#ff0000";  // 赤

      // 📱 ポケモン図鑑風のコンパクトなカードデザイン！
      container.innerHTML += `
        <div style="background: linear-gradient(135deg, #2c3e50, #1a252f); border: 2px solid ${borderColor}; border-radius: 8px; padding: 8px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.5); position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; min-height: 120px;">
          
          <div style="position: absolute; top: 0; left: 0; background: ${borderColor}; color: #000; font-size: 10px; font-weight: bold; padding: 2px 6px; border-bottom-right-radius: 8px;">No.${data.id}</div>
          
          <div style="font-size: 11px; color: ${borderColor}; font-weight: bold; margin-top: 12px;">【${data.rarity}】</div>
          <div style="font-weight: bold; color: #fff; font-size: 12px; margin: 4px 0; line-height: 1.2;">${data.name}</div>
          
          <div style="font-size: 9px; color: #bdc3c7; text-align: left; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 4px; line-height: 1.2;">${data.desc}</div>
          
          <div style="margin-top: auto; border-top: 1px solid #34495e; padding-top: 4px;">
            <div style="font-size: 11px; color: #f1c40f; font-weight: bold;">Lv.${state.count}</div>
            <div style="font-size: 10px; color: #2ecc71;">+${formatNumber(data.income * state.count)}G/秒</div>
          </div>
        </div>
      `;
    }
  });

  // まだ誰も持っていない場合の表示
  if (!hasCharacter) {
    container.style.display = "block"; // 文字だけの時はGridを解除
    container.innerHTML = `<div style="color:#7f8c8d; width:100%; text-align:center; padding-top: 20px;">ガチャを回して社畜を集めよう！</div>`;
  }
}



// 🔄 画面の数字を最新にする機能
function updateUI() {
  document.getElementById("gold").innerText = formatNumber(Math.floor(gold));
  document.getElementById("gps").innerText = formatNumber(goldPerSecond);

  // 3つのガチャボタンのお金チェック
  const btnNormal = document.getElementById("gacha-normal");
  if (btnNormal) btnNormal.style.opacity = gold >= 500 ? "1" : "0.5";

  const btnBlack = document.getElementById("gacha-black");
  if (btnBlack) btnBlack.style.opacity = gold >= 500000 ? "1" : "0.5";

  const btnDemon = document.getElementById("gacha-demon");
  if (btnDemon) btnDemon.style.opacity = gold >= 500000000 ? "1" : "0.5";

  // もし錬成画面の更新機能があれば呼ぶ
  if (typeof updateSynthesisUI === 'function') updateSynthesisUI();
}


// 👑 全国ランキングシステム（データベース通信）
// ==========================================

// 📖 データベースからランキングを読み込んで画面に出す機能
async function loadRanking() {
  try {
    const res = await fetch('/api/ranking');
    const ranking = await res.json();
    const list = document.getElementById("rankingList");
    list.innerHTML = "";

    if (ranking.length === 0) {
      list.innerHTML = "<li>まだ誰も登録していません！1位になる大チャンス！</li>";
    } else {
      ranking.forEach((entry, index) => {
        list.innerHTML += `<li style="margin-bottom:5px; border-bottom:1px solid #34495e; padding-bottom:5px;">
          <span style="color:#f1c40f; font-weight:bold;">${index + 1}位</span>: ${entry.name} - ${formatNumber(entry.score)} G
        </li>`;
      });
    }
  } catch (e) {
    console.log("ランキング読み込みエラー", e);
    document.getElementById("rankingList").innerHTML = "<li>通信エラー：ランキングを取得できませんでした</li>";
  }
}

// ゲームを開いた時にランキングを読み込む！
loadRanking();

// 📤 「登録する」ボタンを押した時の処理
document.getElementById("submitScoreBtn").addEventListener("click", async () => {
  if (gold === 0) {
    alert("スコアが0Gです！まずはスライムをタップして稼ぎましょう！");
    return;
  }

  const myName = prompt("ランキングに登録する名前（シグマネーム）を入力してください", "名無し");
  if (!myName) return;

  try {
    const res = await fetch('/api/ranking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: myName, score: gold })
    });

    if (res.ok) {
      alert("🔥 全国ランキングにスコアを刻み込みました！");
      loadRanking(); // ランキングを最新に更新
    }
  } catch (e) {
    alert("通信エラーが発生しました。女神が倒れているかもしれません。");
  }
});



// ==========================================
// 😈 グローバル・レイドボス通信システム（デバッグ版）
// ==========================================

async function fetchBoss() {
  try {
    const res = await fetch('/api/raidboss');
    const boss = await res.json();
    console.log("📖 サーバーからボスのHPを受信しました:", boss.hp); // ★ログ追加
    updateBossUI(boss);
  } catch (e) { console.error("❌ ボス取得エラー:", e); }
}

async function sendDamage() {
  console.log("⚔️ 5秒経過。現在の貯まったダメージ:", pendingDamage); // ★ログ追加

  if (pendingDamage <= 0) {
    console.log("💤 送信するダメージがないのでお休みします"); // ★ログ追加
    return;
  }

  const damageToSend = pendingDamage;
  pendingDamage = 0;

  try {
    console.log(`🚀 サーバーへ ${damageToSend} ダメージを送信中...！`); // ★ログ追加
    const res = await fetch('/api/raidboss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: myPlayerName, damage: damageToSend })
    });

    if (!res.ok) {
      console.error("❌ サーバーがエラーを返しました。ステータス:", res.status); // ★ログ追加
    } else {
      console.log("✅ ダメージ送信成功！"); // ★ログ追加
    }

    const boss = await res.json();
    updateBossUI(boss);
  } catch (e) {
    console.error("❌ 通信そのものに失敗しました:", e); // ★ログ追加
    pendingDamage += damageToSend;
  }
}

function updateBossUI(boss) {
  document.getElementById("bossName").innerText = boss.name;
  document.getElementById("bossHpText").innerText = formatNumber(boss.hp) + " / " + formatNumber(boss.maxHp);
  const hpPercent = (boss.hp / boss.maxHp) * 100;
  document.getElementById("bossHpBar").style.width = hpPercent + "%";
  if (boss.hp <= 0) {
    document.getElementById("bossDefeatedMsg").style.display = "block";
    document.getElementById("bossDefeatedMsg").innerText = `🎉 討伐完了！トドメを刺した勇者: ${boss.defeatedBy} 🎉`;
    document.getElementById("bossHpBar").style.width = "0%";
  }
}



// 📱 スマホアプリ風 タブ切り替えシステム
function switchScreen(screenId) {
  const screens = document.querySelectorAll('.app-screen');
  screens.forEach(screen => {
    screen.classList.remove('active');
    screen.style.display = 'none';
  });

  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.add('active');
    targetScreen.style.display = 'block';
  }
  window.scrollTo(0, 0);
}

// ==========================================
// ⚒️ 悪魔の五体錬成システム
// ==========================================

// 錬成画面の「所持数」と「ボタンの光」を最新にする機能
function updateSynthesisUI() {
  const counts = { 'N': 0, 'R': 0, 'SR': 0, 'SSR': 0, 'UR': 0, 'LR': 0 };

  // 今持っているキャラのレアリティごとの合計を計算
  itemDataMaster.forEach(data => {
    const state = gameStateItems[data.id];
    if (state && state.count > 0 && counts[data.rarity] !== undefined) {
      counts[data.rarity] += state.count;
    }
  });

  // ボタンと文字を更新
  ['N', 'R', 'SR', 'SSR', 'UR', 'LR'].forEach(rarity => {
    const countText = document.getElementById(`count-${rarity}`);
    if (countText) countText.innerText = `所持: ${counts[rarity]}体`;

    const btn = document.getElementById(`btn-synth-${rarity}`);
    if (btn) {
      btn.disabled = counts[rarity] < 5; // 5体未満ならボタンを押せなくする！
    }
  });
}

// ⚒️ 錬成ボタンを押した時の実行処理
function doSynthesis(fromRarity, toRarity) {
  // そのレアリティの「持っているキャラリスト」を作る
  let ownedFrom = [];
  itemDataMaster.forEach(data => {
    if (data.rarity === fromRarity) {
      const state = gameStateItems[data.id];
      if (state && state.count > 0) {
        ownedFrom.push({ id: data.id, count: state.count });
      }
    }
  });

  // 合計が5体あるか再確認（ズル防止）
  let totalFrom = ownedFrom.reduce((sum, item) => sum + item.count, 0);
  if (totalFrom < 5) return;

  // 😈 生贄処理：持っているキャラから合計5体をランダムに減らす！
  let remainingToDeduct = 5;
  for (let i = 0; i < ownedFrom.length && remainingToDeduct > 0; i++) {
    let deduct = Math.min(ownedFrom[i].count, remainingToDeduct);
    gameStateItems[ownedFrom[i].id].count -= deduct;
    remainingToDeduct -= deduct;
  }

  // ✨ 召喚処理：1つ上のレアリティのキャラからランダムに1体選ぶ！
  const targetPool = itemDataMaster.filter(data => data.rarity === toRarity);
  if (targetPool.length === 0) {
    alert(`エラー：${toRarity} のキャラがデータにいません！`);
    return;
  }
  const randomTarget = targetPool[Math.floor(Math.random() * targetPool.length)];

  // 新しいキャラを付与！
  if (!gameStateItems[randomTarget.id]) gameStateItems[randomTarget.id] = { count: 0, cost: 0 };
  gameStateItems[randomTarget.id].count += 1;

  // 🧠 脳汁演出！
  document.body.classList.add("shake-active");
  setTimeout(() => document.body.classList.remove("shake-active"), 100);

  const resDiv = document.getElementById("synthResult");
  resDiv.innerHTML = `✨ 錬成大成功！✨<br>【${toRarity}】 ${randomTarget.name} が誕生した！`;
  resDiv.style.color = "#f1c40f";

  // 全部の画面を最新に更新してセーブ！
  calculateGPS();
  updateUI();
  if (typeof updateCollectionUI === 'function') updateCollectionUI();
  updateSynthesisUI();
  saveGame();
}

// 🔄 updateUI() の中に「錬成画面の更新」も混ぜる
const originalUpdateUIForSynth = updateUI;
updateUI = function () {
  originalUpdateUIForSynth(); // 今までの更新処理
  updateSynthesisUI();        // 追加：錬成画面の更新
};



// ==========================================
// 💣 全データ消去＆最初からやり直す機能
// ==========================================
function resetGame() {
  if (confirm("⚠️ 本当に最初からやり直しますか？\n（所持ゴールドやキャラは消去されますが、プレミアム課金の権利は残ります！）")) {
    
    gold = 0;
    goldPerSecond = 0;
    gameStateItems = {};
    totalPulls = 0;
    lifetimeClicks = 0;
    // 💡 isPremium = false; には絶対にしない！！（課金は残す）

    // セーブデータを一度消して、即座に今の状態（課金だけ残った状態）で上書きセーブ！
    localStorage.removeItem("clicker_save_data");
    saveGame(); 

    updateUI();
    if (typeof updateCollectionUI === 'function') updateCollectionUI();
    if (typeof updateSynthesisUI === 'function') updateSynthesisUI();
    calculateGPS();
    if (typeof applyPremiumState === 'function') applyPremiumState();

    alert("🔄 データをリセットしました。新たな過労死ライフの始まりです！");
    window.scrollTo(0, 0);
  }
}

// ==========================================
// 💀 村人B やつれシステム
// ==========================================

function updateVillagerFace() {
  const faceImg = document.getElementById("villagerFace");
  if (!faceImg) return;

  // 🔄 クリック数に応じた「やつれ段階」の判定
  // 画像が何枚あっても、ここに else if を足していけばOK！
  let faceNumber = 1; // 最初は元気

  if (lifetimeClicks >= 10000) {
    faceNumber = 4; // 1万クリックで「限界」
  } else if (lifetimeClicks >= 5000) {
    faceNumber = 3; // 5千クリックで「やつれた」
  } else if (lifetimeClicks >= 1000) {
    faceNumber = 2; // 千クリックで「少し疲れた」
  } else {
    faceNumber = 1; // それ未満は「元気」
  }

  // 画像のURLを更新する（例: images/face_2.png）
  const newSrc = `images/face_${faceNumber}.png`;

  // 💡 パフォーマンス対策：画像が変わる時だけ差し替える
  if (!faceImg.src.includes(newSrc)) {
    faceImg.src = newSrc;

    // 【ブレインロッド演出】顔が変わった瞬間に、画面を赤く光らせる！
    document.body.style.animation = "feverFlash 0.3s ease";
    setTimeout(() => document.body.style.animation = "", 300);
  }
}

// ==========================================
// 📂 セーブ＆ロード機能（プレミアム完全対応版！）
// ==========================================
function saveGame() {
  const saveData = {
    gold: gold,
    goldPerSecond: goldPerSecond,
    items: gameStateItems,
    totalPulls: totalPulls,
    lifetimeClicks: lifetimeClicks,
    isPremium: typeof isPremium !== 'undefined' ? isPremium : false // 👑 課金フラグを確実に保存！
  };
  localStorage.setItem("clicker_save_data", JSON.stringify(saveData));
}

function loadGame() {
  const saved = localStorage.getItem("clicker_save_data");
  if (saved) {
    const data = JSON.parse(saved);
    gold = data.gold || 0;
    goldPerSecond = data.goldPerSecond || 0;
    gameStateItems = data.items || {};
    totalPulls = data.totalPulls || 0;
    lifetimeClicks = data.lifetimeClicks || 0;
    
    // 👑 課金状況をしっかり思い出す！
    if (typeof isPremium !== 'undefined') {
      isPremium = data.isPremium || false; 
    }
  }

  // 👑 ロード直後にプレミアム状態（広告消去など）を復元する！
  if (typeof applyPremiumState === 'function') applyPremiumState(); 

  calculateGPS();
  updateUI();
  if (typeof updateVillagerFace === 'function') updateVillagerFace();
  if (typeof updateCollectionUI === 'function') updateCollectionUI();
  if (typeof updateSynthesisUI === 'function') updateSynthesisUI();
}



// ==========================================
// 🚀 ゲーム起動＆心臓部（※絶対にファイルの一番下に書く！）
// ==========================================

// 1. 【超重要】心臓が動く前に、まず記憶をロードする！！
loadGame();

// 2. 記憶を取り戻した後で、心臓（オートセーブ）を動かし始める！！
setInterval(() => {
  if (goldPerSecond > 0) {
    gold += goldPerSecond;
    document.getElementById("gold").innerText = formatNumber(Math.floor(gold));
    updateUI();
  }

  // 💾 毎秒オートセーブ（ロード後に動くから安心！）
  saveGame();
}, 1000);

// ==========================================
// ⚡ 秘薬（ダイレクトリンク広告）システム
// ==========================================


// 💡 秘薬ボタンが押されたら動く機能（VIP広告スキップ対応版！）
function useSecretPotion() {
  if (boostTimeRemaining > 0) {
    alert("💀 すでに限界突破中です！これ以上は村人が壊れます！");
    return;
  }

  // 👑 プレミアムユーザーは、確認画面も広告タブも無しで「即発動」！！
  if (typeof isPremium !== 'undefined' && isPremium) {
    activateEnergyDrink();
    return;
  }

  // 👇 以下は無課金ユーザーへの今までの処理（広告を開く）
  const confirmWatch = confirm("📺 スポンサーのページを開いて秘薬をゲットしますか？\n（※別タブで開きます）");

  if (confirmWatch) {
    // 💰 MonetagのURL
    const monetagDirectLink = "https://omg10.com/4/10803965";
    window.open(monetagDirectLink, "_blank");
    activateEnergyDrink();
  }
}

// 💉 実際に秘薬を注入して画面を赤くする処理
function activateEnergyDrink() {
  boostTimeRemaining = 60; // 3分間

  const btn = document.getElementById("secretPotionBtn");
  if (btn) btn.style.display = "none";
  const timerText = document.getElementById("boostTimerText");
  if (timerText) timerText.style.display = "block";

  document.body.style.transition = "background-color 0.5s";
  document.body.style.backgroundColor = "#4a0000";

  calculateGPS();
  updateUI();

  boostInterval = setInterval(() => {
    boostTimeRemaining--;
    const timeSpan = document.getElementById("boostTime");
    if (timeSpan) timeSpan.innerText = boostTimeRemaining;

    if (boostTimeRemaining <= 0) {
      clearInterval(boostInterval);
      if (btn) btn.style.display = "block";
      if (timerText) timerText.style.display = "none";
      document.body.style.backgroundColor = "";

      alert("💀 秘薬の成分が切れました。通常の過労に戻ります。");

      calculateGPS();
      updateUI();
    }
  }, 1000);
}

// ==========================================
// 👑 本物のプレミアム課金システム（最速リリース用・固定コード方式）
// ==========================================

// ① 購入ボタンを押した時の処理（Stripeの決済ページへ飛ばす）
function openPaymentPage() {
  // ⚠️ Stripeで発行した本物の決済URLをここに入れます！（今はダミーのURLです）
  const paymentUrl = "https://buy.stripe.com/テスト用のアドレス";

  if (confirm("安全な外部の決済ページ（Stripe）に移動します。よろしいですか？\n※決済完了後、画面に表示される『解放コード』を忘れずにメモしてください！")) {
    window.open(paymentUrl, "_blank");
  }
}

// ② コードを入力して「解放」を押した時の処理
function unlockPremium() {
  // 念のため、すでに買っているかチェック
  if (typeof isPremium !== 'undefined' && isPremium) {
    alert("👑 すでにプレミアム特権が解放されています！");
    return;
  }

  // プレイヤーが入力した文字を取得
  const inputElement = document.getElementById("premiumSecretCode");
  if (!inputElement) return;
  const inputCode = inputElement.value.trim();

  // 🔑 ここが極秘の「解放コード」です！（好きな文字に変更してください！）
  const SECRET_PASS = "OVERWORK-VIP-777";

  if (inputCode === SECRET_PASS) {
    alert("✨ コード承認！✨\n神様、ご支援ありがとうございます！プレミアムパックが解放されました！");

    // 課金フラグをONにしてセーブ＆画面更新！
    isPremium = true;
    saveGame();
    applyPremiumState();
    calculateGPS();
    updateUI();
  } else {
    alert("❌ コードが間違っています。前後にスペースなどが入っていないか確認してください。");
  }
}

// ③ プレミアム状態の画面に書き換える機能
function applyPremiumState() {
  if (typeof isPremium !== 'undefined' && isPremium) {
    // 1. ショップを消して所有メッセージを出す
    const shopArea = document.getElementById("premium-shop-area");
    if (shopArea) shopArea.style.display = "none";
    const ownedMsg = document.getElementById("premium-owned-msg");
    if (ownedMsg) ownedMsg.style.display = "block";

    // 2. バナー広告枠を消し去る
    const banner = document.getElementById("smart-banner-ad");
    if (banner) banner.style.display = "none";

    // 3. 秘薬ボタンを「VIP仕様（広告なし）」にする
    const potionBtn = document.getElementById("secretPotionBtn");
    if (potionBtn) {
      potionBtn.innerHTML = "👑 VIP特権で秘薬を飲む！<br><span style='font-size: 12px;'>(広告なしで即発動！ / 1分間タップ10倍)</span>";
      potionBtn.style.background = "linear-gradient(45deg, #f1c40f, #f39c12)";
      potionBtn.style.boxShadow = "0 4px 0 #d35400";
    }
  }
}
