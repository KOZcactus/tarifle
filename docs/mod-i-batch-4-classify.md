# Mod I Batch 4 otomatik kategori raporu

Toplam: 46 duplicate onerisi
- A_KESIN: 9
- B_RISK: 5
- C_ATLA: 32

## A_KESIN (9)

- `aji-amarillolu-kinoa-corbasi-peru-usulu` -> `kinoali-sebze-corbasi-peru-usulu` [pe/CORBA] titleJ=0.00 ingJ=0.80 step=1 dur=0% cal=0% [ingJacc yuksek + duration/cal yakin]
- `chilcano-peru-usulu` -> `chilcano-de-pisco-narenciyeli-peru-usulu` [pe/KOKTEYL] titleJ=0.50 ingJ=0.80 step=1 dur=0% cal=13% [ingJacc yuksek + duration/cal yakin]
- `lomo-saltado` -> `lima-lomo-saltado` [pe/YEMEK] titleJ=0.67 ingJ=0.71 step=1 dur=16% cal=17% [STRICT (titleJ+ingJ+step+cal+dur OK)]
- `lima-lomo-saltado-patatesi` -> `lima-lomo-saltado` [pe/YEMEK] titleJ=0.75 ingJ=1.00 step=0 dur=0% cal=13% [ingredient set kimlik (Jacc=1.00)]
- `lima-lomo-saltado-tabagi` -> `lima-lomo-saltado` [pe/YEMEK] titleJ=1.00 ingJ=0.50 step=0 dur=21% cal=3% [title yuksek + ingredient orta + metric yakin]
- `mantarli-kasza-tava-polonya-usulu` -> `mantarli-karabugday-kasha-polonya-usulu` [pl/YEMEK] titleJ=0.25 ingJ=0.80 step=0 dur=0% cal=0% [ingJacc yuksek + duration/cal yakin]
- `balli-syrniki` -> `syrniki` [ru/KAHVALTI] titleJ=0.50 ingJ=1.00 step=1 dur=0% cal=10% [ingredient set kimlik (Jacc=1.00)]
- `moskova-dana-stroganoff` -> `moscow-beef-stroganoff` [ru/YEMEK] titleJ=0.50 ingJ=0.70 step=1 dur=10% cal=0% [ingJacc yuksek + duration/cal yakin]
- `moskova-pelmeni-kasesi` -> `moskova-pelmeni` [ru/YEMEK] titleJ=1.00 ingJ=0.60 step=0 dur=7% cal=0% [STRICT (titleJ+ingJ+step+cal+dur OK)]

## B_RISK (5)

- `chicha-morada-fizz-peru-usulu` -> `chicha-morada-spritz-peru-usulu` [pe/ICECEK] titleJ=0.50 ingJ=0.60 step=0 dur=0% cal=4% [title+ing orta, manuel review]
- `lahor-tavuk-karahi` -> `lahor-chicken-karahi` [pk/YEMEK] titleJ=0.50 ingJ=0.50 step=2 dur=17% cal=9% [title+ing orta, manuel review]
- `dereotlu-patates-pierogi-polonya-usulu` -> `patatesli-dereotlu-pierogi-polonya-usulu` [pl/YEMEK] titleJ=0.50 ingJ=0.67 step=2 dur=14% cal=4% [title+ing orta, manuel review]
- `varsova-ruskie-pierogi-patatesli` -> `warsaw-pierogi-ruskie` [pl/YEMEK] titleJ=1.00 ingJ=0.45 step=0 dur=24% cal=2% [title kimlik + ingredient orta (coğrafi prefix dup)]
- `olivier-salatasi` -> `dereotlu-olivier-salatasi` [ru/SALATA] titleJ=0.50 ingJ=0.67 step=1 dur=11% cal=4% [title+ing orta, manuel review]

## C_ATLA (32)

- `avokadolu-patates-causa-peru-usulu` -> `causa-limena-peru-usulu` [pe/APERATIF] titleJ=0.25 ingJ=0.25 step=0 dur=33% cal=20% [varyant veya zayif eslesme]
- `causa-limena-verde-peru-usulu` -> `causa-limena-peru-usulu` [pe/APERATIF] titleJ=0.67 ingJ=0.38 step=0 dur=33% cal=12% [varyant veya zayif eslesme]
- `causa-verde-peru-usulu` -> `causa-limena-peru-usulu` [pe/APERATIF] titleJ=0.33 ingJ=0.25 step=0 dur=38% cal=23% [varyant veya zayif eslesme]
- `aji-de-quinua-peru-usulu` -> `kinoali-sebze-corbasi-peru-usulu` [pe/CORBA] titleJ=0.00 ingJ=0.50 step=0 dur=0% cal=6% [varyant veya zayif eslesme]
- `pisco-ginger-fizz-peru-usulu` -> `chilcano-de-pisco-narenciyeli-peru-usulu` [pe/KOKTEYL] titleJ=0.25 ingJ=0.50 step=1 dur=17% cal=13% [varyant veya zayif eslesme]
- `lima-ceviche-klasik` -> `lima-ceviche-clasico-levrek` [pe/SALATA] titleJ=0.67 ingJ=0.36 step=0 dur=20% cal=27% [varyant veya zayif eslesme]
- `lucuma-yogurt-kup-peru-usulu` -> `lucumali-yogurt-kupu-peru-usulu` [pe/TATLI] titleJ=0.25 ingJ=0.50 step=0 dur=20% cal=13% [varyant veya zayif eslesme]
- `tarcinli-mor-misir-muhallebisi-peru-usulu` -> `mazamorra-morada-peru-usulu` [pe/TATLI] titleJ=0.00 ingJ=0.25 step=1 dur=31% cal=11% [varyant veya zayif eslesme]
- `aji-de-gallina` -> `lima-aji-de-gallina` [pe/YEMEK] titleJ=0.50 ingJ=0.33 step=1 dur=29% cal=35% [varyant veya zayif eslesme]
- `pancarli-barszcz-corbasi-polonya-usulu` -> `barszcz-czerwony-polonya-usulu` [pl/CORBA] titleJ=0.33 ingJ=0.14 step=0 dur=19% cal=17% [varyant veya zayif eslesme]
- `salatalikli-yogurtlu-dereotu-salata-polonya-usulu` -> `mizeria-polonya-yaz-usulu` [pl/SALATA] titleJ=0.00 ingJ=0.33 step=1 dur=20% cal=9% [varyant veya zayif eslesme]
- `elmali-hashasli-kek-kup-polonya-usulu` -> `elmali-hashasli-kup-polonya-usulu` [pl/TATLI] titleJ=1.00 ingJ=0.60 step=0 dur=38% cal=8% [varyant veya zayif eslesme]
- `erikli-hashasli-krem-kup-polonya-usulu` -> `erikli-makowiec-kup-polonya-usulu` [pl/TATLI] titleJ=0.25 ingJ=0.13 step=0 dur=30% cal=14% [varyant veya zayif eslesme]
- `erikli-poppyseed-kup-polonya-usulu` -> `erikli-makowiec-kup-polonya-usulu` [pl/TATLI] titleJ=0.25 ingJ=0.33 step=0 dur=30% cal=22% [varyant veya zayif eslesme]
- `kopytka-polonya-usulu` -> `esmer-tereyagli-kopytka-polonya-usulu` [pl/YEMEK] titleJ=0.33 ingJ=0.60 step=1 dur=0% cal=3% [varyant veya zayif eslesme]
- `pierogi-ruskie` -> `warsaw-pierogi-ruskie` [pl/YEMEK] titleJ=0.67 ingJ=0.75 step=1 dur=60% cal=28% [varyant veya zayif eslesme]
- `krakow-peynirli-pierogi` -> `warsaw-pierogi-ruskie` [pl/YEMEK] titleJ=0.20 ingJ=0.67 step=2 dur=46% cal=2% [varyant veya zayif eslesme]
- `pierogi` -> `warsaw-pierogi-ruskie` [pl/YEMEK] titleJ=0.33 ingJ=0.67 step=1 dur=36% cal=2% [varyant veya zayif eslesme]
- `varshova-bigos` -> `varsova-bigos-lahana` [pl/YEMEK] titleJ=1.00 ingJ=0.23 step=2 dur=5% cal=15% [varyant veya zayif eslesme]
- `varsova-bigos-yahnisi` -> `varsova-bigos-lahana` [pl/YEMEK] titleJ=0.67 ingJ=0.23 step=1 dur=5% cal=17% [varyant veya zayif eslesme]
- `varsova-lahanali-bigos` -> `varsova-bigos-lahana` [pl/YEMEK] titleJ=0.67 ingJ=0.15 step=2 dur=27% cal=22% [varyant veya zayif eslesme]
- `solyanka-rus-usulu` -> `dana-solyanka` [ru/CORBA] titleJ=0.50 ingJ=0.43 step=0 dur=31% cal=3% [varyant veya zayif eslesme]
- `okroshka-kefirli-rus-usulu` -> `kefirli-soguk-okroshka-rus-usulu` [ru/CORBA] titleJ=0.33 ingJ=0.67 step=1 dur=0% cal=3% [varyant veya zayif eslesme]
- `mors-visneli-rus-usulu` -> `visneli-mors-rus-usulu` [ru/ICECEK] titleJ=0.50 ingJ=0.40 step=0 dur=0% cal=4% [varyant veya zayif eslesme]
- `medovik-kup-rus-usulu` -> `medovik-rus-usulu` [ru/TATLI] titleJ=0.50 ingJ=0.14 step=1 dur=74% cal=10% [varyant veya zayif eslesme]
- `bal-katli-medovik-kup-rus-usulu` -> `medovik-rus-usulu` [ru/TATLI] titleJ=0.50 ingJ=0.50 step=1 dur=77% cal=8% [varyant veya zayif eslesme]
- `dana-stroganoff` -> `moscow-beef-stroganoff` [ru/YEMEK] titleJ=0.25 ingJ=0.45 step=0 dur=10% cal=10% [varyant veya zayif eslesme]
- `stroganoff-dana-kasesi-rus-usulu` -> `moscow-beef-stroganoff` [ru/YEMEK] titleJ=0.25 ingJ=0.40 step=2 dur=36% cal=39% [varyant veya zayif eslesme]
- `pelmeni` -> `moskova-pelmeni` [ru/YEMEK] titleJ=0.50 ingJ=0.33 step=0 dur=18% cal=17% [varyant veya zayif eslesme]
- `moskova-eksi-kremali-pelmeni-tavasi` -> `moskova-pelmeni` [ru/YEMEK] titleJ=0.40 ingJ=0.50 step=1 dur=6% cal=7% [varyant veya zayif eslesme]
- `mantarli-grechnevaya-kasha-rus-usulu` -> `kasha-grechka` [ru/YEMEK] titleJ=0.25 ingJ=0.33 step=1 dur=14% cal=21% [varyant veya zayif eslesme]
- `grechka-s-gribami-rus-usulu` -> `kasha-grechka` [ru/YEMEK] titleJ=0.00 ingJ=0.50 step=0 dur=14% cal=20% [varyant veya zayif eslesme]
