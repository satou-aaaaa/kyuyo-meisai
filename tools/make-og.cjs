// SNS で貼られたときの絵（og.png 1200×630）を作る。今日の問題（答え）は入れず、作りものの明細の例だけ。
// 使い方: node tools/make-og.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  const td = "border:3px solid #2a2420;padding:8px 12px;text-align:left";
  await p.setContent(`<body style="margin:0;font-family:'Noto Sans CJK JP','IPAPGothic',sans-serif">
  <div style="width:1200px;height:630px;box-sizing:border-box;padding:60px 70px;background:#f6f1e7;color:#2a2420;display:flex;gap:40px;align-items:center">
    <div style="flex:1">
      <div style="font-size:32px;color:#86291a;letter-spacing:.06em">給与明細を読みとる1日5問</div>
      <div style="font-size:108px;font-weight:900;margin-top:10px;color:#1f3a5c;white-space:nowrap">給与明細<span style="color:#b8402a">よみ</span></div>
      <div style="font-size:31px;margin-top:18px;line-height:1.5;white-space:nowrap">手取り・社会保険料・税金<br>年金機構・国税庁の案内にもとづく</div>
    </div>
    <div style="width:390px;background:#fff;border:6px solid #2a2420;border-radius:26px;padding:24px;box-sizing:border-box;box-shadow:0 14px 0 #2a242022">
      <div style="font-size:26px;font-weight:900;margin-bottom:10px">給与明細　4月分</div>
      <table style="border-collapse:collapse;width:100%;font-size:26px;line-height:1.4">
        <tr><th style="${td};background:#f7f2e8;white-space:nowrap">総支給額</th><td style="${td};text-align:right">300,000円</td></tr>
        <tr><th style="${td};background:#f7f2e8;white-space:nowrap">厚生年金</th><td style="${td};text-align:right;color:#b8402a;font-weight:900">？</td></tr>
        <tr><th style="${td};background:#f7f2e8;white-space:nowrap">差引支給額</th><td style="${td};text-align:right">？</td></tr>
      </table>
      <div style="margin-top:18px;text-align:center;font-size:26px;font-weight:900;color:#1f3a5c;white-space:nowrap">🔍 手取りはいくら？</div>
    </div>
  </div></body>`);
  await p.screenshot({ path: path.join(__dirname, "..", "og.png") });
  await b.close();
})();
