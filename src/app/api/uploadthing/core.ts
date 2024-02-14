import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { z, ZodError } from "zod";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
// import { OpenAIEmbeddings } from "@langchain/openai";
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { PineconeStore } from 'langchain/vectorstores/pinecone'

import { pinecone } from "@/lib/pinecone";

const f = createUploadthing(
  // {
  //   errorFormatter(err) {
  //     return {
  //       message: err.message,
  //       zodError: err instanceof ZodError ? err.flatten() : null
  //     }
  //   },
  // }
);


// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  pdfUploader: f({ pdf: { maxFileSize: "4MB", maxFileCount: 1 } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      // const user = await auth(req);
      const { getUser } = getKindeServerSession()
      const user = getUser()
      console.log(user)
      // If you throw, the user will not be able to upload
      if (!user) throw new Error("Unauthorized"); // client onError will get "Failed to run middleware"

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id, email: user.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const { name, url, key } = file ?? {}
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);

      console.log("file url", file.url);
      const isFileExist = await db.file.findFirst({
        where: {
          key: file.key,
        },
      })

      if (isFileExist) return
      const createdFile = await db.file.create({
        data: {
          key: key,
          user_id: metadata.userId as string,
          url: url,
          name: name,
          uploadStatus: 'PROCESSING'
        }
      })
      try {
        const response = await fetch(file.url)
        const blob = await response.blob()

        const loader = new PDFLoader(blob)
        const pageLevelDocs = await loader.load()
        const pageAmt = pageLevelDocs.length

        const pineconeIndex = pinecone.Index("chat-doc")

        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY
        });
        await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
          // @ts-ignore
          pineconeIndex,
          namespace: createdFile.id
        })
        await db.file.update({
          where: {
            id: createdFile.id
          },
          data: {
            uploadStatus: 'SUCCESS'
          }
        })
        return { uploadedBy: metadata.email, user_id: metadata.userId };
      } catch (e) {
        console.log(e)
        await db.file.update({
          where: {
            id: createdFile.id
          },
          data: {
            uploadStatus: 'FAILED'
          }
        })
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;