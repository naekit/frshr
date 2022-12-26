import { z } from "zod";
import { protectedProcedure, router } from "../trpc";


export const seedRouter = router({
    create: protectedProcedure.input(z.object({
        text: z.string({
            required_error: 'Tweet Text is required',
        }),
    })).mutation(({ctx, input}) => {
        const { prisma, session } = ctx;
        const { text } = input;
        const userId = session.user.id

        return prisma.seed.create({
            data: {
                text,
                author: {
                    connect: {
                        id: userId,
                    },
                },
            },
        })
    })
})
