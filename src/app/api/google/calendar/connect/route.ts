export async function GET() {
  return new Response("Google Calendar temporarily unavailable", {
    status: 503,
  });
}
