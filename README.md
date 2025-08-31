# Movie Search with LangChain + Ollama

This project provides a **movie search assistant** using [LangChain](https://js.langchain.com) with a local [Ollama](https://ollama.com) LLM and custom API tools for filtering movies by **title**, **genre**, **year**, and **rating**.

---

## 🚀 Features

* Natural language movie queries.
* Automatic tool routing with LangChain.
* Support for multiple filters at once (e.g., *“Find action movies from 1999 with rating 8+”*).
* Genre inference with support for combined/colloquial tags (e.g., *rom-com*, *action-thriller*, *sci-fi*).
* Intersects results from multiple tool calls to give precise matches.

---

## 📦 Installation

1. Clone the repo:

   ```bash
   git clone <your-repo-url>
   cd your-repo
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Install [Ollama](https://ollama.com) and pull the required model (default: `llama3.2:1b`):

   ```bash
   ollama pull llama3.2:1b
   ```

4. Start Ollama server (usually runs at `http://localhost:11434`):

   ```bash
   ollama serve
   ```

5. Configure environment variables:

   ```env
   NEXT_PUBLIC_BASE_URL=http://localhost:3000   # or your API base URL
   ```

---

## 🛠️ Usage

Import and call the main function with a query:

```js
import { callmassag } from "./ollama-movie-tools-fixed.js";

const response = await callmassag("Find comedy movies from 2010 with rating above 7");
console.log(response);
```

Example output:

```json
[
  { "message": "Movies matching genre = Comedy, year = 2010, rating ≥ 7:" },
  {
    "title": "Easy A",
    "description": "A comedy about...",
    "year": 2010,
    "genre": "Comedy",
    "rating": 7.5
  },
  ...
]
```

---

## 📚 API Endpoints

The tools expect your backend to provide these endpoints (returning JSON arrays of movies):

* `GET /api/title/:title`
* `GET /api/genre/:genre`
* `GET /api/year/:year`
* `GET /api/rating/:rating`

Each movie object should follow this shape:

```json
{
  "title": "string",
  "description": "string",
  "year": 2020,
  "genre": "Action",
  "rating": 8.5
}
```

---

## 🧩 How It Works

1. User input is sent to the Ollama LLM.
2. System prompt instructs the LLM to:

   * Parse genres, years, titles, ratings.
   * Call one or more tools accordingly.
3. Each tool fetches from the API.
4. Results from multiple tools are **intersected** to ensure all filters are applied.
5. Final results are formatted and returned.

---

## 🔧 Development Notes

* Extend `genreSchema` if you want to support more custom genre tags.
* Add new tools easily by following the same `tool(...)` pattern.
* The `intersectResults` helper ensures multi-filter precision.

---

## 📜 License

MIT License
