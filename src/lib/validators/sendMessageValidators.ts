import { z } from "zod";

export const sendMessageSchema = z.object({
  filedId: z.string(),
  message: z.string()
})

export type SendMessageSchema = z.infer<typeof sendMessageSchema>