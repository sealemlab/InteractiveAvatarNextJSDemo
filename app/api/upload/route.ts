import { NextResponse } from "next/server";

const API_URL =
  "https://us-central.unstract.com/deployment/api/org_kW2BkRoMu28kIR73/testAPI/";
const API_TOKEN = "08e9d508-75ab-4048-a46f-515888fcceb7";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("files") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const uploadFormData = new FormData();

    uploadFormData.append("files", file);
    uploadFormData.append("timeout", "300");

    const response = await fetch(API_URL, {
      method: "POST",
      body: uploadFormData,
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

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
