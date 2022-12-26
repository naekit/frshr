import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { seedSchema } from '../../../components/PlantSeed';


export const seedRouter = router({
    create: protectedProcedure.input(seedSchema)
    .mutation(({ctx, input}) => {
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
