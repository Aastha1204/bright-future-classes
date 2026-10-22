import { z } from "zod";

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const ClientSchema = z.object({
  business: z.object({
    name: z.string().min(1),
    tagline: z.string(),
    founded: z.number().int(),
    phone: z.string(),
    phone_note: z.string(),
    email: z.string().email(),
    whatsapp: z.string(),
    hours: z.object({ mon_sat: z.string(), sun: z.string() }),
    disclaimer: z.string(),
  }),
  theme: z.object({
    primary: hex,
    primaryLight: hex,
    accent: hex,
    hot: hex,
    warm: hex,
    cold: hex,
    ink: hex,
    muted: hex,
    surface: hex,
    background: hex,
    logo: z.string(),
  }),
  branches: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        address: z.string(),
        landmark: z.string(),
        timings: z.string(),
        nearest_station: z.string(),
        seats_per_batch: z.number().int().positive(),
      }),
    )
    .min(1),
  courses: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        boards: z.array(z.string()),
        duration: z.string(),
        subjects: z.array(z.string()),
        weekly_hours: z.number().positive(),
        batch_options: z.array(z.string()),
        annual_fee: z.number().positive(),
        installments: z.number().int().positive(),
        sibling_discount_pct: z.number().min(0).max(100),
        early_bird_discount_pct: z.number().min(0).max(100),
        early_bird_before: z.string(),
      }),
    )
    .min(1),
  batches: z.array(
    z.object({
      name: z.string(),
      time: z.string(),
      days: z.string(),
      seats_left: z.record(z.string(), z.number().int().nonnegative()),
    }),
  ),
  demo_class: z.object({
    free: z.boolean(),
    duration_minutes: z.number().int().positive(),
    slot_rules: z
      .array(
        z.object({
          weekday: z.number().int().min(0).max(6),
          time: z.string().regex(/^\d{2}:\d{2}$/),
          label: z.string(),
        }),
      )
      .min(1),
    days_ahead: z.number().int().positive(),
  }),
  faculty: z.array(
    z.object({
      id: z.string(),
      initials: z.string().min(1).max(3),
      name: z.string(),
      subject: z.string(),
      experience_years: z.number().int().nonnegative(),
      bio: z.string(),
    }),
  ),
  policies: z.record(z.string(), z.string()),
  results_policy: z.string(),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).min(15),
  handover: z.object({
    counsellor_name: z.string(),
    templates: z.object({ hot: z.string(), warm: z.string(), cold: z.string() }),
    unknown_reply: z.string(),
  }),
  scope: z.object({ allowed_topics: z.array(z.string()), refusal: z.string() }),
  languages: z.array(z.enum(["en", "hinglish"])),
});

export type Client = z.infer<typeof ClientSchema>;
