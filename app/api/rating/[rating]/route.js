import { ratingSearch } from "../../controllers/search.controllers";

export async function GET(req, { params }) {
  const movies = await ratingSearch(params.rating);
  if (!movies.length) {
    return Response.json({ message: "No movies found" }, { status: 404 });
  }
  return Response.json(movies);
}

