import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    const response = await fetch(
      `https://api2.heygen.com/v1/streaming/session.detail?session_id=${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.HEYGEN_API_KEY}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch session detail: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching session detail:", error);

    return NextResponse.json(
      { error: "Failed to fetch session detail" },
      { status: 500 },
    );
  }
}
