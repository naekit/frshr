import { z } from "zod";
import { protectedProcedure, router, publicProcedure } from '../trpc';
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
    }),
    garden: publicProcedure.input(
        z.object({
            cursor: z.string().nullish(),
            limit: z.number().min(1).max(100).default(10),
        })
    ).query(async ({ ctx, input }) => {
        const { prisma } = ctx
        const { cursor, limit } = input

        const seeds = await prisma.seed.findMany({
            take: limit + 1,
            orderBy: [
                {
                    createdAt: "desc",
                }
            ],
            cursor: cursor ? { id: cursor }: undefined,
            include:{
                author:{
                    select:{
                        name: true,
                        image: true,
                        id: true
                    }
                }
            }
        });

        let nextCursor: typeof cursor | undefined = undefined;

        if(seeds.length > limit){
            const nextItem = seeds.pop() as typeof seeds[number];

            nextCursor = nextItem.id;
        }

        return {
            seeds,
            nextCursor
        }

    })
})
