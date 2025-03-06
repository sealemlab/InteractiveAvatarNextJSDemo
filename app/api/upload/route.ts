import { NextResponse } from "next/server";

const KEY = process.env.UNSTRACT_BEARER_TOKEN;

export async function POST(request: Request) {
  try {
    if (!KEY) {
      throw new Error("API key is missing from .env");
    }

    const formData = await request.formData();
    const file = formData.get("files") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const uploadFormData = new FormData();

    uploadFormData.append("files", file);
    uploadFormData.append("timeout", "300");

    const response = await fetch(
      "https://us-central.unstract.com/deployment/api/org_EWKLd4j8vhtgVURx/co2-upload/",
      {
        method: "POST",
        body: uploadFormData,
        headers: {
          Authorization: `Bearer ${KEY}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    const result = await response.text();

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
