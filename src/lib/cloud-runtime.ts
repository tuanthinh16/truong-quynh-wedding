import "server-only";
import { wedding, type WeddingData } from "@/config/wedding";
import { createCloudStore } from "./cloud-store.mjs";
import { createCloudEditor } from "./cloud-editor.mjs";
import { createCloudRsvp } from "./cloud-rsvp.mjs";

export const cloudStore = createCloudStore();
export const cloudRsvp = createCloudRsvp({ store: cloudStore, getWedding: async (): Promise<WeddingData> => (await cloudEditor.content()).data });
export const cloudEditor = createCloudEditor({ store: cloudStore, baseline: wedding, listRsvps: cloudRsvp.list });
