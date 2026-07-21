import { z } from "zod";

const optionalText = z.string().trim().optional();

export const profileFormSchema = z.object({
  age: z.coerce.number().int().min(18).max(80),
  bio: z.string().trim().min(24).max(500),
  city: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
  drinking: optionalText,
  education: z.string().trim().min(2).max(120),
  foodText: optionalText,
  gender: z.enum(["WOMAN", "MAN", "NON_BINARY", "SELF_DESCRIBE"]),
  heightCm: z.coerce.number().int().min(120).max(230),
  interestedIn: z.array(z.enum(["WOMAN", "MAN", "NON_BINARY", "SELF_DESCRIBE"])).min(1),
  interestsText: z.string().trim().min(2).max(500),
  languagesText: z.string().trim().min(2).max(240),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  musicText: optionalText,
  name: z.string().trim().min(2).max(80),
  pets: optionalText,
  profession: z.string().trim().min(2).max(120),
  promptOne: z.string().trim().min(2).max(280),
  promptTwo: z.string().trim().min(2).max(280),
  relationshipGoal: z.enum(["LONG_TERM", "LIFE_PARTNER", "CASUAL", "FRIENDSHIP", "FIGURING_OUT"]),
  religion: optionalText,
  smoking: optionalText,
  state: z.string().trim().min(2).max(80),
  travelText: optionalText,
  weekendStyle: optionalText,
  workStyle: optionalText
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const photoFormSchema = z.object({
  isPrimary: z.boolean().optional(),
  url: z.string().trim().url()
});

export type PhotoFormValues = z.infer<typeof photoFormSchema>;

export function joinList(values: string[]): string {
  return values.join(", ");
}

export function parseList(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
