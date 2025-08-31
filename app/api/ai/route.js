import { callmassag } from "../aiTool";

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.search) {
      return Response.json({ error: "Search message missing" }, { status: 400 });
    }

    const result = await callmassag(body.search);
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
