# Mała Nauka — Matematyka v0.1

## Cel paczki

Pierwsza mała paczka do review. Ma ustalić fundament UX matematyki, rozdzielenie kategorii oraz zachowanie po dobrej i błędnej odpowiedzi. Nie próbujemy jeszcze implementować całego programu nauki.

## Zakres v0.1

### Kategorie

Ekran Matematyki pokazuje cztery wyraźnie rozdzielone kategorie:

- Dodawanie `+`
- Odejmowanie `−`
- Mnożenie `×`
- Dzielenie `÷`

W v0.1 interaktywny jest tryb Mnożenie. Pozostałe kategorie są już obecne w strukturze, ale nie rozwijamy jeszcze ich logiki. Dzięki temu najpierw oceniamy nawigację, proporcje i stany jednego kompletnego typu zadania.

## Mnożenie — podstawowy flow

1. Użytkownik wybiera Mnożenie.
2. Pojawia się jedno duże działanie, np. `5 × 7`.
3. Poniżej dostępne są odpowiedzi.
4. Po wyborze odpowiedzi aplikacja przechodzi do jednego z dwóch stanów: poprawna lub błędna.

### Poprawna odpowiedź

- natychmiastowy, spokojny feedback wizualny,
- krótki czas na zauważenie poprawnego wyniku,
- automatyczne przejście do kolejnego pytania,
- **brak przycisku „Dalej”**,
- przycisk „Dalej” nie jest ukrywany CSS-em ani renderowany chwilowo — nie istnieje w tym stanie DOM,
- przestrzeń pozostaje czysta i stabilna podczas przejścia.

To jest zasada całego modułu: jeśli kolejne pytanie pojawia się automatycznie, nie pokazujemy kontrolki, której użytkownik praktycznie nie zdąży użyć.

### Błędna odpowiedź

Po błędnej odpowiedzi nie przechodzimy automatycznie dalej.

1. Działanie przesuwa się delikatnie ku górze, zwalniając dolną część ekranu.
2. Pojawia się wizualne wyjaśnienie mnożenia.
3. Użytkownik może spróbować ponownie bez opuszczania pytania.
4. Po późniejszej poprawnej odpowiedzi następuje taki sam automatyczny flow do kolejnego pytania — również bez przycisku „Dalej”.

## Wizualne wyjaśnienie mnożenia

Dla działania `5 × 7` interpretujemy zapis konsekwentnie jako **5 rzędów po 7 elementów**.

Wizualizacja zawiera:

- 5 poziomych rzędów,
- po 7 małych prostokątów / kwadratów w każdym rzędzie,
- delikatny obrys wszystkich elementów,
- subtelny highlight pierwszego rzędu,
- subtelny highlight pierwszej kolumny,
- po prawej stronie sumę narastającą dla każdego rzędu:
  - 7
  - 14
  - 21
  - 28
  - 35
- mały podpis znaczeniowy: `5 rzędów po 7`.

Celem nie jest pokazanie ozdobnej animacji, tylko wyjaśnienie dziecku, że mnożenie jest powtarzanym dodawaniem.

## Animacja

Wizualizacja może budować się rzędami od góry do dołu. Kolejne sumy pojawiają się razem z odpowiednim rzędem. Animacja ma być szybka, miękka i czytelna; nie może opóźniać ponownej próby.

Dla `prefers-reduced-motion: reduce` budowanie siatki pojawia się bez animacji sekwencyjnej.

## Zakres liczb v0.1

Do review używamy czynników od 2 do 10. Układ musi zachować czytelność również dla siatki 10 × 10.

## Stany do review

1. ekran kategorii,
2. mnożenie — pytanie bez odpowiedzi,
3. mnożenie — poprawna odpowiedź / automatyczne przejście,
4. mnożenie — błędna odpowiedź + wizualizacja,
5. ponowna próba po błędzie,
6. poprawna odpowiedź po wcześniejszym błędzie.

## Poza zakresem v0.1

- pełna logika dodawania,
- pełna logika odejmowania,
- pełna logika dzielenia,
- poziomy trudności,
- statystyki i adaptacyjny dobór zadań,
- zadania tekstowe,
- rozbudowane ustawienia.

Te elementy będą dokładane osobnymi małymi paczkami po review fundamentu.
