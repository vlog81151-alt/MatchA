import { MessageType } from "@prisma/client";
import { z } from "zod";

const metadataSchema = z.record(z.unknown()).optional();

export const chatListQuerySchema = z
  .object({
    includeArchived: z.coerce.boolean().default(false)
  })
  .strict();

export const messageListQuerySchema = z
  .object({
    cursor: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(30),
    search: z.string().trim().min(1).max(120).optional()
  })
  .strict();

export const sendMessageSchema = z
  .object({
    body: z.string().trim().max(2000).optional(),
    mediaUrl: z.string().trim().url().optional(),
    metadata: metadataSchema,
    replyToId: z.string().trim().min(1).optional(),
    type: z.nativeEnum(MessageType).default(MessageType.TEXT)
  })
  .strict()
  .refine((value) => (value.type === MessageType.TEXT ? Boolean(value.body) : true), {
    message: "Text messages require a body",
    path: ["body"]
  })
  .refine((value) => value.type !== MessageType.SYSTEM, {
    message: "System messages cannot be created by clients",
    path: ["type"]
  })
  .refine(
    (value) =>
      value.type === MessageType.TEXT ||
      value.type === MessageType.SYSTEM ||
      Boolean(value.mediaUrl),
    {
      message: "Media messages require a mediaUrl",
      path: ["mediaUrl"]
    }
  );

export const editMessageSchema = z
  .object({
    body: z.string().trim().min(1).max(2000).optional(),
    metadata: metadataSchema
  })
  .strict()
  .refine((value) => value.body !== undefined || value.metadata !== undefined, {
    message: "Provide at least one field to update"
  });

export const chatSettingsSchema = z
  .object({
    archived: z.boolean().optional(),
    muted: z.boolean().optional()
  })
  .strict()
  .refine((value) => value.archived !== undefined || value.muted !== undefined, {
    message: "Provide at least one setting"
  });

export const reportChatSchema = z
  .object({
    description: z.string().trim().max(1200).optional(),
    reason: z.string().trim().min(3).max(120)
  })
  .strict();

export type ChatListQuery = z.infer<typeof chatListQuerySchema>;
export type ChatSettingsInput = z.infer<typeof chatSettingsSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type MessageListQuery = z.infer<typeof messageListQuerySchema>;
export type ReportChatInput = z.infer<typeof reportChatSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
