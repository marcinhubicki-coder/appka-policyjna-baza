# Ortografia v0.3 — modularny workflow

Ten katalog zawiera wyłącznie warstwę wizualną i pomocniczą trybu Ortografia. Pozostałe tryby Małej Nauki nie muszą być dotykane przy iteracjach graficznych.

## Moduły

- `art.mjs` — składa ekran i wybiera wariant full/split.
- `scenes.mjs` — mapuje słowo na scenę oraz losuje wariant layoutu.
- `word-reveal.mjs` — bąbel, sparkles i płynne odsłanianie 1- lub 2-literowego fragmentu.
- `hints.mjs` — zasady ortograficzne i panel podpowiedzi.
- `../spelling-art.css` — izolowane style wyłącznie dla Ortografii.

## Grafiki

Sceny są opcjonalne i ładowane z `assets/scenes/<key>.webp` dopiero, gdy są potrzebne. Brak pliku nie blokuje aplikacji: ekran korzysta z lekkiego fallbacku CSS.

Service worker nie precache'uje ilustracji. Po pierwszym użyciu poprawnie pobrana scena trafia do osobnego runtime cache. Dzięki temu można dodawać i wymieniać pojedyncze ilustracje bez przebudowy dużej paczki assetów i bez ryzyka zepsucia instalacji PWA.

## Iteracje

Preferowany workflow: jedna zmiana wizualna / jedna scena / jeden moduł → mały commit → Vercel Preview → test na iPhonie. Produkcja dopiero po akceptacji preview.
