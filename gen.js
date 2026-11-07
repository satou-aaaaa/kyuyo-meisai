// 給与明細よみ の問題（ブラウザと node の両方で使う）。
// 問題は全部ここに並べて作る（BANK）。1問は「種類|中身の名前」の key を持ち、同じ key ならいつも同じ問題・同じ並びの選び肢になる。
// 中身は国税庁・日本年金機構・協会けんぽ・厚生労働省・総務省の案内に合わせる（出どころは SRC。遊び方・README にも書く）。人・会社の名前はすべて架空。
// 保険料は「標準報酬月額 × 料率 ÷ 2」（労使折半）、雇用保険料は「総支給額 × 本人の率」で計算し、QA が明細の数字から計算し直す。
// 所得税・住民税の金額は例（本物は税額表・市区町村の通知で決まる）。明細の下にそう書く。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ日なら、どの端末でも同じ問題になる。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];

  // 出どころ（短い名前と URL）
  const SRC = {
    nenkin: ["日本年金機構「厚生年金保険の保険料」", "https://www.nenkin.go.jp/service/kounen/hokenryo/hoshu/20150515-01.html"],
    teiji: ["日本年金機構「定時決定（算定基礎届）」", "https://www.nenkin.go.jp/service/kounen/hokenryo/hoshu/20121017.html"],
    shinsha: ["日本年金機構「新社会人のみなさんへ」(2026年版)", "https://www.nenkin.go.jp/service/learn/seidosetsumei.files/shinshakai2026.pdf"],
    kenpo: ["協会けんぽ「令和8年度の保険料率」", "https://www.kyoukaikenpo.or.jp/about/business/insurance_rate/rate_prefectures/r08/index.html"],
    kenpo2: ["協会けんぽ「保険料と標準報酬月額」", "https://www.kyoukaikenpo.or.jp/about/business/overview/001/index.html"],
    kaigo: ["協会けんぽ「介護保険制度」", "https://www.kyoukaikenpo.or.jp/about/business/insurance_rate/002/index.html"],
    koyo: ["厚生労働省「令和8年度の雇用保険料率」", "https://jsite.mhlw.go.jp/tokyo-hellowork/list/tachikawa/kyushokusha/koyouhokenryouritu08.html"],
    zeigaku: ["国税庁「源泉徴収税額表」(令和8年分)", "https://www.nta.go.jp/publication/pamph/gensen/zeigakuhyo2026/data/all.pdf"],
    tsukin: ["国税庁 タックスアンサー No.2582「電車・バスなどの通勤手当の非課税限度額」", "https://www.nta.go.jp/taxes/shiraberu/taxanswer/gensen/2582.htm"],
    nencho: ["国税庁 タックスアンサー No.2662「年末調整のしかた」", "https://www.nta.go.jp/taxes/shiraberu/taxanswer/gensen/2662.htm"],
    shakaikojo: ["国税庁 タックスアンサー No.1130「社会保険料控除」", "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1130.htm"],
    kiso: ["国税庁「令和7年度税制改正による所得税の基礎控除の見直し等について」", "https://www.nta.go.jp/users/gensen/2025kiso/index.htm"],
    jumin: ["総務省「個人住民税」", "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/individual-inhabitant-tax.html"],
  };

  // 料率（2026年度）。健康保険は協会けんぽ東京支部
  const RATE = { kenpo: 9.85, kaigo: 1.62, nenkin: 18.3, koyo: 5 }; // 雇用保険は 1,000分の5
  // 本人の負担の端数：50銭以下は切り捨て、50銭を超えたら切り上げ（協会けんぽの保険料額表）
  const yen = (v) => { const f = Math.floor(v + 1e-9); return v - f > 0.5 + 1e-9 ? f + 1 : f; };
  const half = (std, r) => yen(std * r / 100 / 2);
  const koyoOf = (gross) => yen(gross * RATE.koyo / 1000);
  const n = (v) => v.toLocaleString("ja-JP");

  // 架空の人：id・名前・年齢・標準報酬月額（等級表にある額）・基本給・残業・通勤（電車）・ほかの手当・所得税（例）・住民税（例）
  const PEOPLE = [
    { id: "a", nm: "青木 ひなた", age: 22, std: 200000, base: 190000, ot: 8000, tsu: 9800, te: [], tax: 3770, ju: 0, shin: 1 },
    { id: "b", nm: "石田 そら", age: 23, std: 220000, base: 205000, ot: 12400, tsu: 12000, te: [], tax: 4250, ju: 0, shin: 1 },
    { id: "c", nm: "上野 まこと", age: 27, std: 240000, base: 222000, ot: 16000, tsu: 10200, te: [], tax: 4770, ju: 9800 },
    { id: "d", nm: "大川 ゆう", age: 31, std: 280000, base: 250000, ot: 20600, tsu: 14800, te: [["住宅手当", 10000]], tax: 5880, ju: 13200 },
    { id: "e", nm: "加藤 みのり", age: 35, std: 300000, base: 270000, ot: 24000, tsu: 8600, te: [["家族手当", 5000]], tax: 5170, ju: 14700 },
    { id: "f", nm: "木村 あきら", age: 39, std: 320000, base: 286000, ot: 18200, tsu: 16400, te: [["資格手当", 5000]], tax: 6750, ju: 16100 },
    { id: "g", nm: "工藤 さくら", age: 40, std: 340000, base: 300000, ot: 22000, tsu: 13600, te: [["家族手当", 10000]], tax: 5960, ju: 17400 },
    { id: "h", nm: "小林 けい", age: 44, std: 360000, base: 318000, ot: 26400, tsu: 11800, te: [["役職手当", 10000]], tax: 7970, ju: 18900 },
    { id: "i", nm: "斉藤 なお", age: 48, std: 380000, base: 336000, ot: 21600, tsu: 15200, te: [["住宅手当", 15000]], tax: 8790, ju: 20300 },
    { id: "j", nm: "杉本 れい", age: 52, std: 410000, base: 362000, ot: 30000, tsu: 12600, te: [["役職手当", 15000]], tax: 9980, ju: 22800 },
    { id: "k", nm: "高橋 ちひろ", age: 57, std: 440000, base: 390000, ot: 24800, tsu: 17000, te: [["役職手当", 20000]], tax: 11050, ju: 24600 },
    { id: "l", nm: "田中 かおる", age: 63, std: 300000, base: 280000, ot: 6400, tsu: 9400, te: [], tax: 6390, ju: 15800 },
    { id: "m", nm: "中村 いつき", age: 25, std: 260000, base: 236000, ot: 14000, tsu: 21600, te: [], tax: 5130, ju: 11900 },
    { id: "n", nm: "西田 はる", age: 29, std: 300000, base: 262000, ot: 28800, tsu: 7400, te: [["住宅手当", 8000]], tax: 6260, ju: 14200 },
    { id: "o", nm: "野口 すみれ", age: 46, std: 470000, base: 420000, ot: 18000, tsu: 19600, te: [["役職手当", 25000]], tax: 12470, ju: 27300 },
    { id: "p", nm: "林 こうへい", age: 34, std: 340000, base: 296000, ot: 32400, tsu: 10800, te: [["資格手当", 8000]], tax: 7600, ju: 17900 },
  ];
  const kaigoAge = (age) => age >= 40 && age <= 64; // 介護保険料は40歳から64歳まで（第2号被保険者）

  // 明細の数字を計算する
  function calc(p) {
    const pay = [["基本給", p.base], ...p.te, ["残業手当", p.ot], ["通勤手当（非課税）", p.tsu]];
    const gross = pay.reduce((s, x) => s + x[1], 0);
    const ded = [["健康保険", half(p.std, RATE.kenpo)]];
    if (kaigoAge(p.age)) ded.push(["介護保険", half(p.std, RATE.kaigo)]);
    ded.push(["厚生年金", half(p.std, RATE.nenkin)], ["雇用保険", koyoOf(gross)]);
    const sha = ded.reduce((s, x) => s + x[1], 0);
    ded.push(["所得税", p.tax], ["住民税", p.ju]);
    const dsum = ded.reduce((s, x) => s + x[1], 0);
    return { pay, ded, gross, sha, dsum, net: gross - dsum, kazei: gross - p.tsu - sha };
  }
  // 明細の場面。hide：「？」にする行の名前
  function slip(p, hide, extra) {
    const c = calc(p), h = (k, v) => (hide && hide.includes(k) ? "？" : n(v) + "円");
    const s = { t: "slip", nm: `${p.nm} さん（${p.age}歳）`, when: "2026年4月25日 支給", std: n(p.std) + "円",
      pay: c.pay.map(([k, v]) => [k, h(k, v)]), ded: c.ded.map(([k, v]) => [k, h(k, v)]),
      tot: [["総支給額", h("総支給額", c.gross)], ["控除合計", h("控除合計", c.dsum)], ["差引支給額", h("差引支給額", c.net)]] };
    if (extra && extra.mark) s.mark = extra.mark;
    return s;
  }
  const PD = Object.fromEntries(PEOPLE.map((p) => [p.id, p]));

  const B = []; // BANK
  const add = (kind, id, q) => B.push({ key: kind + "|" + id, kind, ...q });
  const near = (v, ds) => [v, ...ds.map((d) => v + d)].filter((x) => x > 0).map((x) => n(x) + "円");

  // ---- やさしい ----
  // 引かれるもの（控除）はどれ？
  PEOPLE.forEach((p) => ["健康保険", "厚生年金", "所得税", "住民税"].forEach((d, i) => {
    if (d === "住民税" && !p.ju) return;
    const pays = calc(p).pay.map((x) => x[0]);
    add("kojo", `${p.id}-${i}`, { scene: slip(p), text: "給料から「引かれるもの（控除）」はどれ？",
      opts: [d, pays[0], pays[pays.length - 1]], ans: d, src: ["shinsha"],
      why: `明細は「支給」（もらう分）と「控除」（引かれる分）に分かれています。${d}は控除の欄にあります。` });
  }));
  // 実際に振り込まれる額はどれ？（差引支給額）
  PEOPLE.forEach((p) => {
    const c = calc(p);
    add("tedori", p.id, { scene: slip(p), text: "実際に口座に振り込まれる額はどれ？",
      opts: [n(c.net) + "円", n(c.gross) + "円", n(c.dsum) + "円"], ans: n(c.net) + "円", src: ["shinsha"],
      why: `振り込まれるのは「差引支給額」です。総支給額${n(c.gross)}円から控除合計を引いた額です。` });
  });
  // 総支給額を足して出す
  PEOPLE.forEach((p) => {
    const c = calc(p);
    add("sou", p.id, { scene: slip(p, ["総支給額", "控除合計", "差引支給額"]), text: "総支給額（？）はいくら？",
      opts: near(c.gross, [-p.tsu, p.tsu * 2 > 0 ? 10000 : 1000]), ans: n(c.gross) + "円", src: ["shinsha"],
      why: `総支給額は「支給」の欄を全部足した額です。通勤手当も入ります。` });
  });
  // 差引支給額を出す
  PEOPLE.forEach((p) => {
    const c = calc(p);
    add("sashi", p.id, { scene: slip(p, ["差引支給額"]), text: "差引支給額（？）はいくら？",
      opts: near(c.net, [c.dsum, -10000]), ans: n(c.net) + "円", src: ["shinsha"],
      why: `差引支給額＝総支給額${n(c.gross)}円−控除合計${n(c.dsum)}円です。` });
  });
  // 税金と保険を分ける
  const TAXES = ["所得税", "住民税"], INS = ["健康保険", "厚生年金", "雇用保険", "介護保険"];
  TAXES.forEach((t, i) => INS.forEach((s, j) => {
    add("zei", `t${i}-${j}`, { scene: { t: "q", text: "控除の欄にあるもののうち、「税金」はどれ？" }, text: "",
      opts: [t, s, INS[(j + 1) % 4]], ans: t, src: ["shakaikojo", "jumin"],
      why: `${t}は税金です。健康保険・介護保険・厚生年金・雇用保険は「社会保険料」で、税金ではありません。` });
    add("zei", `s${i}-${j}`, { scene: { t: "q", text: "控除の欄にあるもののうち、「社会保険料」はどれ？" }, text: "",
      opts: [s, t, TAXES[1 - i]], ans: s, src: ["shakaikojo"],
      why: `${s}は社会保険料です。所得税・住民税は税金です。` });
  }));

  // ---- ふつう ----
  // 厚生年金を計算する
  PEOPLE.forEach((p) => {
    const v = half(p.std, RATE.nenkin);
    add("nenkin", p.id, { scene: slip(p, ["厚生年金", "控除合計", "差引支給額"]), text: `厚生年金（？）はいくら？ 料率は18.3%で、会社と本人が半分ずつ払います。`,
      opts: near(v, [v, -Math.round(v / 2)]), ans: n(v) + "円", src: ["nenkin", "shinsha"],
      why: `標準報酬月額${n(p.std)}円×18.3%÷2＝${n(v)}円。給料そのものでなく、標準報酬月額にかけます。` });
  });
  // 健康保険を計算する
  PEOPLE.forEach((p) => {
    const v = half(p.std, RATE.kenpo);
    add("kenpo", p.id, { scene: slip(p, ["健康保険", "控除合計", "差引支給額"]), text: `健康保険（？）はいくら？ 料率は9.85%（東京・2026年度）で、半分ずつ払います。`,
      opts: near(v, [v, yen(calc(p).gross * RATE.kenpo / 100 / 2) - v || 500]), ans: n(v) + "円", src: ["kenpo", "kenpo2"],
      why: `標準報酬月額${n(p.std)}円×9.85%÷2＝${n(v)}円。会社も同じ額を払います。` });
  });
  // 雇用保険を計算する
  PEOPLE.forEach((p) => {
    const c = calc(p), v = koyoOf(c.gross), wrong = koyoOf(p.std);
    add("koyo", p.id, { scene: slip(p, ["雇用保険", "控除合計", "差引支給額"]), text: `雇用保険（？）はいくら？ 本人の率は1,000分の5（2026年度・一般の事業）です。`,
      opts: [...new Set([v, wrong === v ? v + 100 : wrong, v * 2])].map((x) => n(x) + "円"), ans: n(v) + "円", src: ["koyo"],
      why: `雇用保険料は、標準報酬月額でなく、その月の総支給額にかけます。${n(c.gross)}円×5/1000＝${n(v)}円。` });
  });
  // 介護保険はある？ない？
  PEOPLE.forEach((p) => {
    const has = kaigoAge(p.age);
    add("kaigo", p.id, { scene: { t: "q", text: `${p.age}歳の会社員です。毎月の給料から介護保険料は引かれる？` }, text: "",
      opts: ["引かれる", "引かれない"], ans: has ? "引かれる" : "引かれない", src: ["kaigo"],
      why: has ? `40歳から64歳までの人は、健康保険といっしょに介護保険料を払います。` : `会社の給料から介護保険料が引かれるのは40歳から64歳までです。${p.age}歳は対象外です。` });
  });
  // 所得税がかからない支給
  PEOPLE.forEach((p) => {
    const c = calc(p), others = c.pay.filter((x) => !/通勤/.test(x[0])).map((x) => x[0]);
    add("hikazei", p.id, { scene: slip(p), text: "この明細の支給のうち、所得税がかからないものは？",
      opts: ["通勤手当（非課税）", others[0], others[others.length - 1]], ans: "通勤手当（非課税）", src: ["tsukin"],
      why: `電車・バスの通勤手当は、1か月15万円までは所得税がかかりません。${n(p.tsu)}円はその中です。` });
  });
  // 住民税が0円の新社会人
  PEOPLE.filter((p) => p.shin).forEach((p) => ["", "-2"].forEach((s, i) => {
    add("jumin", p.id + s, { scene: slip(p), text: i ? "住民税はいつの所得をもとに決まる？" : "この人は今年の春に働き始めました。住民税が0円なのはなぜ？",
      opts: i ? ["前の年の所得", "その月の給料", "来年の見込みの所得"] : ["住民税は前の年の所得にかかるから", "会社がかわりに払うから", "22歳までは住民税がないから"],
      ans: i ? "前の年の所得" : "住民税は前の年の所得にかかるから", src: ["jumin"],
      why: `住民税は前の年（1月〜12月）の所得で決まり、給料から毎月引かれます。前の年に所得が無いと、1年目はふつう引かれません。` });
  }));
  // 会社も払う
  ["健康保険", "厚生年金"].forEach((k, i) => PEOPLE.slice(0, 6).forEach((p) => {
    const v = half(p.std, k === "健康保険" ? RATE.kenpo : RATE.nenkin);
    add("oriha", `${i}-${p.id}`, { scene: slip(p), text: `明細の${k}は${n(v)}円。会社はいくら払っている？`,
      opts: [`本人と同じ${n(v)}円`, "0円（本人だけが払う）", `本人の2倍の${n(v * 2)}円`], ans: `本人と同じ${n(v)}円`, src: ["kenpo2", "nenkin"],
      why: `${k}の保険料は、会社と本人が半分ずつ（折半）払います。明細に出るのは本人の分だけです。` });
  }));

  // ---- むずかしい ----
  // 税額表で見る金額（社会保険料を引いた後・通勤手当を除く）
  PEOPLE.forEach((p) => {
    const c = calc(p);
    add("kazei", p.id, { scene: slip(p), text: "所得税の税額表（月額表）で見る金額は？",
      opts: [c.kazei, c.gross - c.sha, c.gross - p.tsu].map((x) => n(x) + "円"), ans: n(c.kazei) + "円", src: ["zeigaku", "tsukin"],
      why: `総支給額から、かからない通勤手当と社会保険料（${n(c.sha)}円）を引いた額で表を見ます。` });
  });
  // 標準報酬月額の決まり方
  const TEIJI = [
    ["標準報酬月額は、ふつう何月の給料から決まる？", ["4月・5月・6月の平均", "1月から12月の平均", "入社した月の給料だけ"], "4月・5月・6月の平均", "毎年、4・5・6月の報酬の平均で決め（定時決定）、その年の9月から使います。"],
    ["4〜6月で決まった標準報酬月額は、いつから使う？", ["その年の9月から", "その年の4月から", "次の年の1月から"], "その年の9月から", "定時決定の標準報酬月額は、9月から翌年8月まで使います。"],
    ["標準報酬月額を決める「報酬」に入るものは？", ["残業手当", "年に1回の結婚祝い金", "出張のときの宿代（実費）"], "残業手当", "報酬には基本給のほか、残業手当や通勤手当も入ります。"],
    ["通勤手当は、厚生年金の保険料の計算に入る？", ["入る", "入らない"], "入る", "通勤手当は所得税はかかりませんが、社会保険料を決める報酬には入ります。"],
    ["給料が大きく上がって、標準報酬月額が2等級以上変わったら？", ["9月を待たずに変わることがある", "次の年まで変わらない", "保険料が0円になる"], "9月を待たずに変わることがある", "固定の給料が変わって2等級以上ちがうと、随時改定で途中から変わります。"],
  ];
  TEIJI.forEach(([t, o, a, w], i) => add("hyojun", "t" + i, { scene: { t: "q", text: t }, text: "", opts: o, ans: a, src: ["teiji", "nenkin"], why: w }));
  // 介護保険の年齢の境目
  [38, 39, 40, 41, 50, 63, 64, 65, 66].forEach((age) => {
    const has = kaigoAge(age);
    add("kaigo2", "a" + age, { scene: { t: "q", text: `${age}歳の会社員です。給料から健康保険といっしょに引かれる介護保険料は？` }, text: "",
      opts: ["引かれる", "引かれない"], ans: has ? "引かれる" : "引かれない", src: ["kaigo"],
      why: has ? "40歳から64歳までの人（第2号被保険者）は、健康保険といっしょに介護保険料を払います。" : age >= 65 ? "65歳からは第1号被保険者になり、給料からいっしょには引かれません（年金などから納めます）。" : "介護保険料を健康保険といっしょに払うのは40歳からです。" });
  });
  // 年末調整
  const NENCHO = [
    ["年末調整は、何をするもの？", ["1年の所得税を正しい額に合わせる", "住民税を前払いする", "社会保険料を返してもらう"], "1年の所得税を正しい額に合わせる", "毎月の源泉徴収の合計と、1年分で本当に払う税額を一致させる手続きです。"],
    ["毎月の給料から引かれる所得税は？", ["1年分の見込みで前もって引いている", "1年分の確定した税額", "住民税の一部"], "1年分の見込みで前もって引いている", "毎月は税額表で前もって引き（源泉徴収）、年末調整で1年分に合わせます。"],
    ["年末調整で引かれすぎが分かったら？", ["多く引いた分が戻る", "次の年に持ちこす", "戻らない"], "多く引いた分が戻る", "1年の税額と合わせ、多く引いていた分は戻り、足りない分は引かれます。"],
  ];
  NENCHO.forEach(([t, o, a, w], i) => add("nencho", "n" + i, { scene: { t: "q", text: t }, text: "", opts: o, ans: a, src: ["nencho"], why: w }));
  // 社会保険料控除
  PEOPLE.forEach((p) => {
    const c = calc(p);
    add("shakai", p.id, { scene: slip(p), text: "この月の社会保険料の合計はいくら？（所得税の計算で差し引かれます）",
      opts: [c.sha, c.sha + p.tax, c.sha - koyoOf(c.gross)].map((x) => n(x) + "円"), ans: n(c.sha) + "円", src: ["shakaikojo"],
      why: `健康保険・${kaigoAge(p.age) ? "介護保険・" : ""}厚生年金・雇用保険を足すと${n(c.sha)}円。所得税・住民税は入りません。` });
  });
  // 基礎控除・給与所得控除（2025年分から）
  const KISO = [
    ["合計所得金額が132万円以下の人の、所得税の基礎控除は？（令和7年分から）", ["95万円", "48万円", "58万円"], "95万円", "令和7年度の改正で、132万円以下の人の基礎控除は48万円から95万円になりました。"],
    ["給与所得控除の、いちばん少ない額は？（令和7年分から）", ["65万円", "55万円", "103万円"], "65万円", "給与所得控除の最低保障額は、55万円から65万円になりました。"],
    ["基礎控除・給与所得控除の見直しは、毎月の源泉徴収の税額表にいつから入った？", ["令和8年1月から", "令和7年1月から", "令和9年1月から"], "令和8年1月から", "令和7年分は年末調整で反映し、毎月の税額表は令和8年1月から新しくなりました。"],
    ["合計所得金額が655万円を超え2,350万円以下の人の基礎控除は？（令和7年分から）", ["58万円", "95万円", "0円"], "58万円", "基礎控除は合計所得金額で変わり、この段は58万円です。"],
  ];
  KISO.forEach(([t, o, a, w], i) => add("kiso", "k" + i, { scene: { t: "q", text: t }, text: "", opts: o, ans: a, src: ["kiso"], why: w }));
  // 手取りが増えるのはどっち？（2人の明細を比べる）
  const PAIR = [["d", "l"], ["c", "m"], ["e", "n"], ["f", "g"], ["d", "e"], ["h", "p"], ["g", "p"], ["b", "c"], ["i", "j"]];
  PAIR.forEach(([x, y]) => {
    const A = PD[x], Bp = PD[y], ca = calc(A), cb = calc(Bp);
    if (ca.net === cb.net) return;
    const ans = ca.net > cb.net ? A.nm : Bp.nm;
    add("hikaku", x + y, { scene: { t: "two", a: slip(A), b: slip(Bp) }, text: "実際に振り込まれる額が多いのはどちら？",
      opts: [A.nm, Bp.nm], ans, src: ["shinsha"],
      why: `比べるのは総支給額でなく差引支給額です（${A.nm}${n(ca.net)}円、${Bp.nm}${n(cb.net)}円）。` });
  });

  // 種類：id・難しさ・帳に出す名前・見るところ（ヒント1）
  const KINDS = [
    { id: "kojo", lv: 0, name: "支給と控除", look: "明細は「支給」と「控除」の2つの欄に分かれています。" },
    { id: "tedori", lv: 0, name: "振り込まれる額", look: "いちばん下の「差引支給額」を見ましょう。" },
    { id: "sou", lv: 0, name: "総支給額", look: "支給の欄の数字を全部足します。" },
    { id: "sashi", lv: 0, name: "差引支給額", look: "総支給額から控除合計を引きます。" },
    { id: "zei", lv: 0, name: "税金と保険", look: "「税」が付くのはどれでしょう。" },
    { id: "nenkin", lv: 1, name: "厚生年金", look: "標準報酬月額に18.3%をかけて、半分にします。" },
    { id: "kenpo", lv: 1, name: "健康保険", look: "給料そのものでなく、標準報酬月額にかけます。" },
    { id: "koyo", lv: 1, name: "雇用保険", look: "雇用保険は、その月の総支給額にかけます。" },
    { id: "kaigo", lv: 1, name: "介護保険", look: "介護保険料を払うのは、何歳からでしょう。" },
    { id: "hikazei", lv: 1, name: "所得税がかからない支給", look: "支給の欄の（ ）の中を見ましょう。" },
    { id: "jumin", lv: 1, name: "住民税", look: "住民税は、いつの所得で決まるでしょう。" },
    { id: "oriha", lv: 1, name: "会社も払う", look: "保険料は、だれとだれで分けて払うでしょう。" },
    { id: "kazei", lv: 2, name: "税額表で見る金額", look: "所得税がかからない支給と、社会保険料を引きます。" },
    { id: "hyojun", lv: 2, name: "標準報酬月額", look: "毎年、決まった3か月の給料で決まります。" },
    { id: "kaigo2", lv: 2, name: "介護保険の年齢", look: "40歳から64歳までがひとまとまりです。" },
    { id: "nencho", lv: 2, name: "年末調整", look: "毎月の所得税は、まだ見込みの額です。" },
    { id: "shakai", lv: 2, name: "社会保険料の合計", look: "税金（所得税・住民税）は入れません。" },
    { id: "kiso", lv: 2, name: "基礎控除の見直し", look: "令和7年度の税制改正で変わりました。" },
    { id: "hikaku", lv: 2, name: "2人を比べる", look: "総支給額でなく、差引支給額を比べます。" },
  ];
  B.forEach((q) => { q.lv = KINDS.find((k) => k.id === q.kind).lv; });
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);
  const BANK = Object.fromEntries(B.map((q) => [q.key, q]));
  const keysOf = (kind) => B.filter((q) => q.kind === kind).map((q) => q.key);

  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const pickN = (R, arr, n) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };

  // 1問を作る。tag は key（「種類|中身」）。選び肢は key の種で並べ替える（2択は並びのまま）
  function make(tag) {
    const q = BANK[tag]; if (!q) return null;
    const k = BY[q.kind], opts = q.opts.length === 2 ? q.opts.slice() : pickN(rng(seedOf(tag)), q.opts, q.opts.length);
    return { tag, kind: q.kind, lv: k.lv, name: k.name, look: k.look, scene: q.scene, text: q.text || "", opts, ans: q.ans, why: q.why, src: q.src.map((s) => SRC[s]) };
  }
  const pickKey = (R, kind) => { const ks = keysOf(kind); return ks[Math.floor(R() * ks.length)]; };

  // 今日の5問（やさしい2・ふつう2・むずかしい1）。種類は重ねない
  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), m = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...m, ...h].map((id) => pickKey(R, id));
  }
  // 上級の3問（むずかしいだけ・今日の5問のむずかしいとは別の種類）
  function hardTags(date) {
    const dh = BANK[dailyTags(date)[4]].kind, R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id) => pickKey(R, id));
  }

  const G = { KINDS, BY, LV, SRC, RATE, PEOPLE, calc, kaigoAge, half, koyoOf, BANK, keysOf, kindsOf, seedOf, rng, make, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = G; else root.MEISAI = G;
})(typeof self !== "undefined" ? self : this);
