import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

const COLLECTION = "products";

// The four products that used to be hard-coded in the app. If the
// Firestore collection has never been touched, we seed these once so
// the Products page looks the same as it always did.
const DEFAULT_PRODUCTS = [
  {
    slug: "flowos",
    name: "FlowOS",
    description: "Workflow Operating System - The platform itself",
    icon: "🚀",
    color: "from-teal-500 to-emerald-500",
    websiteUrl: null as string | null,
  },
  {
    slug: "cybersafe",
    name: "CyberSafe Africa",
    description: "Cybersecurity platform integration and protection",
    icon: "🛡️",
    color: "from-red-500 to-orange-500",
    websiteUrl: "https://cyber-safe-africa.vercel.app/",
  },
  {
    slug: "elearning",
    name: "E-Learning Platform",
    description: "Educational content delivery system",
    icon: "📚",
    color: "from-blue-500 to-cyan-500",
    websiteUrl:
      "https://media-on-africa-learning-hub.github.io/Media-On-Africa-Learning-Hub/index.html",
  },
  {
    slug: "crm",
    name: "CRM Real Estate Platform",
    description: "Property listings, client tracking, deal pipeline",
    icon: "🏢",
    color: "from-purple-500 to-pink-500",
    websiteUrl: null as string | null,
  },
];

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Product request failed";
}

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "product"
  );
}

function serialize(doc: FirebaseFirestore.QueryDocumentSnapshot) {
  const data = doc.data();
  return {
    id: doc.id,
    slug: doc.id,
    name: data.name as string,
    description: data.description as string,
    icon: (data.icon as string) || "📦",
    color: (data.color as string) || "from-slate-500 to-slate-600",
    websiteUrl: (data.websiteUrl as string | null) ?? null,
  };
}

export async function GET() {
  try {
    const collection = firestore.collection(COLLECTION);
    let snapshot = await collection.get();

    if (snapshot.empty) {
      const batch = firestore.batch();
      const now = Timestamp.now();
      for (const product of DEFAULT_PRODUCTS) {
        const { slug, ...rest } = product;
        batch.set(collection.doc(slug), { ...rest, createdAt: now, updatedAt: now });
      }
      await batch.commit();
      snapshot = await collection.get();
    }

    const products = snapshot.docs
      .map(serialize)
      .sort((a, b) =>
        (a.name || "").localeCompare(b.name || ""),
      );

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

// POST /api/products
// body: { name, description, icon?, color?, websiteUrl? }
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.description) {
      return NextResponse.json(
        { error: "name and description are required" },
        { status: 400 },
      );
    }

    const collection = firestore.collection(COLLECTION);

    // Slug doubles as the Firestore document id, so uniqueness is just
    // "does a document with this id already exist".
    const base = slugify(body.name);
    let slug = base;
    let suffix = 2;
    while ((await collection.doc(slug).get()).exists) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }

    const now = Timestamp.now();
    await collection.doc(slug).set({
      name: body.name as string,
      description: body.description as string,
      icon: (body.icon as string) || "📦",
      color: (body.color as string) || "from-slate-500 to-slate-600",
      websiteUrl: (body.websiteUrl as string) || null,
      createdAt: now,
      updatedAt: now,
    });

    const created = await collection.doc(slug).get();
    return NextResponse.json(
      serialize(created as FirebaseFirestore.QueryDocumentSnapshot),
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 422 });
  }
}
