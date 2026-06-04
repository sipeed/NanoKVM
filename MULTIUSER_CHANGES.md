# NanoKVM Multi-User Support (v2.4.2)

Dieses Paket ist die v2.4.2-Portierung des Multi-User-Patches mit Rollen-basierter
Zugriffskontrolle (RBAC) für die NanoKVM-Weboberfläche.

## Geändert gegenüber v2.4.1-Multiuser

| Bereich | Änderung |
|---------|----------|
| Basis-Version | Rebased auf Upstream NanoKVM **2.4.2** (commit `863fea9`) |
| `web/src/pages/desktop/menu/index.tsx` | Mit 2.4.2-Reihenfolge zusammengeführt (Terminal vor Script), Rollen-Wrapper bleibt |
| `web/src/i18n/locales/de.ts` | Neuer `captureStatus`/`verifying`-Block aus 2.4.2 + Multiuser `users`-Block |
| `web/src/i18n/locales/*.ts` | `users:`-Block in **alle 24 Sprachen** übersetzt (war in 2.4.1-multiuser nur in de/en) |
| `server/service/application/service.go` | **Update-Kanal auf Schattenwelt/NanoKVM Fork-Releases umgestellt** |

Alle anderen Multiuser-Dateien sind aus v2.4.1-Multiuser 1:1 übernommen, weil
2.4.2-Upstream sie nicht angefasst hat (Server-Side hat **null Überlappung**
zwischen Multiuser-Patches und 2.4.2-Änderungen — die 2.4.2-Änderungen betreffen
ausschließlich Stream/WebRTC/PicoClaw/WoL).

## Update-Kanal (neu in 2.4.2-Multiuser)

`server/service/application/service.go`:

```go
StableURL  = "https://github.com/Schattenwelt/NanoKVM/releases/latest/download"
PreviewURL = "https://github.com/Schattenwelt/NanoKVM/releases/download/preview"
```

Damit holt die "Nach Aktualisierungen suchen"-Funktion in der Weboberfläche
`latest.json` und `nanokvm_<version>.tar.gz` aus dem GitHub-Release deines
Forks (`Schattenwelt/NanoKVM`). GitHub liefert Release-Assets über automatische
Redirects, das funktioniert ohne Custom-CDN.

### Workflow für Releases im Fork

1. Build-Skript ausführen (`build_nanokvm_multiuser.ps1`) → erzeugt:
   - `NanoKVM-Output/nanokvm_2.4.2.tar.gz`
   - `NanoKVM-Output/latest.json`
2. In `Schattenwelt/NanoKVM` neues Release anlegen (z.B. Tag `2.4.2-mu1`).
3. **Beide Dateien** als Release-Assets hochladen.
4. Release als "Latest" markieren.
5. Auf dem Gerät erscheint das Update über "Einstellungen → Nach Aktualisierungen suchen".

### Hinweis zur Version

Der Build-Script schreibt aktuell `"version": "2.4.2"` in `latest.json`. Wenn die
installierte und die im Release deklarierte Version identisch sind, zeigt das
Gerät "Aktuell". Für Updates am gleichen Upstream solltest du die `latest.json`
mit einem Suffix versehen (z.B. `2.4.2-mu1`) oder einen entsprechenden
Build-Schalter im PowerShell-Skript nutzen.

## Bekannte Konfliktpunkte beim Mergen (für künftige Releases)

Wenn Sipeed künftig 2.4.3 oder höher veröffentlicht, sind folgende Multiuser-
Dateien Kandidaten für 3-Wege-Merge:

- `web/src/i18n/locales/de.ts`, `en.ts` — werden bei i18n-Updates häufig geändert
- `web/src/pages/desktop/menu/index.tsx` — kleine UI-Änderungen pro Release
- `web/src/pages/desktop/menu/settings/index.tsx` — bei neuen Settings-Tabs

Alle Multiuser-Server-Dateien (`server/router/auth.go`, `server/middleware/jwt.go`,
`server/service/auth/*.go`) sind eigenständig und kollidieren selten.

---

(Für die Multiuser-Spezifikation selbst — Rollen, API, Speicherformat — siehe
die Version dieser Datei im 2.4.1-Multiuser-Quellpaket, sie ist unverändert.)
