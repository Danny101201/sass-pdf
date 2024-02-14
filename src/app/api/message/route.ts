import { db } from "@/db";
import { sendMessageSchema } from "@/lib/validators/sendMessageValidators";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  const body = await req.json()
  const { getUser } = getKindeServerSession()
  const user = getUser()
  const { id: userId } = user
  if (!userId)
    return new Response('Unauthorized', { status: 401 })

  const { fieldId, message } = await sendMessageSchema.parseAsync(body)
  const file = await db.file.findFirst({
    where: {
      id: fieldId,
      user_id: userId
    }
  })
  if (!file) return new Response("NOt found", { status: 404 })
  await db.message.create({
    data: {
      text: message,
      isUserMessage: true,
      user_id: userId,
      file_id: fieldId
    }
  })
}