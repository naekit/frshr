import { router } from "../trpc";
import { authRouter } from "./auth";
import { seedRouter } from './seed';

export const appRouter = router({
  seed: seedRouter,
  auth: authRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
