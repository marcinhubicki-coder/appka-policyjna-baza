# Mała Nauka — Ortografia visual v0.3

Status: production implementation target, 2026-09-14.
Scope: wyłącznie `dyktando/`.

## Cel

Ekran ortografii ma zachować obecną logikę gry, timer, zatrzymanie czasu po błędzie i bazę słów, ale otrzymać nowy art direction zgodny z zaakceptowanymi mockupami: pastelowe ilustracje, granatowy zaokrąglony font, glassy odpowiedzi, szklisty bąbel zasłaniający brakujący fragment i spokojne, płynne mikroanimacje.

## Dwa layouty

Każde ilustrowane słowo może losowo dostać jeden z dwóch układów na czas pytania:

- `full` — bardziej immersyjny. Ilustracja wypełnia większą część ekranu, a `Jak jest poprawnie?` jest w dwóch wierszach.
- `split` — ilustracja głównie u góry, dół spokojniejszy i jaśniejszy. `Jak jest poprawnie?` pozostaje w jednym wierszu.

Jeżeli słowo nie ma jeszcze przypisanej ilustracji, używamy spokojnego pastelowego fallbacku i układu `split`. Nie wolno przypisywać semantycznie przypadkowych ilustracji tylko po to, by ekran był bardziej kolorowy.

## Typografia

- Nagłówek: rounded/playful, ciemny granat, bez wielokolorowych efektów.
- Full: 2 wiersze.
- Split: 1 wiersz.
- Dopuszczalny delikatny fioletowy underline / dwie krótkie kreski.
- Tekst słowa: ten sam rodzinny charakter, czytelniejszy i nieco prostszy.

## Brakujący fragment

Nie pokazujemy `_` jako dziury. Brakujący fragment zasłania szklisty bąbel:

- subtelne liquid-glass,
- refleks u góry,
- bardzo delikatne odbicia kolorów otoczenia,
- 2–4 małe animowane sparkle,
- animacje zdesynchronizowane, bez migania całą grupą naraz.

Slot dostosowuje szerokość do najdłuższej odpowiedzi (`u/ó`, `h/ch`, `ż/rz`). Po odpowiedzi bąbel znika, poprawny fragment wchodzi miękką animacją, a szerokość slotu płynnie dopasowuje się do rzeczywistego fragmentu.

## Odpowiedzi

- dwa duże rounded-rectangle glass cards,
- jasne, półprzezroczyste, z delikatnym gradientem i refleksami na krawędziach,
- obrys czerpie subtelnie róż/fiolet/błękit z otoczenia,
- tekst odpowiedzi: fioletowy gradient od jaśniejszego do ciemniejszego, bez ciężkiej czerni,
- cień naturalniejszy, mniej idealnie rozmyty,
- press state: bardzo lekki scale-down,
- correct/wrong pozostają jednoznaczne, ale nie krzykliwe.

## Podpowiedź

Pod odpowiedziami dodajemy `Potrzebujesz podpowiedzi?` w niższym priorytecie wizualnym, z lekkim inner shadow. Po kliknięciu pojawia się spokojny bottom sheet z regułą ortograficzną dla aktualnej pary znaków. Panel nie zatrzymuje logiki gry poza zachowaniem istniejącego stanu pytania.

## Ilustracje produkcyjne

Pierwszy production pack wykorzystuje współdzielone, skompresowane WebP i obejmuje przykładowe sceny:

- `róża` → ogród różany,
- `królik` → łąka / królik,
- `góry` → góry,
- `chmury` → chmury,
- `żaba` → staw,
- `samochód` → podróż autem,
- `huragan` → wiatr / sztorm,
- `lekarz` → gabinet,
- `grzebień` → toaletka,
- `król` → zamek / tron,
- `sokół` → góry / sokół.

Asset ilustracji nie zawiera żywego tekstu zadania ani przycisków. UI i słowo pozostają HTML/CSS, dzięki czemu są ostre na Retina i zachowują animacje.

## Wydajność

- vanilla HTML/CSS/JS,
- brak nowych frameworków,
- grafiki WebP ~720 px szerokości,
- wspólny pakiet scen cache'owany przez PWA,
- UI, szkło, sparkle i animacje realizowane CSS/SVG,
- `prefers-reduced-motion` wyłącza animacje dekoracyjne.

## Acceptance

- działa w Safari / iPhone 13+ portrait,
- brak pionowego scrolla w typowej rundzie,
- slot obsługuje 1- i 2-znakowe odpowiedzi,
- po błędzie timer nadal zatrzymuje się zgodnie z v1,
- hint jest klikalny,
- sparkle bąbla są animowane,
- inne tryby Małej Nauki zachowują dotychczasowy wygląd i logikę,
- brak zmian poza `dyktando/`.
