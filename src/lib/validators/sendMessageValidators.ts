import { z } from "zod";

export const sendMessageSchema = z.object({
  fieldId: z.string(),
  message: z.string()
})

export type SendMessageSchema = z.infer<typeof sendMessageSchema>