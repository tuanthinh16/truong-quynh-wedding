import { wedding } from "@/config/wedding";
import { createRsvpService, handleRsvpRequest } from "@/lib/rsvp-service.mjs";
import { cloudRsvp } from "@/lib/cloud-runtime";
import { cloudConfigured } from "@/lib/cloud-store.mjs";

export const maxDuration = 60;

const submit = createRsvpService({ root: process.cwd(), getWedding: () => wedding, dailyLimit: Number(process.env.RSVP_DAILY_EMAIL_LIMIT || 100) });

export async function POST(request: Request) { return handleRsvpRequest(request, process.env.VERCEL === "1" || cloudConfigured() ? cloudRsvp.submit : submit); }
