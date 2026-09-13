# Mała Nauka — specyfikacja v1

## 1. Cel

Rozwinąć obecne „Małe Dyktando” w jedną prostą, kolorową PWA dla dzieci pod roboczą nazwą **Mała Nauka**. Obecna mechanika Dyktanda pozostaje bazą, ale ekran startowy ma prowadzić do pięciu trybów:

- Ortografia
- Matematyka
- Angielski
- Flagi
- Czytanie

Aplikacja ma być szybka, czytelna i możliwie bezscrollowa. Najważniejsze ekrany — start, konfiguracja rundy i sama rozgrywka — powinny mieścić się na typowym iPhonie bez pionowego scrolla. Ustawienia są wyjątkiem, jeśli naprawdę potrzebują więcej miejsca.

To nie jest rozbudowana platforma edukacyjna ani aplikacja do prowadzenia pełnego kursu. To zestaw krótkich, angażujących ćwiczeń z punktami, czasem i natychmiastowym feedbackiem.

## 2. Scope techniczny

Na tym etapie cały kod nadal pozostaje w katalogu:

`/dyktando/`

Vercel jest skonfigurowany jako osobny projekt z Root Directory = `dyktando`, więc nie wolno zmieniać zachowania głównej aplikacji policyjnej ani plików poza tym katalogiem.

Pozostać przy lekkiej architekturze Vanilla HTML/CSS/JS. Nie dodawać frameworka ani ciężkich zależności tylko po to, aby zbudować te tryby.

## 3. Referencja wizualna

Najważniejszą referencją są mockupy przygotowane w rozmowie i zapisane w repo:

- `assets/mockups/mala-nauka-v1-storyboard.svg`
- `assets/mockups/pwa-icon-concept.svg`

Mockup jest kierunkiem, nie makietą pixel-perfect. Należy zachować jego charakter:

- jasne, miękkie tło,
- bardzo czytelne granatowe nagłówki,
- żywe, ale przyjazne kolory trybów,
- duże zaokrąglenia,
- lekkie cienie,
- duże cele dotykowe,
- przyjazne ilustracje / maskotki,
- kolorowo, ale bez wizualnego chaosu,
- wygląd dziecięcy, lecz nie infantylny.

Można używać lokalnych SVG oraz lekkich wygenerowanych grafik. Nie pobierać ilustracji z zewnętrznych CDN.

## 4. Ekran startowy

Ekran startowy ma być centrum całej PWA i idealnie mieścić się bez scrolla.

### Zawartość

1. Logo / nazwa `Mała Nauka`.
2. Mały przycisk ustawień w prawym górnym rogu.
3. Krótki element narracyjny / powitalny, np. maskotka i jedno zdanie typu `Czas na małą przygodę z wiedzą!`.
4. Bardzo kompaktowy panel wyników — bez rozbudowanych wykresów. Wystarczy np. `Najlepszy wynik`, `Dziś rozwiązane`, `Ostatnia gra` lub podobny zestaw 2–3 prostych danych. Jeśli brak historii, pokazać lekki pusty stan.
5. Pięć dużych kafli trybów:
   - Ortografia
   - Matematyka
   - Angielski
   - Flagi
   - Czytanie

Kafel ma być jednoznaczny wizualnie i możliwy do rozpoznania przez dziecko bez czytania długiego opisu.

### Priorytet

Dziecko powinno rozumieć ekran bez instrukcji. Nie dodawać dodatkowych menu, zakładek i warstw nawigacji, jeśli nie są konieczne.

## 5. Szybka konfiguracja rundy

Kliknięcie trybu prowadzi do prostego wizarda zamiast do rozbudowanych ustawień.

Wizard powinien mieć maksymalnie kilka decyzji i duży CTA `Zaczynamy!`.

Dla danego trybu może zawierać:

1. kategorię / zakres,
2. poziom trudności,
3. czas rundy.

Zapamiętywać ostatnie ustawienia osobno dla każdego trybu, aby kolejne uruchomienie było szybkie.

Jeśli da się bez komplikacji dodać `Graj jak ostatnio`, można to rozważyć, ale nie jest to wymagane w v1.

## 6. Wspólna mechanika rozgrywki

Wszystkie tryby powinny korzystać ze wspólnego modelu sesji:

- widoczny timer,
- licznik punktów,
- cienki pasek postępu czasu,
- pauza,
- wyjście do ekranu głównego z potwierdzeniem,
- duży obszar pytania,
- duże przyciski odpowiedzi,
- natychmiastowy feedback.

Domyślny czas może pozostać 3 minuty, ale wizard może oferować 1 / 2 / 3 / 5 minut.

## 7. Kluczowa zmiana: błędna odpowiedź zatrzymuje czas

To jest ważna zasada v1.

### Gdy odpowiedź jest poprawna

- natychmiast zielony feedback,
- pokazać poprawną odpowiedź w pełnej formie,
- krótka chwila na utrwalenie,
- po około 700 ms automatycznie przejść dalej,
- timer nadal biegnie,
- `Dalej` może być dostępne do natychmiastowego przejścia, jeśli pasuje do layoutu.

### Gdy odpowiedź jest błędna

- **natychmiast zatrzymać timer sesji**,
- pokazać poprawną odpowiedź wyraźnie i czytelnie,
- nie przechodzić automatycznie dalej,
- tylko przycisk **`Dalej`** uruchamia następne pytanie,
- po kliknięciu `Dalej` timer wznawia odliczanie.

Celem jest nauka, a nie nagradzanie szybkiego klikania. Czas potrzebny dziecku na przeczytanie poprawnej odpowiedzi po błędzie nie może pogarszać wyniku.

## 8. Tryb: Ortografia

Bazować na obecnych 400 rekordach i obecnej mechanice.

- dokładnie 2 logiczne odpowiedzi dla par typu `u/ó`, `rz/ż`, `ch/h`, `ć/ci` itd.,
- nie dodawać losowych trzecich i czwartych odpowiedzi,
- zachować istniejące kategorie i poziomy trudności,
- zastosować nową zasadę zatrzymania timera po błędzie.

Obecna baza słów jest źródłem prawdy i nie należy jej automatycznie przerabiać.

## 9. Tryb: Matematyka

Matematyka ma mieć **6 odpowiedzi**, nie 2–3, żeby ograniczyć przypadkowe trafianie.

Pierwsza wersja może obejmować proste kategorie:

- dodawanie,
- odejmowanie,
- mnożenie,
- dzielenie,
- mieszane.

Poziom trudności steruje zakresem liczb i rodzajem działań. Generować dokładnie jedną poprawną odpowiedź i pięć sensownych, unikalnych dystraktorów blisko poprawnego wyniku.

Nie generować odpowiedzi absurdalnie odległych, bo wtedy ćwiczenie robi się zbyt łatwe.

Po błędzie zatrzymać timer i pokazać całe działanie z poprawnym wynikiem.

## 10. Tryb: Angielski

To nie ma być pełna aplikacja do nauki angielskiego. Celem jest krótki trening słownictwa i szczególnie **pisowni angielskich słów**, które dzieci często znają ze słuchu lub znaczenia, ale mają trudność z poprawnym zapisem.

### Liczba odpowiedzi

Zawsze **4 opcje**.

### Przykładowe kategorie

Nie przesadzać z liczbą kategorii. Wystarczy sensowny zestaw, np.:

- liczby,
- rzeczowniki / codzienne przedmioty,
- czasowniki,
- zawody,
- dom,
- ogród / natura,
- zwierzęta.

### Poziom łatwiejszy

Można pokazać obrazek lub polskie znaczenie i poprosić o wybór angielskiego słowa spośród 4 opcji.

### Poziom trudniejszy — najważniejszy

Pokazać znane słowo / jego znaczenie / ilustrację, a odpowiedzi mają być wariantami **pisowni tego samego słowa**: jedna poprawna i trzy wiarygodne błędne.

Przykład dla `bird`:

- `bird` — poprawne,
- `berd`,
- `beard`,
- `birde`.

Błędne warianty mają wyglądać jak realne pomyłki dziecka, a nie losowy ciąg znaków.

Po błędzie zatrzymać timer i mocno wyeksponować poprawny zapis.

## 11. Tryb: Flagi

Zawsze **4 odpowiedzi**.

Pierwsza wersja powinna być prosta:

- pokaż flagę → wybierz kraj,
- opcjonalnie później kraj → wybierz flagę.

Na start użyć ograniczonego, dobrze rozpoznawalnego zestawu państw zamiast od razu budować pełny atlas świata.

Preferować lokalne, lekkie zasoby; można użyć SVG. Nie pobierać flag z sieci przy każdej sesji.

Po błędzie zatrzymać timer i pokazać poprawną nazwę kraju wraz z flagą.

## 12. Tryb: Czytanie — eksperymentalny v1

Ten tryb ma pomóc dziecku, które potrzebuje ćwiczyć szybsze i pewniejsze czytanie, ale nie wolno punktować wyłącznie szybkości kosztem rozumienia.

Pierwszy wariant do testów:

1. pokaż słowo, krótką frazę lub bardzo krótkie zdanie przez określony czas,
2. ukryj tekst,
3. pokaż 4 odpowiedzi i zapytaj, co było pokazane / co wynikało z tekstu,
4. poprawna odpowiedź daje punkt,
5. błędna zatrzymuje timer i pokazuje poprawny tekst / odpowiedź do czasu kliknięcia `Dalej`.

Poziom trudności może stopniowo:

- zwiększać długość tekstu,
- skracać czas ekspozycji,
- przechodzić od pojedynczych słów do fraz i prostych zdań.

Nie skracać ekspozycji automatycznie tak agresywnie, żeby dziecko zaczęło zgadywać. Poprawność i rozumienie są ważniejsze niż rekord szybkości.

To jest tryb eksperymentalny — najważniejsze jest przygotowanie działającego prototypu do realnych testów z dzieckiem, nie rozbudowany algorytm adaptacyjny.

## 13. Wyniki i historia

Zachować lokalne dane bez backendu.

Wystarczy:

- ostatnie sesje,
- najlepszy wynik per tryb / czas,
- prosty procent poprawnych odpowiedzi,
- ewentualnie łączna liczba rozwiązanych zadań dziś.

Nie dodawać wykresów, kont, chmury, rankingów online ani rozbudowanych odznak w v1.

## 14. PWA

Mała Nauka ma być prawdziwą, samodzielną PWA działającą niezależnie od appki policyjnej.

Dodać / dopracować:

- `manifest.webmanifest`,
- własny service worker tylko dla tej aplikacji,
- działanie offline dla podstawowych ekranów i danych,
- `display: standalone`,
- poprawne `theme_color` i `background_color`,
- ikonę PWA,
- `apple-touch-icon`, jeśli możliwe bez ciężkich zależności,
- safe-area dla iPhone,
- `100dvh`.

### Ikona

Kierunek z mockupu ikonki jest zaakceptowany: kolorowa, przyjazna, edukacyjna, np. ołówek + książka + litera/liczby/gwiazdka. Nie musi być spójna 1:1 z obecnym lwem z Dyktanda, bo cały branding może się jeszcze zmienić.

Można odtworzyć ją jako prostsze lokalne SVG lub wykorzystać wygenerowaną grafikę jako referencję.

## 15. No-scroll i responsywność

Priorytet: iPhone / Safari / PWA.

- ekran startowy: bez scrolla przy typowym iPhonie,
- rozgrywka: bez scrolla,
- odpowiedzi zawsze w pełni widoczne,
- najważniejsze CTA nie może wpadać pod dolny pasek / safe-area,
- jeśli ekran jest niższy, redukować dekoracje i odstępy, nie wielkość pytania ani targetów odpowiedzi,
- ustawienia mogą przewijać się, jeśli trzeba,
- wizard najlepiej również zmieścić bez scrolla, ale na małych ekranach dozwolony jest minimalny scroll zamiast ściskania UI.

## 16. Dane i grafiki

- Ortografia: używać istniejących 400 rekordów.
- Matematyka: generator może działać lokalnie.
- Angielski: mały, ręcznie zdefiniowany starter dataset do testów; szczególnie przygotować sensowne warianty błędnej pisowni dla trybu trudnego.
- Flagi: ograniczony zestaw startowy, lokalne zasoby.
- Czytanie: mały zestaw polskich słów / fraz / zdań do testów.

Nie ma potrzeby budować ogromnych baz na tym etapie. Najpierw testujemy mechanikę.

## 17. Testy przed wdrożeniem

Użytkownik chce szybko przejść do testów PWA. Nie wykonywać szerokiej serii testów ani refaktoru istniejącej aplikacji.

Wystarczy **celowana kontrola zgodności**:

1. start mieści się bez scrolla na ok. 390×844,
2. każdy z 5 trybów da się uruchomić,
3. liczba odpowiedzi jest zgodna: Ortografia 2, Matematyka 6, Angielski 4, Flagi 4,
4. Czytanie ma działający prototyp z odpowiedziami,
5. poprawna odpowiedź daje krótki feedback i sama idzie dalej,
6. błędna odpowiedź zatrzymuje timer i wymaga `Dalej`,
7. pauza działa,
8. wyniki zapisują się lokalnie,
9. manifest/service worker nie wychodzą poza scope Małej Nauki,
10. aplikacja policyjna pozostaje nietknięta.

## 18. Non-goals v1

Nie dodawać teraz:

- backendu,
- logowania,
- profili online,
- synchronizacji w chmurze,
- reklam,
- płatności,
- multiplayera,
- rankingów online,
- rozbudowanego systemu achievementów,
- AI generującego pytania w locie,
- ciężkich bibliotek UI,
- pełnego kursu angielskiego,
- rozbudowanego adaptacyjnego algorytmu czytania.

## 19. Kryterium końcowe

Po wdrożeniu ma istnieć jedna kolorowa PWA `Mała Nauka`, w której dziecko z ekranu startowego wybiera jeden z pięciu trybów, w kilku tapnięciach konfiguruje rundę i od razu gra.

Wersja v1 ma być przede wszystkim **gotowa do realnego testowania przez dzieci**, a nie perfekcyjnie rozbudowana. Kolejne decyzje produktowe mają wynikać z ich faktycznego używania aplikacji.
