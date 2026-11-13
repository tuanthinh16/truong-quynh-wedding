import { wedding } from "@/config/wedding";
import { createRsvpService, handleRsvpRequest } from "@/lib/rsvp-service.mjs";

const submit = createRsvpService({ root: process.cwd(), getWedding: () => wedding, dailyLimit: Number(process.env.RSVP_DAILY_EMAIL_LIMIT || 100) });

export async function POST(request: Request) { return handleRsvpRequest(request, submit); }
