# Audyt treści bazy ustaw — 26.08.2026

## Punkt przywracania

- Commit: `e5370b029d14c992ccb045e23388faa11712c908`
- Gałąź: `backup/pre-content-audit-2026-08-25-e5370b0`
- Backup zweryfikowany jako identyczny z wersją wyjściową.

## Zakres

Sprawdzono 12 aktów, 3385 artykułów/paragrafów i 18 194 jednostki redakcyjne. Audyt obejmował odwołania wewnętrzne i zewnętrzne, zakresy oraz listy numerów, pozostałości po ekstrakcji PDF, urwane odwołania, powielone identyfikatory i stabilność ponownego uruchomienia korekt.

## Wprowadzone korekty

| Rodzaj | Liczba |
|---|---:|
| uzupełnione urwane końcówki odwołań, dla których istniała zweryfikowana korekta | 294 |
| jawne korekty błędnie wyekstrahowanych fragmentów | 10 |
| usunięte puste jednostki | 66 |
| usunięte jednostki będące przypisami/redakcją PDF | 84 |
| odcięte przypisy wklejone do treści przepisu | 10 |
| usunięte mechanicznie rozwinięte ciągi numerów z PDF | 1119 + 8 przypadków złożonych |
| usunięte nagłówki działów/rozdziałów doklejone do treści | 6 |
| naprawiona struktura art. 60, 60¹, 60² i 60³ Kodeksu wykroczeń | 1 zestaw |

Korekta jest idempotentna: drugie uruchomienie daje plik o identycznym SHA-256. Nie ma powielonych identyfikatorów.

## Linkowanie

- Rozpoznano 1849 odwołań zawierających listy lub zakresy.
- 314 odwołań zakwalifikowano jako zewnętrzne.
- **0 zewnętrznych odwołań zostało podlinkowanych do bieżącej ustawy.**
- Przypadek z art. 5d ustawy o Policji został objęty testem regresji: odwołania do Prawa o szkolnictwie wyższym i nauce pozostają tekstem; lokalny `ust. 2` nadal prowadzi do właściwej jednostki.
- 1347 odwołań listowych/zakresowych ma rozpoznany cel wewnętrzny.
- 188 przypadków pozostaje bez linku. Obejmuje to przede wszystkim brak celu w obecnej bazie, urwaną treść źródłową albo konstrukcję niejednoznaczną. Zgodnie z zasadą bezpieczeństwa nie utworzono linku na podstawie domysłu.

## Nierozwiązane braki treści źródłowej

Po usunięciu deterministycznych artefaktów pozostały 172 jednostki z oznakami urwania tekstu:

| Akt | urwany zakres | urwane odwołanie/lista | urwanie po „do/w/we” |
|---|---:|---:|---:|
| Ustawa o Policji | 6 | 6 | 0 |
| Kodeks wykroczeń | 0 | 0 | 3 |
| Kodeks karny | 3 | 2 | 50 |
| Kodeks postępowania karnego | 3 | 6 | 24 |
| Kodeks postępowania w sprawach o wykroczenia | 1 | 3 | 3 |
| Środki przymusu bezpośredniego i broń palna | 4 | 0 | 0 |
| Prawo o ruchu drogowym | 9 | 8 | 1 |
| Ustawa o cudzoziemcach | 23 | 6 | 2 |
| Wspieranie i resocjalizacja nieletnich | 3 | 0 | 1 |
| Zarządzenie nr 768 | 4 | 0 | 0 |
| Zarządzenie nr 360 | 0 | 1 | 0 |
| **Razem** | **56** | **32** | **84** |

Przykłady: tekst kończący się na `ust. 3–`, `od lat 5 do`, `o którym mowa w` albo `ust. 1 i`. Są to braki obecne w materiale wejściowym. Nie zostały automatycznie dopowiedziane, ponieważ zmieniałoby to treść prawa bez wiarygodnego źródła.

## Wniosek

Mechaniczne śmieci PDF i mylące linki zewnętrzne zostały usunięte/zablokowane w zakresie możliwym do ustalenia deterministycznie. Nie można jednak uznać całej treści za kompletną: 172 jednostki wymagają ponownego pobrania lub porównania z oficjalnymi tekstami źródłowymi. Do czasu takiej weryfikacji bezpieczniej pozostawić odwołanie bez linku niż kierować użytkownika do niewłaściwego przepisu.

