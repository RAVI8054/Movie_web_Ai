import mongoose from "mongoose";

const MoviesSchema = new mongoose.Schema({
  title: String,
  year: Number,
  genre: String,
  country: String,
  rating: Number,
  description: String,
});

// Prevent re-compilation on hot reload
const MoviesModel =
  mongoose.models.MoviesData || mongoose.model("MoviesData", MoviesSchema);

export default MoviesModel;
