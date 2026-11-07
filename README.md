# 給与明細よみ

給与明細を見て、総支給額・社会保険料・税金・手取り（差引支給額）を読み取る1日5問のゲーム。押すだけ、時間制限なし。

- 遊ぶ: https://satou-aaaaa.github.io/kyuyo-meisai/
- 今日の5問（やさしい2・ふつう2・むずかしい1）はだれでも同じで1日1回。上級（むずかしい3問・ヒントなし）、練習（何度でも）、とことん（まちがえても続く・一発で何問読みとれるか）、読みとった種類が集まる「明細帳」があります。
- まちがえても選び直せます。正解すると「なぜ」と出典が出ます。ヒントは「見るところ」→「選び肢を2つにしぼる」の2段です。選び肢が2つの問題は1回までです。
- 問題は283問（19種類）。チケット・回数制限はありません。
- 文字の大きさは3段から選べます。見やすさの設定（読みやすい文字・色の見分け・動きを減らす・読み上げ）もあります。
- 機種を変えるときは「引き継ぎ」で、記録をコードと QR にして移せます。

## 中身の出どころ

人・会社の名前はすべて作りものです。料率は2026年度（健康保険は協会けんぽ東京支部）。所得税・住民税の金額は例で、本物は税額表と市区町村の通知で決まります。税金・保険の相談はできません。自分の明細で分からないことは、会社の担当の人や、税務署・年金事務所にたずねてください。

- [日本年金機構「厚生年金保険の保険料」](https://www.nenkin.go.jp/service/kounen/hokenryo/hoshu/20150515-01.html)：料率18.3%・会社と本人で半分ずつ
- [日本年金機構「定時決定（算定基礎届）」](https://www.nenkin.go.jp/service/kounen/hokenryo/hoshu/20121017.html)：4〜6月の報酬の平均で標準報酬月額を決め、9月から使う
- [日本年金機構「新社会人のみなさんへ」(2026年版)](https://www.nenkin.go.jp/service/learn/seidosetsumei.files/shinshakai2026.pdf)：総支給額・控除合計・差引支給額
- [協会けんぽ「令和8年度の保険料率」](https://www.kyoukaikenpo.or.jp/about/business/insurance_rate/rate_prefectures/r08/index.html)・[保険料と標準報酬月額](https://www.kyoukaikenpo.or.jp/about/business/overview/001/index.html)・[介護保険制度](https://www.kyoukaikenpo.or.jp/about/business/insurance_rate/002/index.html)：健康保険9.85%（東京）・介護保険1.62%（40〜64歳）
- [厚生労働省「令和8年度の雇用保険料率」](https://jsite.mhlw.go.jp/tokyo-hellowork/list/tachikawa/kyushokusha/koyouhokenryouritu08.html)：本人1,000分の5（一般の事業）
- [国税庁「源泉徴収税額表」(令和8年分)](https://www.nta.go.jp/publication/pamph/gensen/zeigakuhyo2026/data/all.pdf)・[通勤手当の非課税限度額](https://www.nta.go.jp/taxes/shiraberu/taxanswer/gensen/2582.htm)・[年末調整のしかた](https://www.nta.go.jp/taxes/shiraberu/taxanswer/gensen/2662.htm)・[社会保険料控除](https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1130.htm)・[令和7年度の基礎控除の見直し](https://www.nta.go.jp/users/gensen/2025kiso/index.htm)
- [総務省「個人住民税」](https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/individual-inhabitant-tax.html)：前の年の所得で決まり、給料から引かれる（特別徴収）

## 記録と通信

記録は遊ぶ人のブラウザにだけ残り、ゲームから自動で外へ送ることはありません。例外は2つ：文字（Google Fonts）を読み込むとき、まだ端末に保存が無ければ Google に IP アドレスが届きます。「Xで投稿」「LINEで送る」「結果をシェア」を押したときだけ、結果の文が選んだ先に渡ります（問題と答えは入りません）。

## 開発

```bash
bash scripts/setup.sh   # 最初に一度
node qa/run.mjs         # 検査（CI と同じ）
```

問題は `gen.js`（決まりは AGENTS.md）。

感想は [Issue のフォーム](https://github.com/satou-aaaaa/kyuyo-meisai/issues/new?template=feedback.yml) からどうぞ。
