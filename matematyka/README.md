# Mała Nauka — Matematyka

Ten katalog jest niezależnym modułem matematycznym projektu Mała Nauka.

## Branch

Rozwój modułu odbywa się na branchu `codex/matematyka-v0.1` utworzonym bezpośrednio z `main`.

Dzięki temu branch matematyki nie dziedziczy zmian z `codex/dyktando-v0.2`, a branch dyktanda nie dziedziczy zmian matematyki. Oba moduły mogą być rozwijane, testowane i previewowane równolegle.

## Zasada pracy

- `codex/dyktando-v0.2` → zmiany wyłącznie w `dyktando/`
- `codex/matematyka-v0.1` → zmiany wyłącznie w `matematyka/`
- wspólne elementy Małej Nauki trafiają do obu modułów dopiero świadomie, po ich ustabilizowaniu
- integracja modułów następuje osobno; nie używamy jednego modułu jako bazy dla drugiego

## Vercel

Docelowo preview matematyki powinno wskazywać katalog `matematyka/` jako Root Directory, niezależnie od preview dyktanda wskazującego `dyktando/`.
