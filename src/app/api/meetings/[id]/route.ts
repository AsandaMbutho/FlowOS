import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json(
    { error: "Meetings temporarily unavailable" },
    { status: 503 },
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Meetings temporarily unavailable" },
    { status: 503 },
  );
}
