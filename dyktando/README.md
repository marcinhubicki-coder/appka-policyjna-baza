# Mała Nauka v1

Lekka, samodzielna PWA w Vanilla HTML/CSS/JS. Vercel: **Root Directory = `dyktando`**, bez procesu budowania i bez dodatkowych zależności.

Pięć trybów: Ortografia (niezmienione 400 zatwierdzonych rekordów), Matematyka (generator z 6 odpowiedziami), Angielski (42 ręcznie przygotowane słówka, 4 odpowiedzi), Flagi (20 lokalnych SVG, 4 odpowiedzi) i eksperymentalne Czytanie (24 słowa, frazy i zadania ze zrozumienia).

## Uruchomienie lokalne

Z katalogu repozytorium:

```sh
python3 -m http.server 8080
```

Otwórz `http://localhost:8080/dyktando/`. Można też serwować sam katalog `dyktando` jako root — manifest, importy i zasoby używają ścieżek względnych.

## Zasady rundy

- Ostatnia kategoria, poziom i czas (1/2/3/5 minut) są pamiętane osobno dla każdego trybu.
- Poprawna odpowiedź: pełna poprawna forma, punkt i automatyczne przejście po 700 ms; czas biegnie dalej.
- Błąd: pełna poprawna odpowiedź i zatrzymany zegar, do kliknięcia **Dalej**.
- Pauza zatrzymuje również ekspozycję tekstu w Czytaniu. Ukrycie strony automatycznie pauzuje grę. Podczas pauzy pytanie jest zasłonięte.
- Wyjście wymaga potwierdzenia, zapisuje dotychczasowy wynik i wraca do startu.
- W Czytaniu tekst znika po 2,6 s (słowa), 3,5 s (frazy) albo 5,5 s (zdania). Dopiero wtedy pojawiają się odpowiedzi.
- Ortografia filtruje istniejące poziomy bez zmieniania bazy. Pusta kombinacja kategorii i poziomu wymaga zmiany wyboru.

## Dane i offline

`malaNauka.v1.*` w localStorage: ustawienia, konfiguracje rund oraz wspólny zapis historii, rekordów per tryb/czas i dziennej liczby zadań. Przy pierwszym otwarciu przenoszone są stare wyniki `maleDyktando.*`, bez usuwania starych kluczy. Historia obejmuje ostatnie 50 rund, a dzienny licznik i rekordy nie zależą od przycinania historii.

Service worker precache'uje cały interfejs, dane oraz flagi. Pierwsze otwarcie wymaga internetu; po przygotowaniu zasobów całość działa offline. Zakres workera i manifestu wynika z położenia aplikacji. Worker obsługuje tylko własną listę zasobów i usuwa tylko własne cache. Aktualizacja aktywuje się po zamknięciu poprzednich sesji, aby nie wymienić kodu podczas rundy. Po zmianach w plikach precache trzeba zmienić wersję `CACHE` w `sw.js`.

Na iPhonie: Safari → Udostępnij → Do ekranu początkowego. Ikony PNG i `apple-touch-icon` pochodzą z zaakceptowanej grafiki użytkownika. Oba mockupy SVG naprawiono z ponownie przesłanych oryginałów. Interfejs zachowuje kierunek storyboardu; wykorzystuje dotychczasowego lokalnego lwa.

## Celowana kontrola

```sh
node --test dyktando/tests/*.test.mjs
```

Testy obejmują zatwierdzoną bazę, liczbę i poprawność odpowiedzi, arytmetykę, pauzę, zatrzymanie czasu po błędzie, ekspozycję tekstu, migrację i zapis wyników oraz zakres PWA.

Dodatkowo sprawdzono w Chromium: start 390×844 i 375×667 bez scrolla; konfigurację, pytania i feedback wszystkich trybów przy 390×844; pauzę, wyjście, zapis po odświeżeniu oraz przeładowanie i wszystkie tryby offline. Safari i instalacja na fizycznym iPhonie pozostają do sprawdzenia na urządzeniu. Zmiany są ograniczone do `dyktando/`.
