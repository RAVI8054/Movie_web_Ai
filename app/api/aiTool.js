import { ChatOllama } from "@langchain/ollama";
import * as z from "zod";
import { tool } from "@langchain/core/tools";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// ---- Model setup (Ollama local) ----
const ollama = new ChatOllama({
  baseUrl: "http://localhost:11434", // Ollama default
  model: "llama3.2:1b",                // local model
});

//-----------1. Define tool functions---------------
// These call Next.js API endpoints
const ratingSearch = async ({ rating }) => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/rating/${rating}`);
    return await res.json();
  } catch (err) {
    console.error("rating fetching error:", err);
    return { error: err.message };
  }
};

const yearSearch = async ({ year }) => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/year/${year}`);
    return await res.json();
  } catch (err) {
    console.error("year fetching error:", err);
    return { error: err.message };
  }
};

const titleSearch = async ({ title }) => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/title/${title}`);
    return await res.json();
  } catch (err) {
    console.error("title fetching error:", err);
    return { error: err.message };
  }
};

const genreSearch = async ({ genre }) => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/genre/${genre}`);
    return await res.json();
  } catch (err) {
    console.error("genre fetching error:", err);
    return { error: err.message };
  }
};

//------------2. Define schemas--------------------
const ratingschema = z.object({
  rating: z.number().min(0).max(10),
});
const yearSchema = z.object({
  year: z.number().int().min(1900).max(new Date().getFullYear()),
});
const titleSchema = z.object({
  title: z.coerce.string().min(1, "Title must be at least 1 character"),
});
const genreSchema = z.object({
  genre: z
    .string()
    .min(3, "Genre must be at least 3 characters long")
    .max(20, "Genre cannot exceed 20 characters"),
});

//------3. Create tools---------//
const ratingfindTool = tool(ratingSearch, {
  name: "searchRating",
  schema: ratingschema,
  description: `Find movies by rating (0–10).`,
});
const yearfindTool = tool(yearSearch, {
  name: "yearSearch",
  schema: yearSchema,
  description: "Find movies by 4-digit year.",
});
const titleFindTool = tool(titleSearch, {
  name: "titleSearch",
  schema: titleSchema,
  description: `Find movies by title (case-insensitive).`,
});
const genreSearchTool = tool(genreSearch, {
  name: "genreSearch",
  schema: genreSchema,
  description: `Find movies by genre (Action, Comedy, Drama, Horror, etc.).`,
});

//4. Pack tools
const tools = [ratingfindTool, yearfindTool, titleFindTool, genreSearchTool];

export async function callmassag(input) {
  try {
    const ollamaWithTools = ollama.bindTools(tools);

    const messages = [
      new SystemMessage(
        `You are a smart movie assistant integrated with a movie database. 
        Your job is to understand user queries and decide whether to call one of the tools 
        (searchRating, yearSearch, genreSearch, titleSearch) or to answer directly.

        --- Rules ---
        1. If the user mentions a number between 0–10 → call searchRating with that number.
           Example: "Show me movies above 7" → searchRating(7)
        2. If the user mentions a 4-digit number that looks like a year → call yearSearch.
           Example: "Movies from 1999" → yearSearch(1999)
        3. If the user mentions a film genre (Action, Comedy, Drama, Horror, Sci-Fi, Romance, etc.) → call genreSearch.
           Example: "Find me action films" → genreSearch("Action")
        4. If the user writes something that looks like a movie name → call titleSearch.
           Example: "Inception" → titleSearch("Inception")
        5. If the query is general (like "Who are you?" or "Hello") → DO NOT call tools. Just reply conversationally.

        --- Formatting ---
        • When returning results from tools, respond with a helpful intro + the movie details (title, description, year, genre, rating).
        • Be polite, concise, and clear.
        • Never return raw JSON or tool call syntax — only human-friendly text.

        --- Important ---
        • Always prefer using tools if the query fits rules 1–4.
        • If no tool matches, answer naturally like a chatbot.`
      ),
      new HumanMessage(input),
    ];

    const aiMessage = await ollamaWithTools.invoke(messages);

    // Check for tool calls
    const toolCalls =
      aiMessage.tool_calls || aiMessage.additional_kwargs?.tool_calls || [];

    if (toolCalls.length > 0) {
      const toolCall = toolCalls[0];
      const toolToRun = tools.find((tool) => tool.name === toolCall.name);

      if (!toolToRun) return [{ error: "Tool not found." }];

      const result = await toolToRun.func(toolCall.args);
      const name = toolCall.name;

      if (!result || result.length === 0) {
        return [{ message: "No movies found for your search." }];
      }

      // ---- Format responses ----
      if (name === "titleSearch") {
        return [
          { message: "In this title matching movies are:" },
          ...result.map((m) => ({
            title: m.title,
            description: m.description,
            year: m.year,
            genre: m.genre,
            rating: m.rating,
          })),
        ];
      }

      if (name === "searchRating") {
        return [
          { message: `Movies with rating ${toolCall.args.rating} and above:` },
          ...result.map((m) => ({
            title: m.title,
            description: m.description,
            year: m.year,
            genre: m.genre,
            rating: m.rating,
          })),
        ];
      }

      if (name === "yearSearch") {
        return [
          { message: `Movies released in ${toolCall.args.year}:` },
          ...result.map((m) => ({
            title: m.title,
            description: m.description,
            year: m.year,
            genre: m.genre,
            rating: m.rating,
          })),
        ];
      }

      if (name === "genreSearch") {
        return [
          { message: `Movies in the ${toolCall.args.genre} genre:` },
          ...result.map((m) => ({
            title: m.title,
            description: m.description,
            year: m.year,
            genre: m.genre,
            rating: m.rating,
          })),
        ];
      }
    }

    console.log("AI Message:", aiMessage.content);
    // ---- Normal response (no tools triggered) ----
    return [{ message: aiMessage.content || "Here’s my answer:" }];
  } catch (error) {
    console.error("AI error:", error);
    return [{ error: error.message }];
  }
}
