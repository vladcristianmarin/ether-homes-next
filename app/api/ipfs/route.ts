import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log(request);

  return new NextResponse(JSON.stringify({ message: "Hello" }));
}
