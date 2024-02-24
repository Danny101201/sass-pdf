import { db } from "@/db";
import { openai } from '@/lib/openai'
import { getPineconeClient } from "@/lib/pinecone";
import { sendMessageSchema } from "@/lib/validators/sendMessageValidators";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { NextRequest, NextResponse } from "next/server";
import { OpenAIStream, StreamingTextResponse } from 'ai'
export const POST = async (req: NextRequest) => {
  try {

    const body = await req.json()
    const { getUser } = getKindeServerSession()
    const user = getUser()
    const { id: userId } = user
    if (!userId)
      return new Response('Unauthorized', { status: 401 })

    const { filedId, message } = await sendMessageSchema.parseAsync(body)
    const file = await db.file.findFirst({
      where: {
        id: filedId,
        user_id: userId
      }
    })
    if (!file) return new Response("NOt found", { status: 404 })
    await db.message.create({
      data: {
        text: message,
        isUserMessage: true,
        user_id: userId,
        file_id: filedId
      }
    })
    // 1: vectorize message
    const pinecone = await getPineconeClient()
    const pineconeIndex = pinecone.Index("chat-doc")

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY
    });
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      // @ts-ignore
      pineconeIndex,
      namespace: file.id
    })
    const results = await vectorStore.similaritySearch(message, 4)

    const preMessage = await db.message.findMany({
      where: {
        file_id: file.id
      },
      orderBy: {
        created_at: 'asc'
      },
      take: 6
    })

    const formattedPrevMessages = preMessage.map(msg => ({
      role: msg.isUserMessage ? 'user' : 'assistant',
      content: msg.text
    }))

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0,
      stream: true,
      messages: [
        {
          role: 'system',
          content:
            'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.',
        },
        {
          role: 'user',
          content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
        
  \n----------------\n
  
  PREVIOUS CONVERSATION:
  ${formattedPrevMessages.map((message) => {
            if (message.role === 'user')
              return `User: ${message.content}\n`
            return `Assistant: ${message.content}\n`
          })}
  
  \n----------------\n
  
  CONTEXT:
  ${results.map((r) => r.pageContent).join('\n\n')}
  
  USER INPUT: ${message}`,
        },
      ],
    })

    const stream = OpenAIStream(response, {
      async onCompletion(completion) {
        await db.message.create({
          data: {
            text: completion,
            isUserMessage: false,
            file_id: filedId,
            user_id: userId
          }
        })
      }
    })

    return new StreamingTextResponse(stream)
  } catch (e) {
    console.log(e)
    return NextResponse.json('server error', { status: 500 })
  }

}