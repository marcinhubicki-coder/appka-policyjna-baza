# Małe Dyktando — specyfikacja v0.2

## 1. Cel

Zbudować bardzo prostą, szybką grę ortograficzną dla dziecka. W każdej rundzie wyświetla się jedno popularne polskie słowo z jedną luką. Użytkownik wybiera wyłącznie pomiędzy dwiema logicznymi możliwościami ortograficznymi, np. `u / ó`, `rz / ż`, `ch / h`, `ć / ci`.

Priorytety:
1. dziecko uruchamia grę i zaczyna ćwiczyć praktycznie natychmiast,
2. jeden ekran = jedna decyzja,
3. natychmiastowy feedback po odpowiedzi,
4. szybkie tempo — w domyślnych 3 minutach należy rozwiązać jak najwięcej słów,
5. brak reklam, logowania, backendu, kont i zbędnych funkcji,
6. działa bardzo dobrze na iPhonie/Safari/PWA, ale także na desktopie,
7. kod ma być całkowicie odseparowany od istniejącej aplikacji policyjnej.

## 2. Lokalizacja w repo / wdrożenie

Implementację umieścić wyłącznie w katalogu:

`/dyktando/`

Preferowany zestaw plików:
- `dyktando/index.html`
- `dyktando/app.css`
- `dyktando/app.js`
- `dyktando/data/words.json` lub podzielone pliki danych
- opcjonalnie lekkie lokalne SVG w `dyktando/assets/`

Nie korzystać z frameworków ani zewnętrznych bibliotek. Vanilla HTML/CSS/JS jest wystarczające i pasuje do obecnej statycznej architektury repo.

### Vercel

Preferowane docelowe wdrożenie: osobny projekt Vercel korzystający z tego samego repo, z Root Directory ustawionym na `dyktando`, np. projekt `male-dyktando`. Dzięki temu istniejąca aplikacja policyjna i jej service worker pozostają całkowicie niezależne.

Jeśli testowane będzie również pod ścieżką istniejącej domeny (`/dyktando/`), trzeba pamiętać, że obecny root `sw.js` zwraca główny `index.html` dla wszystkich requestów typu `navigate`. Nie zmieniać tego zachowania przypadkowo. Preferować osobny projekt/domenę Vercel; ewentualną zmianę service workera wykonać dopiero świadomie i minimalnie.

## 3. Charakter produktu / wygląd

Zaakceptowany kierunek wizualny:
- jasne, prawie białe / bardzo jasnoniebieskie tło,
- granatowa typografia,
- zielony główny CTA,
- miękkie pastelowe akcenty kategorii,
- duże zaokrąglenia kart i przycisków,
- bardzo lekki cień,
- dużo światła i odstępów,
- styl dziecięcy, ale nie infantylny,
- sympatyczny lew jako maskotka + motyw ołówka,
- maskotkę można zrobić jako proste lokalne SVG; żadnych zewnętrznych assetów/CDN,
- mobile-first.

Przykładowa paleta (można lekko dopracować podczas implementacji):
- navy: `#0B2A66`
- green: `#10B968`
- green feedback bg: `#EAF9F0`
- red: `#F04452`
- red feedback bg: `#FFF0F2`
- page bg: `#F7FBFF`
- card bg: `#FFFFFF`
- subtle border: `#DDE8F4`
- secondary text: `#58708F`

Font: systemowy, czytelny, zaokrąglony w odbiorze. Nie pobierać Google Fonts. Preferować `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif. Słowo w grze: duże, grube, maksymalnie czytelne.

## 4. Baza słów

Baza startowa: **400 unikalnych słów**.

Kategorie i liczebność:
- `u/ó` — 130
- `rz/ż` — 130
- `ch/h` — 90
- `ć/ci` — 10
- `ś/si` — 10
- `ź/zi` — 10
- `ń/ni` — 10
- `dź/dzi` — 10

Łącznie: 400.

Poziomy trudności:
- `1` łatwe — 236
- `2` średnie — 132
- `3` trudne — 32

Format jednego rekordu:

```json
{
  "word": "król",
  "masked": "kr_l",
  "category": "u/ó",
  "options": ["u", "ó"],
  "answer": "ó",
  "difficulty": 1
}
```

### Zasady danych

- zawsze dokładnie dwie opcje,
- luka reprezentuje cały brakujący zapis (`rz`, `ch`, `dzi` też liczą się jako jedna odpowiedź),
- nie pokazywać przypadkowych odpowiedzi z innych kategorii,
- po uzupełnieniu poprawnej opcji powstaje poprawne słowo,
- unikać pytań wymagających kontekstu znaczeniowego, np. form, w których obie opcje mogą tworzyć istniejące polskie słowa w zależności od znaczenia,
- nie generować słów dynamicznie; korzystać tylko z zatwierdzonej bazy.

Dane do v0.2 znajdują się na tej gałęzi w plikach `dyktando/data/words-*.json`. Można pozostawić je podzielone albo podczas implementacji scalić do `words.json`, ale treść rekordów ma zostać zachowana.

## 5. Flow aplikacji

### Ekran A — Start

Elementy:
- logo/nazwa `Małe Dyktando` + ołówek,
- hasło: `Ćwicz pisownię. Małe kroki, wielkie postępy!`,
- lew-maskotka,
- duży przycisk `Rozpocznij grę`,
- pod nim mały opis domyślnego trybu: `3 minuty · 400 słów`,
- mniejsze akcje:
  - `Kategorie`
  - `Moje wyniki`
  - `Ustawienia`

Kliknięcie `Rozpocznij grę` od razu uruchamia tryb `Wszystkie słowa` z aktualnym czasem ustawionym w ustawieniach (domyślnie 3 minuty).

### Ekran B — Kategorie

Lista:
- Wszystkie słowa — 400
- u / ó — 130
- rz / ż — 130
- ch / h — 90
- ć / ci — 10
- ś / si — 10
- ź / zi — 10
- ń / ni — 10
- dź / dzi — 10

Każdy wiersz:
- kolorowy chip/ikonka kategorii,
- nazwa,
- 1–2 przykładowe słowa,
- liczba rekordów,
- cały wiersz klikalny.

Wybranie kategorii natychmiast zaczyna grę w tej kategorii.

### Ekran C — Gra / pytanie

Góra:
- `X` — zakończenie gry z prostym potwierdzeniem,
- timer, np. `2:41`,
- pauza,
- cienki pasek postępu czasu,
- po lewej małe `Pytanie 12`, bez `/30`,
- po prawej `Wynik: 8` (liczba poprawnych odpowiedzi).

Środek:
- małe oznaczenie kategorii, np. `u / ó`,
- opcjonalny badge trudności `Łatwe / Średnie / Trudne` jeśli ustawienie „Pokaż poziom trudności” jest włączone,
- duża karta ze słowem, np. `kr_l`,
- tekst `Wybierz brakującą literę:`,
- **dokładnie dwa** duże przyciski odpowiedzi, np. `u` i `ó`.

Nie dodawać trzecich/czwartych losowych odpowiedzi.

### Ekran D — poprawna odpowiedź

Po tapnięciu odpowiedzi:
- natychmiast zablokować oba przyciski,
- karta płynnie przechodzi w jasną zieleń,
- pokazać pełne słowo, np. `król`,
- poprawnie wybrany fragment może być podświetlony zielenią,
- duży check,
- tekst `Świetnie!` lub losowo jeden z kilku krótkich pozytywnych komunikatów,
- wynik +1 od razu,
- przycisk `Dalej →` dostępny natychmiast,
- po ok. **700 ms** automatycznie przejść do kolejnego słowa; tapnięcie `Dalej` robi to od razu.

Timer podczas feedbacku dalej biegnie.

### Ekran E — błędna odpowiedź

Po błędnej odpowiedzi:
- natychmiast zablokować oba przyciski,
- karta przechodzi w delikatną czerwień,
- pełne poprawne słowo pokazane dużym fontem,
- błędnie wybrany fragment może być czerwony, poprawny wyraźnie zielony,
- duży X,
- tekst `To nie ta litera.`,
- poniżej `Poprawna odpowiedź: …`,
- przycisk `Dalej →`,
- automatyczne przejście po ok. **1100 ms** (trochę dłużej niż przy dobrej odpowiedzi, żeby dziecko zdążyło utrwalić poprawny zapis),
- tapnięcie `Dalej` przechodzi natychmiast.

Timer nadal biegnie.

## 6. Mechanika sesji

- domyślny czas: 3:00,
- **brak limitu liczby pytań**,
- gra trwa aż timer dojdzie do zera,
- kolejność słów losowa,
- w obrębie jednej sesji nie powtarzać słowa, dopóki nie wyczerpie się aktualny pool,
- przy 400 słowach powtórki w typowej 3-minutowej sesji praktycznie nie wystąpią,
- dla małych kategorii po wyczerpaniu poolu można przetasować kategorię ponownie, ale pierwsze słowo nowego cyklu nie może być tym samym co ostatnie poprzedniego,
- `score = correct`,
- dodatkowo śledzić `wrong` i `attempted`,
- `accuracy = correct / attempted`, z zabezpieczeniem przed dzieleniem przez 0.

Nie karać punktami ujemnymi.

### Losowanie

Przed każdą sesją przetasować wybrany pool (Fisher–Yates). Opcje odpowiedzi (`u/ó`) mogą również losowo zamieniać się miejscami, żeby dziecko nie zapamiętywało położenia poprawnego przycisku.

## 7. Pauza / wyjście

### Pauza
- timer zatrzymany,
- nie można odpowiadać,
- prosty overlay `Pauza`,
- akcje `Wznów` i `Zakończ grę`.

### X
- podczas aktywnej gry nie kończyć przypadkowym tapnięciem,
- mały modal: `Zakończyć tę grę?` + `Graj dalej` / `Zakończ`,
- po zakończeniu ręcznym można pokazać aktualne podsumowanie.

## 8. Ekran wyniku

Po czasie:
- puchar,
- `Koniec gry!`,
- `Świetna robota!`,
- trzy czytelne statystyki:
  - `Poprawne: 42`
  - `Błędne: 7`
  - `Razem: 49`
- procent: `86% poprawnych odpowiedzi`,
- jeśli pobito najlepszy wynik dla danego trybu/czasu — delikatny komunikat `Nowy rekord!`,
- CTA `Zagraj jeszcze raz`,
- secondary `Powrót do menu`.

Nie stosować `26/30`, ponieważ liczba pytań nie jest z góry ograniczona.

## 9. Moje wyniki

v0.2 ma pozostać proste.

Lokalnie w `localStorage` zachować:
- ostatnie maks. 10 sesji,
- najlepszy wynik dla `Wszystkie słowa` dla każdego czasu gry,
- opcjonalnie najlepszy wynik dla poszczególnych kategorii.

Ekran:
- `Najlepszy wynik` (duża karta),
- `Ostatnie gry` — data/godzina, kategoria, czas, poprawne, błędne, %,
- `Wyczyść wyniki` w ustawieniach lub na dole listy z potwierdzeniem.

Nie dodawać wykresów, kont użytkownika ani synchronizacji.

## 10. Ustawienia

Minimalny zestaw:

1. `Czas gry`
   - 1 minuta
   - 2 minuty
   - **3 minuty (domyślne)**
   - 5 minut

2. `Dźwięki`
   - domyślnie ON,
   - krótkie lokalne Web Audio API / proste sygnały, bez plików audio z zewnątrz,
   - poprawna odpowiedź: subtelny wysoki ton,
   - błędna: subtelny niższy ton,
   - jeśli Web Audio komplikuje implementację, można w pierwszym commicie zostawić przełącznik i bezpieczny no-op, ale UI nie może się psuć.

3. `Pokaż poziom trudności`
   - domyślnie ON.

4. `Wyczyść wyniki`
   - osobna akcja z potwierdzeniem.

Ustawienia zapisywane w `localStorage`.

Nie dodawać na tym etapie rozbudowanych „wskazówek” dla każdego słowa — baza nie zawiera definicji i nie wolno ich generować w locie.

## 11. Trudność

Badge wyświetlany tylko informacyjnie:
- 1 → `Łatwe`, zielony/pastelowy,
- 2 → `Średnie`, bursztynowy/pastelowy,
- 3 → `Trudne`, czerwony/różowy pastelowy.

W v0.2 nie potrzebujemy filtra po trudności. Dane mają już poziom, aby taki tryb łatwo dodać później.

## 12. Responsywność i ergonomia

Główny target: iPhone 13 Pro / Safari, szerokość ok. 390 px.

Wymagania:
- brak poziomego scrolla,
- `100dvh`, poprawne zachowanie z paskami Safari,
- `env(safe-area-inset-top/bottom)` dla PWA,
- touch target min. 48 px, odpowiedzi najlepiej 72–96 px wysokości,
- przyciski odpowiedzi zajmują prawie całą szerokość po połowie,
- najważniejsze elementy mieszczą się bez przewijania podczas gry,
- na bardzo małej wysokości można zredukować dekoracje/maskotkę, nigdy słowo ani odpowiedzi,
- desktop: centralna karta aplikacji max-width ok. 440–500 px; nie rozciągać interfejsu na cały ekran.

## 13. Dostępność

- prawdziwe `<button>`, nie div-y,
- `aria-live="polite"` dla feedbacku,
- nie polegać wyłącznie na kolorze: check/X + tekst,
- kontrast czytelny,
- `prefers-reduced-motion`: ograniczyć animacje,
- obsługa klawiatury desktop: klawisze `1` i `2` wybierają odpowiedzi, `Space`/`Enter` na `Dalej`.

## 14. Stan aplikacji

Wystarczy prosty state machine w JS:
- `home`
- `categories`
- `playing`
- `feedback-correct`
- `feedback-wrong`
- `paused`
- `results`
- `history`
- `settings`

Nie budować routera SPA. Można renderować widoki w jednym root containerze.

## 15. LocalStorage

Przykładowe klucze z namespace, aby nie kolidowały z appką policyjną:
- `maleDyktando.settings.v1`
- `maleDyktando.history.v1`
- `maleDyktando.best.v1`

Nie używać ogólnych kluczy typu `settings` albo `history`.

## 16. Animacje

Bardzo lekkie:
- karta odpowiedzi: 160–220 ms,
- wejście feedbacku: niewielki scale/fade,
- pasek czasu płynny,
- brak konfetti i ciężkich efektów w v0.2.

Maskotka i dekoracje nie mogą opóźniać przechodzenia pomiędzy pytaniami.

## 17. Dźwięk / haptics

Opcjonalnie można dodać:
- `navigator.vibrate(20)` przy złej odpowiedzi wyłącznie tam, gdzie wspierane i po włączeniu dźwięków/feedbacku,
- brak wibracji jako wymóg nie jest blockerem dla iOS.

Nie wymagać zgód ani autoplay audio przed pierwszą interakcją.

## 18. Techniczne non-goals v0.2

Nie implementować:
- backendu,
- logowania,
- chmury,
- AI/LLM,
- TTS,
- reklam,
- rankingów online,
- multiplayera,
- panelu rodzica,
- edytora słów,
- rozbudowanego systemu nagród,
- daily streaków,
- instalacji zależności npm, jeśli nie są absolutnie konieczne.

## 19. Kryteria akceptacji

### Dane
- [ ] aplikacja ładuje wszystkie 400 rekordów,
- [ ] wszystkie rekordy mają dokładnie 2 opcje,
- [ ] 400 słów jest unikalnych,
- [ ] kategorie sumują się do 400,
- [ ] poziomy trudności sumują się do 400,
- [ ] poprawna odpowiedź faktycznie odtwarza `word` z `masked`.

### Gra
- [ ] Start uruchamia sesję w maks. 1 tapnięciu,
- [ ] domyślna sesja trwa 3:00,
- [ ] brak limitu 30 pytań,
- [ ] poprawna odpowiedź daje natychmiast zielony feedback i +1,
- [ ] błędna odpowiedź od razu pokazuje poprawną pisownię,
- [ ] po feedbacku następuje auto-next, a `Dalej` przyspiesza przejście,
- [ ] timer działa poprawnie również podczas feedbacku,
- [ ] pause naprawdę zatrzymuje timer,
- [ ] pytania nie powtarzają się przed wyczerpaniem poolu,
- [ ] po 0:00 pojawia się podsumowanie.

### Wyniki
- [ ] podsumowanie pokazuje poprawne / błędne / razem / procent,
- [ ] historia działa po przeładowaniu strony,
- [ ] rekord działa dla wybranego czasu/trybu,
- [ ] wyczyszczenie danych wymaga potwierdzenia.

### UX
- [ ] działa poprawnie na iPhone Safari,
- [ ] brak poziomego scrolla,
- [ ] ekran gry mieści się bez pionowego scrolla na typowym iPhonie,
- [ ] duże targety dotykowe,
- [ ] po dwa przyciski odpowiedzi, nigdy więcej,
- [ ] styl wizualny zgodny z zaakceptowanym pastelowym kierunkiem,
- [ ] istniejąca appka policyjna nie zmienia zachowania.

## 20. Testy przed oddaniem

Wykonać celowane testy:
1. uruchomienie wszystkich 8 kategorii,
2. minimum po jednej odpowiedzi poprawnej i błędnej dla każdej kategorii,
3. `u/ó`, `rz/ż`, `ch/h` oraz wieloznakowe `dź/dzi`, `ć/ci`,
4. sesja 1-minutowa do pełnego końca,
5. pause/resume,
6. ręczne zakończenie,
7. localStorage po reloadzie,
8. Safari/iPhone viewport lub najbliższa emulacja 390 × 844,
9. desktop keyboard `1` / `2`,
10. upewnić się, że root aplikacji policyjnej nadal działa bez zmian.

Nie wykonywać szerokiego refaktoru istniejącej aplikacji. Scope tej pracy to wyłącznie Małe Dyktando.

## 21. Oczekiwany rezultat Codex

1. Zaimplementować działającą v0.2 w `dyktando/`.
2. Zachować bazę 400 słów dostarczoną na branchu.
3. Uruchomić lokalny/static preview i zweryfikować flow.
4. Commitować zmiany na tej gałęzi/PR.
5. W komentarzu końcowym podać:
   - listę zmienionych plików,
   - wykonane testy,
   - ewentualne ograniczenia,
   - gotowość do preview na Vercelu.

Jeśli jakiś detal nie jest opisany, preferować prostotę, szybkość działania i wizualną zgodność z powyższym kierunkiem zamiast dokładania nowych funkcji.