import { NextResponse } from "next/server";

const KEY = process.env.SLIDESPEAK_API_KEY;

export async function POST(req: Request) {
  try {
    if (!KEY) {
      throw new Error("API key is missing from .env");
    }

    const { projectSummary } = await req.json();

    const response = await fetch(
      "https://api.slidespeak.co/api/v1/presentation/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": KEY,
        },
        body: JSON.stringify({
          plain_text: projectSummary,
          length: 6,
          template: "default",
          language: "ORIGINAL",
          fetch_images: true,
          tone: "default",
          verbosity: "standard",
          custom_user_instructions: "",
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error("Slidespeak API error response:", errorText);
      throw new Error(`Failed to generate slides: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error generating slides:", error);

    return NextResponse.json(
      { error: "Failed to generate slides" },
      { status: 500 },
    );
  }
}
