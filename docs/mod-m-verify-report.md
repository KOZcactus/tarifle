# Mod M verify raporu

Okunan dosya: 1 batch
Toplam entry: 50

## Ozet

- Apply'a hazir (clean): **13**
  - high confidence: 4
  - medium confidence: 8
  - low confidence: 1
- SKIP: 37
- BLOCKED (issue var): 0

## SKIP (Codex marine icermiyor dedi)

| Slug | Reason |
|---|---|
| `kars-evelik-asi` | Evelik asi corbasinda terbiye corbaya karistiriliyor; marine veya bekleme suresi yok. |
| `kastamonu-pastirmali-ecevit-corbasi` | Ecevit corbasindaki yogurt terbiyesi pisirme teknigidir; marine suresi olarak modellenmemeli. |
| `kayseri-pastirmali-yarma-corbasi` | Yarma corbasinda terbiye sicak corbayla ilitiliyor; bekletilen marine adimi yok. |
| `kerevizli-yogurt-corbasi-edirne-usulu` | Yogurt terbiyesi corbaya sicak suyla alistirilir; marine beklemesi olarak eklenmez. |
| `lorlu-zahter-salatasi-kilis-usulu` | Zahter yapraklari soslanmadan once kurutuluyor; bekletilen marine adimi bulunmuyor. |
| `yogurtlu-nohut-yahni-konya-ova-usulu` | Yogurtlu nohut yahnide terbiye pisirme asamasi; marine veya dinlendirme suresi yok. |
| `koruklu-pancar-salatasi-manisa-usulu` | Pancar sosla karistirilir, fakat kaynakli net bekletme suresi yok; sahte marine eklenmemeli. |
| `kulak-corbasi` | Kulak corbasinda yogurtlu terbiye pisirme teknigidir; marine suresi eklenmez. |
| `lebeniye-corbasi` | Lebeniye corbasindaki terbiye sicak suyla ilitilir; bekletme veya marine adimi yok. |
| `eksili-kofte-malatya-usulu` | Eksili kofte limonlu terbiye ile piser; marine edilen bir malzeme veya bekleme yok. |
| `nohutlu-sarimsakli-yogurt-corbasi-gaziantep-usulu` | Yogurtlu terbiye corbaya karistirilir; bekletilecek marine suresi yok. |
| `nohutlu-sevketibostan-izmir-usulu` | Sevketibostan limonlu terbiye ile piser; marine veya dinlendirme adimi bulunmuyor. |
| `rize-fasulye-tursulu-kavurma` | Salamura fasulye hazir tursu olarak kullaniliyor; tarifte yeni bekletme suresi yok. |
| `roka-salatasi` | Roka soslanmadan once kurutuluyor; bekletme veya marine suresi eklenmemeli. |
| `erikli-hamsi-salatasi-samsun-usulu` | Marine hamsi hazir malzeme olarak geciyor; salata icin yeni marine beklemesi yok. |
| `katikli-patates-corbasi-sivas-usulu` | Yogurt terbiyesi sicak patates suyuyla ilitiliyor; marine suresi degildir. |
| `siveydiz` | Siveydizde yogurtlu karisim pisirme teknigi olarak kullanilir; bekletme adimi yok. |
| `tavuk-suyu-corbasi` | Tavuk suyu corbasinda limonlu terbiye sicak suyla ilitilir; marine beklemesi yok. |
| `terbiyeli-nohut-corbasi-burdur-usulu` | Nohut corbasindaki terbiye kesilmesin diye ilitilir; marine veya bekleme suresi yok. |
| `yogurtlu-semizotu-corbasi-tire-usulu` | Semizotu corbasinda terbiye kisa pisirilir; marine beklemesi olarak modellenmemeli. |
| `tokat-bakla-dolmasi` | Salamura asma yapragi hazir malzeme olarak kullaniliyor; yeni marine suresi yok. |
| `tokat-baklali-yaprak-sarma` | Sarma hazir salamura yaprakla kuruluyor; toplam sureye marine beklemesi eklenmez. |
| `tokat-yaprak-sarmasi-etli` | Salamura yaprak kullanimi false positive; tarifte yeni bekleme veya marine yok. |
| `tokat-yapragi-dolmasi` | Yapraklar tuzu azalsin diye 3 dakika sicak suda bekler; bu marine degil, hazirlik adimi. |
| `toyga-corbasi` | Toyga corbasinda yogurt terbiyesi sicak corbayla ilitilir; bekleme suresi yok. |
| `tutmac-corbasi` | Tutmac corbasinda terbiye tencerede pisirilir; marine veya dinlendirme adimi degil. |
| `unlu-eriste-corbasi-kirsehir-usulu` | Unlu terbiye topaklanmasin diye ilitiliyor; marine suresi olarak eklenmemeli. |
| `van-ayran-asi-kislik` | Ayran asi corbasinda terbiye tencereye eklenir; bekletilen marine adimi yok. |
| `yayla-corbasi` | Yayla corbasinda yogurtlu karisim terbiye olarak kullanilir; marine beklemesi yok. |
| `yogurtlu-eriste-corbasi-cankiri-usulu` | Yogurt terbiyesi sicak eriste suyuyla ilitilir; bekletme veya marine adimi yok. |
| `yogurtlu-kabak-corbasi-konya-usulu` | Kabak corbasinda terbiye tencereye eklenir; marine suresi olarak modellenmez. |
| `yogurtlu-pirasa-corbasi-edirne-usulu` | Pirasa corbasinda yogurtlu terbiye pisirme asamasidir; bekleme suresi yok. |
| `yogurtlu-yarma-corbasi-sivas-usulu` | Yarma corbasinda terbiye sicak suyla dengelenir; marine beklemesi bulunmuyor. |
| `yuvalama-corbasi` | Yuvalama corbasinda yogurtlu terbiye kisa pisirilir; marine veya dinlendirme yok. |
| `zeytin-yaprakli-lor-sarma-izmir-usulu` | Salamura zeytin yapragi hazir malzeme olarak kullaniliyor; yeni marine beklemesi yok. |
| `cranberry-chicken-salad-abd-delicatessen-usulu` | Chicken salad soslanarak karistirilir; marine edilecek cig protein veya bekleme suresi yok. |
| `banh-mi` | Banh mi kaydinda salamura sebze hazir bileşen olarak kullaniliyor; yeni marine suresi yok. |

## Apply hazir (sample)

| Slug | Marine min | Eski total | Yeni total | Conf | Sources |
|---|---:|---:|---:|---|---|
| `kekikli-cipura-izgara-bodrum-usulu` | 15 | 28 | 43 | low | sosy.co, thebetterfish.com |
| `limonlu-susamli-tavuk-sis-durumu-mersin-usulu` | 30 | 28 | 58 | medium | lezzet.com.tr, knorr.com |
| `mesir-baharatli-tavuk-manisa-usulu` | 30 | 40 | 70 | medium | lezzet.com.tr, tavukyemekleri.gen.tr |
| `mugla-cokertme-kebabi` | 30 | 70 | 100 | medium | nefisyemektarifleri.com, yemek.com |
| `narenciyeli-levrek-sis-alanya-usulu` | 10 | 28 | 38 | medium | thebetterfish.com, simplyrecipes.com |
| `tavuk-doner` | 120 | 45 | 165 | high | lezizyemeklerim.com, sendeyapsana.com |
| `tavuk-sis` | 120 | 35 | 155 | high | lezzet.com.tr, knorr.com |
| `zahterli-tavuk-sis-hatay-usulu` | 30 | 28 | 58 | medium | lezzet.com.tr, knorr.com |
| `seattle-teriyaki-salmon` | 20 | 22 | 42 | high | foodnetwork.com, alphafoodie.com |
| `bo-luc-lac` | 20 | 35 | 55 | medium | wokandkin.com, saveur.com |
| _...3 entry daha_ | | | | | |
