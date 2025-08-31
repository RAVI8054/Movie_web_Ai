import { ChatOllama } from "@langchain/ollama";
import * as z from "zod";
import { tool } from "@langchain/core/tools";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// ---- Model setup (Ollama local) ----
const ollama = new ChatOllama({
  baseUrl: "http://localhost:11434", // Ollama default
  model: "llama3.2:1b", // local model
});

//-----------1. Define tool functions---------------
async function safeFetch(url) {
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      const text = await res.text();
      return { error: `HTTP ${res.status}: ${text}` };
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Fetch error:", err);
    return { error: err?.message || "Network error" };
  }
}

const enc = encodeURIComponent;

const ratingSearch = async ({ rating }) =>
  safeFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/rating/${rating}`);
const yearSearch = async ({ year }) =>
  safeFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/year/${year}`);
const titleSearch = async ({ title }) =>
  safeFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/title/${enc(title)}`);
const genreSearch = async ({ genre }) =>
  safeFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/genre/${enc(genre)}`);

//------------2. Define schemas--------------------
const ratingSchema = z.object({ rating: z.number().min(0).max(10) });
const yearSchema = z.object({
  year: z.number().int().min(1900).max(new Date().getFullYear()),
});
const titleSchema = z.object({
  title: z.coerce.string().min(1, "Title must be at least 1 character"),
});
const genreSchema = z.object({
  // Allow combined genres like "Action-Thriller", common tags, etc.
  genre: z.string().min(3).max(40),
});

//------3. Create tools---------//
const ratingFindTool = tool(ratingSearch, {
  name: "searchRating",
  schema: ratingSchema,
  description: `Find movies by minimum rating (0–10).`,
});
const yearFindTool = tool(yearSearch, {
  name: "yearSearch",
  schema: yearSchema,
  description: "Find movies by 4-digit release year.",
});
const titleFindTool = tool(titleSearch, {
  name: "titleSearch",
  schema: titleSchema,
  description: `Find movies by title (case-insensitive).`,
});
const genreSearchTool = tool(genreSearch, {
  name: "genreSearch",
  schema: genreSchema,
  description: `Find movies by genre (Action, Comedy, Drama, Horror, etc.). Supports combos like Action-Thriller and tags like rom-com or sci-fi.`,
});

// 4. Pack tools
const tools = [ratingFindTool, yearFindTool, titleFindTool, genreSearchTool];

// ---- Helper: normalize + intersect results from multiple tools ----
function normalizeTitle(s) {
  return (s || "").toString().trim().toLowerCase();
}

function coerceArray(maybe) {
  if (Array.isArray(maybe)) return maybe;
  if (maybe && maybe.data && Array.isArray(maybe.data)) return maybe.data;
  return [];
}

function intersectResults(resultLists) {
  if (!resultLists.length) return [];
  // Start with the smallest list for efficiency
  const lists = [...resultLists].sort((a, b) => a.length - b.length);
  const first = lists[0];
  const otherSets = lists.slice(1).map((lst) => {
    const set = new Set(lst.map((m) => normalizeTitle(m.title)));
    return set;
  });
  const out = [];
  for (const m of first) {
    const key = normalizeTitle(m.title);
    const inAll = otherSets.every((set) => set.has(key));
    if (inAll) out.push(m);
  }
  return out;
}

// Helper to format movie object safely
function formatMovie(m) {
  return {
    title: m?.title || "Unknown Title",
    description: m?.description || "No description",
    year: m?.year ?? "N/A",
    genre: m?.genre || "N/A",
    rating: m?.rating ?? "N/A",
  };
}

function humanizeFilters(filters) {
  const parts = [];
  if (filters.title) parts.push(`title contains "${filters.title}"`);
  if (filters.genre) parts.push(`genre = ${filters.genre}`);
  if (filters.year) parts.push(`year = ${filters.year}`);
  if (filters.rating != null) parts.push(`rating ≥ ${filters.rating}`);
  return parts.join(", ");
}

export async function callmassag(input) {
  try {
    const ollamaWithTools = ollama.bindTools(tools);

    const messages = [
      new SystemMessage(
        [
          "You are a routing assistant for a movie database.",
          "Decide which of these tools to call: titleSearch, genreSearch, yearSearch, searchRating.",
          "You may call MULTIPLE tools in a single turn when the user provides multiple constraints (e.g., title + year + genre + rating).",
          "When tools are appropriate, do NOT provide a normal text answer—emit tool calls only.",
          "Infer genres from free text using this canonical set and common tags: Action, Adventure, Comedy, Drama, Horror, Thriller, Science Fiction, Sci-Fi, Fantasy, Romance, Mystery, Crime, Musical, Documentary, Animation, War, Western, Noir, Family.",
          "Support combined genres (e.g., Action-Thriller, Romantic Comedy, Sci-Fi Thriller) and colloquial tags (rom-com, sci fi, bio-pic).",
          "Map 'above/over/at least X' rating phrasing to { rating: X } for searchRating.",
          "If the user gives a 4-digit year, call yearSearch with that number.",
          "If the user mentions a specific film name, call titleSearch with the full string.",
          "If the user only wants general chat or recommendations without filters, then respond normally.",
        ].join("\n")
      ),
      new HumanMessage(input),
    ];

    const aiMessage = await ollamaWithTools.invoke(messages);

    // Gather ALL tool calls (support multi-filter queries)
    const toolCalls =
      aiMessage.tool_calls || aiMessage.additional_kwargs?.tool_calls || [];

    // If there are tool calls, run them ALL and combine results by intersection
    if (toolCalls.length > 0) {
      const resultsByTool = [];
      const filtersUsed = { title: null, genre: null, year: null, rating: null };

      for (const call of toolCalls) {
        const toolToRun = tools.find((t) => t.name === call.name);
        if (!toolToRun) continue;

        // Track filters for the header message
        if (call.name === "titleSearch" && call.args?.title)
          filtersUsed.title = call.args.title;
        if (call.name === "genreSearch" && call.args?.genre)
          filtersUsed.genre = call.args.genre;
        if (call.name === "yearSearch" && call.args?.year != null)
          filtersUsed.year = call.args.year;
        if (call.name === "searchRating" && call.args?.rating != null)
          filtersUsed.rating = call.args.rating;

        const raw = await toolToRun.func(call.args);
        if (raw?.error || raw?.message) {
          // Treat as empty on error; continue to allow other filters
          resultsByTool.push([]);
          continue;
        }
        resultsByTool.push(coerceArray(raw));
      }

      // If every tool errored, fall back
      const anyNonEmpty = resultsByTool.some((arr) => arr.length > 0);
      if (!anyNonEmpty) {
        return [
          {
            message:
              "No movies found or upstream API returned an error for your filters.",
          },
        ];
      }

      const combined =
        resultsByTool.length === 1
          ? resultsByTool[0]
          : intersectResults(resultsByTool);

      if (!combined.length) {
        return [
          {
            message: `No movies matched all filters: ${humanizeFilters(
              filtersUsed
            )}. Try relaxing one filter.`,
          },
        ];
      }

      return [
        { message: `Movies matching ${humanizeFilters(filtersUsed)}:` },
        ...combined.map((m) => formatMovie(m)),
      ];
    }

    // ---- Normal response (no tools triggered) ----
    return [{ message: aiMessage.content || "Here’s my answer:" }];
  } catch (error) {
    console.error("AI error:", error);
    return [{ error: error?.message || "Unknown error" }];
  }
}
