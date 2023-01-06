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
            where: z.object({
                author: z.object({
                    name: z.string().optional()
                }).optional()
            })
            .optional(),
            cursor: z.string().nullish(),
            limit: z.number().min(1).max(100).default(10),
        }))
        .query(async ({ ctx, input }) => {
        const { prisma } = ctx
        const { cursor, limit, where } = input
        const userId = ctx.session?.user?.id;

        const seeds = await prisma.seed.findMany({
            take: limit + 1,
            where,
            orderBy: [
                {
                    createdAt: "desc",
                }
            ],
            cursor: cursor ? { id: cursor }: undefined,
            include:{
                likes: {
                    where:{
                        userId,
                    },
                    select: {
                        userId: true,
                    },
                },
                author:{
                    select:{
                        name: true,
                        image: true,
                        id: true
                    }
                },
                _count:{
                    select:{
                        likes:true,
                    },
                },
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

    }),
    like: protectedProcedure.input(z.object({ seedId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            const { prisma } = ctx;

            return prisma.like.create({
                data: {
                    seed: {
                        connect: {
                            id: input.seedId,
                        },
                    },
                    user: {
                        connect: {
                            id: userId
                        },
                    },
                },
            });
        }),
    unlike: protectedProcedure.input(z.object({ seedId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            const { prisma } = ctx;

            return prisma.like.delete({
                where: {
                    seedId_userId:{
                        seedId: input.seedId,
                        userId,
                    },
                },
            });
        }),
})
