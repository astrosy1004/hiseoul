// Shared between the admin product form and /api/admin/describe.
import { z } from "zod";
import { CONCERNS, SKIN_TYPES } from "./skin-match";

const Text = z.object({
  en: z.string(), ko: z.string(), ja: z.string(), zh_CN: z.string(), zh_TW: z.string(),
});

/** What Claude returns: every text in all five app languages. */
export const DraftSchema = z.object({
  category: z.enum(["beauty", "kpop", "fashion"]),
  brand: Text,
  name: Text,
  description: Text,
  skinTypes: z.array(z.enum(SKIN_TYPES)),
  concerns: z.array(z.enum(CONCERNS)),
  routineStep: z.enum(["toner", "essence", "cream", "sun", "none"]),
  /** Short note in Korean for the staff member: what to double-check. */
  checkNote: z.string(),
});
export type Draft = z.infer<typeof DraftSchema>;

/** What the admin form sends. Anything the staff member typed wins over the photo. */
export const DescribeRequest = z.object({
  image: z.object({ mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]), data: z.string().max(4_000_000) }).optional(),
  known: z.object({
    category: z.enum(["beauty", "kpop", "fashion"]).optional(),
    brandKo: z.string().max(80).optional(),
    brandEn: z.string().max(80).optional(),
    nameKo: z.string().max(160).optional(),
    nameEn: z.string().max(160).optional(),
    descriptionKo: z.string().max(600).optional(),
  }),
});
export type DescribeRequest = z.infer<typeof DescribeRequest>;
