import { wedding } from "@/config/wedding";
import { createRsvpService, handleRsvpRequest } from "@/lib/rsvp-service.mjs";
import { tmpdir } from "node:os";

export const maxDuration = 60;

const temporary = process.env.VERCEL === "1";
const submit = createRsvpService({ root: temporary ? tmpdir() : process.cwd(), getWedding: () => wedding, dailyLimit: Number(process.env.RSVP_DAILY_EMAIL_LIMIT || 100) });

export async function POST(request: Request) {
  return handleRsvpRequest(request, async (payload: unknown) => ({ ...await submit(payload), storage: temporary ? "temporary" : "persistent" }));
}
