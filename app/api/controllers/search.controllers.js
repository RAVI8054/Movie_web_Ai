import MoviesModel from "../models/Movies.model";
import { callmassag } from "../aiTool";
import { connectDB } from "../mongoDb";

export async function yearSearch(year) {
  await connectDB();
  return MoviesModel.find({ year });
}

export async function titleSearch(title) {
  await connectDB();
  return MoviesModel.find({ title: { $regex: title, $options: "i" } });
}

export async function genreSearch(genre) {
  await connectDB();
  return MoviesModel.find({ genre: { $regex: genre, $options: "i" } });
}

export async function ratingSearch(rating) {
  await connectDB();
  return MoviesModel.find({ rating: { $gte: rating } });
}

export async function connectAi(search) {
  if (!search) return { error: "Search message missing" };
  return callmassag(search);
}
