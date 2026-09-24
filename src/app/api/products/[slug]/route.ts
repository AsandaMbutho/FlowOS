import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const doc = await firestore.collection("products").doc(slug).get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const data = doc.data()!;
  return NextResponse.json({
    id: doc.id,
    slug: doc.id,
    name: data.name,
    description: data.description,
    icon: data.icon || "📦",
    color: data.color || "from-slate-500 to-slate-600",
    websiteUrl: data.websiteUrl ?? null,
  });
}
