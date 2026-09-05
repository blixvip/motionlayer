import { z } from "zod";
import libraryData from "@/data/creator-styles.json";

const creatorPromptSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  content: z.string().min(1),
});

const creatorTraitSchema = z.object({
  label: z.string().min(1),
  description: z.string().min(1),
});

const creatorSourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  pillar: z.string().min(1),
});

export const creatorStyleSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  channelHandle: z.string().min(1),
  channelUrl: z.string().url(),
  avatarUrl: z.string().refine(
    (value) => value.startsWith("/") || z.string().url().safeParse(value).success,
    "Expected a local asset path or URL",
  ),
  scriptArchiveUrl: z.string().startsWith("/").optional(),
  sourceCount: z.number().int().positive(),
  summary: z.string().min(1),
  traits: z.array(creatorTraitSchema).min(3),
  skill: z.object({ title: z.string().min(1), content: z.string().min(1) }),
  prompts: z.array(creatorPromptSchema).min(1),
  sources: z.array(creatorSourceSchema).min(1),
}).refine((creator) => creator.sourceCount === creator.sources.length, {
  message: "sourceCount must match the number of source videos",
  path: ["sourceCount"],
});

export const creatorStyleLibrarySchema = z.object({ creators: z.array(creatorStyleSchema) });
export type CreatorStyle = z.infer<typeof creatorStyleSchema>;
export const creatorStyleLibrary = creatorStyleLibrarySchema.parse(libraryData);
