import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { createCallerFactory, createTRPCContext, privateProcedure, publicProcedure, router } from './trpc';
import { TRPCError } from '@trpc/server';
import { db } from '@/db';
import { z } from 'zod'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query';
export const appRouter = router({
  authCallBack: publicProcedure.query(async ({ ctx }) => {
    const { db } = ctx
    const { getUser } = getKindeServerSession()
    const user = getUser()
    if (!user || !user.id || !user.email) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    const dbUser = await db.user.findFirst({
      where: {
        id: user.id
      }
    })
    if (!dbUser) {
      await db.user.create({
        data: {
          id: user.id,
          email: user.email
        }
      })
    }
    return { success: true }
  }),
  getFile: privateProcedure.input(z.object({ key: z.string() })).mutation(async ({ ctx, input }) => {
    const { userId, db } = ctx
    const { key } = input
    const file = await db.file.findFirst({
      where: {
        user_id: userId,
        key,
      }
    })
    if (!file) throw new TRPCError({ code: 'NOT_FOUND' })
    return file
  }),
  getUserFiles: privateProcedure.query(async ({ ctx }) => {
    const { user, userId, db } = ctx
    return await db.file.findMany({
      where: {
        user_id: userId
      }
    })
  }),
  deleteUserFile: privateProcedure.input(z.object({
    id: z.string()
  })).mutation(async ({ input, ctx }) => {
    try {
      console.log(input)
      const { id } = input
      const { db } = ctx
      await db.file.findFirstOrThrow({
        where: {
          id
        }
      })
      await db.file.delete({
        where: {
          id
        }
      })
      return { success: true }
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
      }
    }
  }),
  getFileUploadStatus: privateProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db, userId } = ctx
      const { fileId } = input
      const file = await db.file.findFirst({
        where: {
          id: fileId,
          user_id: userId
        }
      })
      if (!file) return { status: 'PENDING' as const }
      return { status: file.uploadStatus }
    }),
  getFileMessages: privateProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).nullish(),
      cursor: z.string().nullish(),
      filedId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx
      const { cursor } = input
      const limit = input.limit ?? INFINITE_QUERY_LIMIT
      const file = await db.file.findFirst({
        where: {
          id: input.filedId
        }
      })
      if (!file) throw new TRPCError({ code: 'NOT_FOUND', message: 'file not found' })
      const messages = await db.message.findMany({
        take: limit + 1,
        where: {
          file_id: input.filedId
        },
        orderBy: {
          id: 'desc'
        },
        cursor: cursor ? {
          id: cursor
        } : undefined,
        select: {
          id: true,
          isUserMessage: true,
          created_at: true,
          text: true
        }
      })
      let nextCursor: typeof cursor | undefined = undefined
      if (messages.length > limit) {
        nextCursor = messages.pop()?.id
      }
      return {
        messages,
        nextCursor
      }
    })
});
const createCallerCaller = createCallerFactory(appRouter)
export const caller = createCallerCaller({
  db
})
// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;