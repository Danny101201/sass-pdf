import { TRPCError, inferRouterInputs, inferRouterOutputs, initTRPC } from '@trpc/server'
import { AppRouter } from '.'
import { db } from '@/db'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
export const createTRPCContext = async () => {
  return {
    db
  }
}
const t = initTRPC.context<typeof createTRPCContext>().create()

export const router = t.router
export const middleware = t.middleware;


const isAuth = t.middleware(async (opt) => {
  const { getUser } = getKindeServerSession()
  const user = getUser()
  if (!user || !user.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return opt.next({
    ctx: {
      userId: user.id,
      user
    }
  })
})
export const publicProcedure = t.procedure
export const privateProcedure = t.procedure.use(isAuth)
export const { createCallerFactory } = t

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

