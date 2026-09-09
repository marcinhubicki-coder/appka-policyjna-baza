# Czytnik i dane — 7 września 2026

Wersja robocza na gałęzi `feature/reader-2026-09-07`. Nie została scalona do produkcji.

## Korekta według uwag z 9 września 2026

Przywrócono produkcyjny podział ustawień: systemowe w jednej kolumnie (z zarządzaniem ulubionymi), wyświetlania w dwóch, wyszukiwania przy aktywnym zapytaniu. Wspólne odstępy; pakiety z przełącznikami, rozwijane pakiety i dokumentacja; szczegóły importu schowane. Przywrócono klasy typograficzne i rzymskie numery rozdziałów lewego panelu. Preferencje i nazwy zapisano w `AGENTS.md`.

Wyłączone ustawy są ukryte. Licznik liczy wyłącznie prawą stronę, przechodzi w sam plus przy około 30% widoczności ostatniej pastylki i zanika do pełnego odsłonięcia. Ma wspólne style z pastylkami oraz stałą przestrzeń pomiarową, żeby zmiana liczby nie przesuwała granicy widoczności. Licznik ma wyśrodkowaną treść, krawędzie listy wygasza gradient; w zwykłym widoku jednokolumnowym ukryty jest cały wiersz nawigacji, bez pustego odstępu. Wybór ustawy zawiera tylko skrót i nazwę, zamykany wyborem lub kliknięciem poza oknem. Gesty z lewej czekają na osobną rundę uwag.

20 zestawów testów przechodzi po korekcie, w tym rzeczywiste moduły trzech stanów ustawień, wyłączenia, uproszczony wybór i progi licznika. Geometria jest symulowana; wygląd i animacja na telefonie pozostają do odbioru na podglądzie Vercela wymagającym logowania.

Dalsze doprecyzowanie: przywrócono liczbę trafień wewnątrz pastylek wyszukiwania z odstępem 4 px od prawej i dolnej krawędzi. +N nadal wskazuje ukryte ustawy. Wizualny fokus jest wyłączony na dotyku; na urządzeniu z precyzyjnym wskaźnikiem i hover delikatny obrys pojawia się dopiero po użyciu Tab, znika po kliknięciu. Logiczny fokus i powrót do przycisku pozostają sprawne.

## Zmiany

- Usunięto powtarzalne przepisywanie spisu treści i obserwatory, które wykonywały pracę po edycji ulubionych. Zachowano pamięć gotowego menu i DOM edytowanego artykułu.
- Pakiety ustaw w ustawieniach realnie sterują zawartością indeksu wyszukiwania po rozpakowaniu danych. Alkohol i imprezy masowe są domyślnie wyłączone. Czytanie i odwołania działają także bez indeksowania pakietu. To nie zmniejsza początkowego pliku ani kosztu jego rozpakowania.
- Trafienie wyszukiwania w ulubionych otwiera ulubione wszystkich ustaw, z filtrem i pełnym trafionym artykułem. Filtry wyszukiwania są oddzielone od filtrów czytnika. Powrót odtwarza wyszukiwanie.
- Bezpośrednie skoki do odwołań; kompaktowy przycisk powrotu na szerokość telefonu w widoku dzielonym.
- Lewy panel rozdziałów: 70% szerokości, maksymalnie 520 px; oficjalna hierarchia, zakresy artykułów i listy tworzone po rozwinięciu. Oba gesty pokazują panel w trakcie ruchu i cofają niedokończone przeciągnięcie.
- Licznik i wybór aktów — mechanikę z 7 września zastąpiła korekta opisana powyżej.
- Komentarze są opcjonalne, konfigurowane w `article-comments.js`. Ikona pojawia się tylko przy artykule z komentarzem. Nie dodano przykładowych porad do bazy ani panelu administracyjnego.
- Cofnięcie usunięcia ulubionego, ostrzeżenie przed utratą niezapisanej edycji, obsługa klawiatury separatora, dostępny eksport także w pełnym widoku.

## Dane i źródła

14 aktów, 4210 pozycji łącznie. Nowy import zawiera 4086 bieżących artykułów z 11 ustaw; dodatkowo 6 oznaczonych pozycji przyszłych i 118 jednostek z dotychczasowych zarządzeń KGP.

| Akt | Bieżące artykuły | Ostatni artykuł |
| --- | ---: | ---: |
| UoP | 389 | 158 |
| KW | 208 | 166 |
| KK | 461 | 363 |
| KPK | 1013 | 682 |
| KPoW | 133 | 121 |
| ŚPB i BP | 89 | 85 |
| PRD | 441 | 152 |
| Cudzoziemcy | 737 | 522 |
| Nieletni | 417 | 417 |
| Alkohol | 95 | 51 |
| Imprezy masowe | 103 | 80 |

Liczby uwzględniają artykuły z literami i indeksami górnymi oraz pozycje oznaczone jako uchylone/pominięte. KW rzeczywiście kończy się na art. 166.

Importer `tools/import-inforlex.py` odczytuje wyłącznie fragmenty ustawowe HTML. Oddziela działy i rozdziały od jednostek przepisu, usuwa odsyłacze redakcyjne, zachowuje indeksy górne i przypisuje osobny akapit sankcji do poprzedzającego paragrafu. Waliduje wersję obejmującą datę importu, brak pustych artykułów oraz unikatowość identyfikatorów. `tools/merge-imported.mjs` sprawdza ciągłość względem poprzedniej bazy, dopisuje pochodzenie i mapę migracji, a następnie generuje `data.js`.

Adresy HTML, wersje i sumy SHA-256 źródeł zapisano w metadanych każdego aktu (`A[4]`). Hierarchia to `R[9]`, typ własnego opisu to `R[10]`. Nie skopiowano zbioru redakcyjnych tytułów Inforlex: zachowano wcześniejsze własne opisy; 494 nowe pozycje mają na razie początek przepisu jako opis nawigacyjny. To jawny zakres do dalszego opracowania krótkich, własnych nazw.

Oficjalny przycisk dla 11 ustaw prowadzi bezpośrednio do PDF ELI, np. [UoP](https://eli.gov.pl/eli/DU/2025/636/uj/pol/pdf), [KK](https://eli.gov.pl/eli/DU/2025/383/uj/pol/pdf), [KPK](https://eli.gov.pl/eli/DU/2026/490/uj/pol/pdf). Z. 360 i Z. 805 także otwierają oficjalne PDF. Wyjątek: aktualnie udostępniony tekst ujednolicony [Z. 768](https://policja.pl/download/1/480206/Zarzadzenienr768tekstujednolicony.docx) jest plikiem DOCX; przycisk poprawnie opisuje format.

Sprawdzono m.in. pełną sankcję KK art. 157 § 1 i § 2 oraz to, że art. 50 KK jest uchylony. W oficjalnym PDF KPK art. 100b oznaczono jako przyszły od 1.10.2028, a art. 131a od 1.10.2029 — nie są wyświetlane jako obowiązujące. Nie przeprowadzono ręcznego audytu zgodności wszystkich 4086 artykułów. Załączniki PRD pozostają w PDF; aplikacja wyraźnie podaje ten zakres. Starszych notatek o nowelizacjach nie przenoszono automatycznie do nowego tekstu jako zweryfikowanych przyszłych brzmień.

Odwołania rozpoznają jawnie nazwane ustawy znajdujące się w bazie. Test ŚPB art. 45 sprawdza cele w KK, w tym zakresy 163–165 i 280–282. Nieznane akty nie są błędnie podpinane do bieżącej ustawy. Rozstrzyganie niejednoznacznych odwołań typu „tej ustawy” pozostaje zachowawcze.

## Ulubione i bezpieczeństwo aktualizacji

Przed migracją powstaje lokalna kopia `police-law-bookmarks-v1-before-2026-09-07`. Nie zostaje nadpisana. Zachowano stare adresy KW z indeksami górnymi, np. `kw-art-601` → `kw-art-60s1`. Fragmenty bez stabilnego identyfikatora są dopasowywane tylko przy jednoznacznej zgodności tekstu. Brak dopasowania oznacza pełny artykuł, komunikat i zachowany poprzedni wybór — nie przypadkowy fragment. Błąd zapisu kopii zatrzymuje migrację. Import pliku także tworzy kopię przed zmianą.

## Weryfikacja

Testy można uruchomić po `npm ci --prefix tools`, z katalogu repozytorium: `node tools/test-reader-runtime.mjs`, `node tools/test-full-data-runtime.mjs` oraz pozostałe `tools/test-*.mjs`.

Wszystkie 20 zestawów testów zakończyło się powodzeniem. Obejmują rzeczywiste moduły aplikacji, pełny plik danych, odwołania, daty i strukturę importu, migrację z błędem zapisu, filtry pakietów, dalekie ulubione, edycję bez przebudowy menu, powrót z odwołania do ulubionych, gesty przed puszczeniem i ich anulowanie, leniwy spis, licznik, komentarze i pracę cache offline.

DOM i geometria testów są symulowane. Nie jest to potwierdzenie płynności, wyglądu ani szybkości na iPhonie. Podgląd Vercela wymaga logowania, a połączone konto nie udostępnia projektu; nie obchodzono ochrony i nie zmieniano produkcji w celu jej ominięcia. Przed scaleniem potrzebny jest odbiór na dostępnym podglądzie, szczególnie obu gestów, warstw paneli i szerokości kontrolek.
