// scripts/restore-missing-documents.ts
// Inserts a Document row for every blob with no matching Document.
// All restored as workflowId=null, project="uncategorized".
//
// Safe by default: runs as a DRY RUN unless you pass --apply
//   Dry run:     npx tsx scripts/restore-missing-documents.ts
//   Actually write: npx tsx scripts/restore-missing-documents.ts --apply

import fs from "fs";
import path from "path";

// Load .env.local explicitly so this script targets the SAME database
// your Next.js dev server uses (Next.js prioritizes .env.local over .env).
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      if (value.startsWith('"') && value.endsWith('"'))
        value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'"))
        value = value.slice(1, -1);
      process.env[key] = value;
    }
    console.log("Loaded environment from .env.local\n");
  } else {
    console.log("No .env.local found, falling back to default env.\n");
  }
}

loadEnvLocal();

import { PrismaClient } from "@prisma/client";
import { list } from "@vercel/blob";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

function parseBlobPathname(pathname: string) {
  const workflowMatch = pathname.match(/^workflows\/([^/]+)\/(.+)$/);
  const rest = workflowMatch ? workflowMatch[2] : pathname;

  const noTimestamp = rest.replace(/^\d{10,}-/, "");

  const suffixMatch = noTimestamp.match(
    /^(.*)-([A-Za-z0-9_-]{15,30})\.([A-Za-z0-9]+)$/,
  );

  let name: string;
  let ext: string;
  if (suffixMatch) {
    name = suffixMatch[1];
    ext = suffixMatch[3];
  } else {
    const extMatch = noTimestamp.match(/^(.*)\.([A-Za-z0-9]+)$/);
    name = extMatch ? extMatch[1] : noTimestamp;
    ext = extMatch ? extMatch[2] : "unknown";
  }

  return { name: name.trim(), ext: ext.toLowerCase() };
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileTypeFromExt(ext: string) {
  const map: Record<string, string> = {
    pdf: "PDF",
    docx: "Word Document",
    doc: "Word Document",
    pptx: "PowerPoint",
    ppt: "PowerPoint",
    xlsx: "Excel",
    xls: "Excel",
    png: "Image",
    jpg: "Image",
    jpeg: "Image",
    gif: "Image",
    csv: "CSV",
    txt: "Text",
  };
  return map[ext] || "Other";
}

async function main() {
  let cursor: string | undefined;
  let allBlobs: {
    url: string;
    pathname: string;
    size: number;
    uploadedAt: Date;
  }[] = [];
  do {
    const result = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      cursor,
      limit: 1000,
    });
    allBlobs = allBlobs.concat(result.blobs);
    cursor = result.cursor;
  } while (cursor);

  const existingDocs = await prisma.document.findMany({
    select: { fileUrl: true },
  });
  const existingUrls = new Set(existingDocs.map((d) => d.fileUrl));

  const missing = allBlobs.filter((b) => !existingUrls.has(b.url));

  console.log(`Found ${missing.length} blobs with no Document row.`);
  console.log(
    APPLY
      ? "Mode: APPLY (will write to database)\n"
      : "Mode: DRY RUN (no writes)\n",
  );

  let created = 0;
  for (const blob of missing) {
    const { name, ext } = parseBlobPathname(blob.pathname);
    const doc = {
      name,
      fileUrl: blob.url,
      fileType: fileTypeFromExt(ext),
      fileSize: formatSize(blob.size),
      project: "uncategorized",
      workflowId: null,
      uploadedBy: null,
      createdAt: blob.uploadedAt,
    };

    console.log(`- ${doc.name} (${doc.fileType}, ${doc.fileSize})`);

    if (APPLY) {
      await prisma.document.create({ data: doc });
      created++;
    }
  }

  if (APPLY) {
    console.log(`\nDone. Created ${created} Document rows.`);
  } else {
    console.log(
      `\nDry run complete. Re-run with --apply to actually write these ${missing.length} rows.`,
    );
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Error:", err);
  await prisma.$disconnect();
  process.exit(1);
});
