# Preferencje Marcina — Appka policyjna

Punktem wyjścia są preferencje użytkownika i zaakceptowany wygląd aplikacji. Ogólne standardy UX nie są powodem do zmiany uzgodnionej mechaniki, nazw ani typografii. Nowe polecenia użytkownika mają pierwszeństwo.

Uzgodnione nazwy od 9 września 2026:
- **Ustawienia systemowe**: ustawienia otwierane w widoku głównym, jednokolumnowym. Tu jest zarządzanie ulubionymi.
- **Ustawienia wyświetlania**: ustawienia otwierane w widoku dwukolumnowym.
- **Ustawienia wyszukiwania**: osobny stan przy aktywnym wyszukiwaniu, niezależnie od liczby kolumn.

Zachowuj identyczne odstępy panelu i sekcji we wszystkich trzech stanach. Minimalizm: bez zbędnych instrukcji i statystyk w uproszczonej nawigacji. Nazwa „zarządzaj ulubionymi”, podtytuł „Zapisz ulubione w pliku lub załaduj nowe.” Bez stałej instrukcji „Podczas importu…”. Błędy i wynik rzeczywistej operacji można komunikować.

Pastylki: krótkie nazwy, maksymalnie długość „Cudzoziem”; wyłączone pozycje są niewidoczne. Licznik +N liczy wyłącznie pastylki po prawej stronie, nie po lewej. Pod koniec pozostaje plus, który maleje i znika od około 30% do 100% widoczności ostatniej pastylki. Treść +N jest wyśrodkowana; krawędzie przewijanej listy łagodnie wygaszone gradientem. W jednej kolumnie bez wyszukiwania ukryty jest cały pasek wraz z jego odstępem. Nigdy +0, 0, znak wyboru ani strzałka końca. Wybór aktu: tylko skrót i pełna nazwa, bez nagłówka, przycisku X i liczby artykułów; zamknięcie wyborem lub kliknięciem poza oknem.

W lewym panelu dwukolumnowym zachowuj produkcyjną typografię, rozdziały rzymskie i brak kursywy. Dane o imporcie mają być w rozwijance „Pokaż dane szczegółowe”, z fontami odpowiednimi do bieżącego widoku.

Runda z 9 września nie obejmuje zmian mechaniki gestu ani wysuwanego spisu z lewej — użytkownik zapowiedział osobne uwagi.

Doprecyzowanie: w aktywnym wyszukiwaniu pastylki ustaw zawierają liczbę trafień. Odstęp wewnętrznego licznika od prawej i dolnej krawędzi jest równy; +N nadal liczy ukryte ustawy, a nie trafienia, i działa jak w dwóch kolumnach. Bez wizualnych oznaczeń fokusu na telefonie. Na pozostałych urządzeniach delikatny obrys tylko po rozpoczęciu nawigacji klawiszem Tab; domyślnie oraz po kliknięciu/dotyku niewidoczny. Zachowuj logiczny fokus i obsługę klawiatury.

Spójność paska: wspólna wysokość 27 px, font 10 px / 750, zewnętrzny padding pastylki 4 px, etykieta z 5 px wewnętrznie po bokach; odstęp między pastylkami 5 px. Początek listy wyrównany z lewą krawędzią przycisku menu, bez dodatkowego wcięcia listy. Wyszukiwanie używa tych samych przycisków i trwałego elementu licznika: płynnie zmienia szerokość licznika i kolor. Nie ukrywaj wszystkich pastylek w czasie debounce, przed otrzymaniem wyników. Gradient i +N korzystają ze wspólnych pomiarów także podczas animacji szerokości.

Ruch i wyszukiwanie: debounce 300 ms od ostatniego znaku. Po obliczeniu wyników licznik czeka 150 ms, rozszerza pole przez 180 ms i przewija trzy wartości od wyniku +3 do dokładnego wyniku przez 360 ms. To wyłącznie animacja; dane i aria-label zawierają prawdziwe wyniki. Nowa fraza, zamknięcie i ograniczony ruch przerywają/pomijają dekorację. Kolor pastylek jak w dwóch kolumnach, wyróżniona tylko bieżąca ustawa; podczas wyszukiwania wynika ona z widocznej grupy. Skok do grupy wyhamowuje przez około 280 ms i można go przerwać dotykiem. Po puszczeniu poziomego paska przy prawym końcu miejsce po +N zwalnia się przez 340 ms; ruch powrotny odtwarza miejsce i licznik. Natywne pointercancel podczas dotyku nie oznacza puszczenia palca.

Końcowy ruch paska ma łagodnie przyspieszać i wyhamowywać. Przeciągnięcie przy prawym końcu ma własny opór; nie nakładaj natywnego odbicia poziomego scrolla na osobne zwalnianie miejsca po +N. Po puszczeniu powrót rozciągnięcia i zwolnienie miejsca startują jednocześnie i biegną bezpośrednio do docelowego marginesu (340 ms, cubic-bezier(.42,0,.2,1)). Nie czekaj na powrót do starej krawędzi. Pomiar ukrytych pastylek pomija wizualne rozciągnięcie.
