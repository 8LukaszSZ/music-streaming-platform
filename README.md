# WaveStream

**WaveStream** to pełnofunkcjonalna platforma do streamingu muzyki, stworzona jako projekt inżynierski. Umożliwia użytkownikom publikowanie własnych utworów, tworzenie playlist, odkrywanie nowej muzyki, interakcję społecznościową oraz komunikację w czasie rzeczywistym.

---

## Funkcjonalności

### Muzyka i odtwarzanie

- Upload utworów audio z okładką (obsługa plików do ~110 MB)
- Globalny odtwarzacz audio z kontekstem kolejki
- Prywatne i publiczne utwory
- Metadane utworów: valence, energy (opcjonalne)
- Automatyczne wykrywanie długości pliku audio (NAudio)

### Playlisty

- Tworzenie, edycja i usuwanie playlist
- Publiczne i prywatne playlisty z własną okładką
- Zarządzanie kolejnością utworów w playliście

### Społeczność

- Profile użytkowników ze zdjęciem i bio
- Obserwowanie innych użytkowników
- Polubienia utworów i playlist
- Komentarze pod utworami
- Udostępnianie treści (utwory, playlisty)
- Feed aktywności użytkownika

### Odkrywanie muzyki

- Trending tracks - najpopularniejsze utwory
- Popularne playlisty
- Rekomendacje „Fans also like” na podstawie historii odsłuchań
- Wyszukiwarka utworów i artystów

### Statystyki

- Liczba odsłuchań i polubień w czasie (wykresy Recharts)
- Statystyki per utwór i per artysta

### Czat

- Wiadomości prywatne między użytkownikami w czasie rzeczywistym (SignalR)
- Dołączanie utworów i playlist do wiadomości
- Licznik nieprzeczytanych wiadomości

### Autoryzacja

- Rejestracja i logowanie (JWT)
- Role: User, Admin
- Zarządzanie kontem (zmiana hasła, usuwanie konta)

---

## Stos technologiczny


| Warstwa                   | Technologie                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| **Frontend**              | React 19, TypeScript, Vite, React Router, TanStack Query, Framer Motion, Recharts, SignalR Client |
| **Backend**               | ASP.NET Core 8, Entity Framework Core, SignalR, JWT Bearer, Swagger                               |
| **Baza danych**           | PostgreSQL                                                                                        |
| **Architektura backendu** | Warstwowa: API → BL → DAL (Repository Pattern)                                                    |


---

## Struktura projektu

```
music-streaming-platform/
├── frontend/                  # Aplikacja React (Vite)
│   └── src/
│       ├── api/               # Warstwa komunikacji z API
│       ├── components/        # Komponenty UI
│       ├── contexts/          # React Context (AudioPlayer)
│       ├── hooks/             # Custom hooks
│       ├── pages/             # Widoki / routing
│       ├── services/          # Logika biznesowa frontendu
│       └── types/             # Definicje TypeScript
│
└── backend/
    └── MusicStreamingBackend/
        ├── MusicStreaming.API/   # Kontrolery, Huby SignalR, middleware
        ├── BL/                   # Serwisy biznesowe
        ├── DAL/                  # Repozytoria, migracje EF Core
        ├── IBL/                  # Interfejsy serwisów
        ├── IDAL/                 # Interfejsy repozytoriów
        └── Models/               # Encje, DTO, stałe
```

---

## Uruchomienie lokalne

### Wymagania

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/)

### 1. Baza danych

Utwórz bazę PostgreSQL i skonfiguruj connection string w pliku:

```
backend/MusicStreamingBackend/MusicStreaming.API/appsettings.Development.json
```

Przykład:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=wavestream;Username=postgres;Password=YOUR_PASSWORD"
}
```

### 2. Backend

```bash
cd backend/MusicStreamingBackend/MusicStreaming.API
dotnet ef database update --project ../DAL
dotnet run
```

API będzie dostępne pod adresem `https://localhost:7232`  
Dokumentacja Swagger: `https://localhost:7232/swagger`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplikacja frontendowa uruchomi się pod adresem `http://127.0.0.1:3000`

Opcjonalnie utwórz plik `.env` w katalogu `frontend/`:

```env
VITE_API_BASE_URL=https://localhost:7232/api
```

---

## API - główne endpointy


| Moduł          | Endpoint                 |
| -------------- | ------------------------ |
| Autoryzacja    | `/api/auth/*`            |
| Użytkownicy    | `/api/user/*`            |
| Utwory         | `/api/localtracks/*`     |
| Playlisty      | `/api/playlists/*`       |
| Polubienia     | `/api/contentlikes/*`    |
| Komentarze     | `/api/contentcomments/*` |
| Statystyki     | `/api/contentstats/*`    |
| Odsłuchy       | `/api/contentplays/*`    |
| Obserwowanie   | `/api/userfollows/*`     |
| Konwersacje    | `/api/conversation/*`    |
| Wiadomości     | `/api/message/*`         |
| Czat (SignalR) | `/hubs/chat`             |


---

## Autor

**Łukasz Szkatuła** - projekt inżynierski

---

