import dayjs from 'dayjs';
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocal from "dayjs/plugin/updateLocale";
import Image from 'next/image';
import { trpc, RouterOutputs, RouterInputs } from '../utils/trpc';
import { PlantSeed } from "./PlantSeed";
import { useEffect, useState } from 'react';
import { AiFillHeart, AiTwotoneFileText } from 'react-icons/ai'
import { InfiniteData, QueryClient, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

const LIMIT = 10;

dayjs.extend(relativeTime)
dayjs.extend(updateLocal)

dayjs.updateLocale("en", {
    relativeTime: {
        future: "in %s",
        past: "%s ago",
        s: "1m",
        m: "1m",
        mm: "%dm",
        h: "1h",
        hh: "%dh",
        d: "1d",
        dd: "%dd",
        M: "1M",
        MM: "%dM",
        y: "1y",
        yy: "%dy",
    }
})

function useScrollPosition(){
    const [scrollPosition, setScrollPosition] = useState(0)

    function handleScroll(){
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;

        const winScroll = document.body.scrollTop || document.documentElement.scrollTop

        const scrolled = (winScroll / height) * 100;

        setScrollPosition(scrolled);
    }

    useEffect(() => {
        window.addEventListener("scroll", handleScroll, {passive: true});

        return () => {
            window.removeEventListener("scroll", handleScroll);
        }
    }, [])

    return scrollPosition
}

function updateCache({ client, variables, data, action, input }: 
    { client: QueryClient; variables: { seedId: string;}; data: { userId: string; }; action: "like" | "unlike"; input: RouterInputs['seed']['garden']; }){
    client.setQueryData([
        [
          "seed",
          "garden"
        ],
        {
          input,
          "type": "infinite"
        }
      ], (oldData) => {

        const newData = oldData as InfiniteData<RouterOutputs['seed']['garden']>

        const value = action === "like" ? 1: -1

        const newSeeds = newData.pages.map((page) => {
            return {
                seeds: page.seeds.map((seed) => {
                    if(seed.id === variables.seedId){
                        return {
                            ...seed,
                            likes: (action === "like" ? [data.userId]: []),
                            _count: {
                                likes: seed._count.likes + value
                            }
                        };
                    }

                    return seed;
                })
            }
        })

        return {
            ...newData,
            pages: newSeeds
        }
    })
}

function Seed({seed, client, input}: {seed: RouterOutputs['seed']['garden']['seeds'][number]; client: QueryClient, input: RouterInputs['seed']['garden'];}){

    const likeMutation = trpc.seed.like.useMutation({
        onSuccess: (data, variables) => {
            updateCache({client, data, variables, input, action: "like"})
        }
    }).mutateAsync;
    const unlikeMutation = trpc.seed.unlike.useMutation({
        onSuccess: (data, variables) => {
            updateCache({client, data, variables, input, action: "unlike"})
        }
    }).mutateAsync;

    const hasLiked = seed.likes.length > 0;
    

    return (
        <div className='mb-4 border-b-2 border-gray-400'>
            <div className='flex p-2'>
                {seed.author.image &&
                    <Image 
                        src={seed.author.image} 
                        alt={`${seed.author.name} profile picture`}
                        width={48}
                        height={48}
                        className="rounded-full"
                    />
                }
                <div className='ml-2'>
                    <div className='flex items-center'>
                        <p className='font-bold'><Link href={`/${seed.author.name}`}>{seed.author.name}</Link></p>
                        <p className='text-sm text-gray-400'> - {dayjs(seed.createdAt).fromNow()}</p>
                    </div>
                    <div>
                        {seed.text}
                    </div>
                </div>
            </div>
            <div className='flex mt-4 p-2 items-center'>
                <AiFillHeart
                    color={hasLiked ? "red": "gray"}
                    size="1.5rem"
                    onClick={() => {
                        if(hasLiked){
                            unlikeMutation({
                                seedId: seed.id,
                            })
                            return;
                        }
                        likeMutation({
                            seedId: seed.id,

                        })
                    }}
                />
                <span className='text-sm text-gray-500'>
                    {seed._count.likes}
                </span>
            </div>
        </div>
    )
}

export function Garden({where = {}}: {where: RouterInputs['seed']['garden']['where']}){

    const scrollPosition = useScrollPosition();

    const { data, hasNextPage, fetchNextPage, isFetching } = trpc.seed.garden.useInfiniteQuery({ 
        limit: 10,
        where
    },{
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

    useEffect(() => {
        if(scrollPosition > 90 && hasNextPage && !isFetching){
            fetchNextPage();
        }
    }, [scrollPosition, hasNextPage, isFetching, fetchNextPage])

    const client = useQueryClient();

    const seeds = data?.pages.flatMap((page) => page.seeds) ?? [];

    return (
    <div>
        <PlantSeed />
        <div className='border-l-2 border-r-2 border-t-2 border-gray-400'>
            {seeds.map((seed) => {
                return <Seed 
                        key={seed.id} 
                        seed={seed} 
                        client={client} 
                        input={
                            {
                                limit: LIMIT,
                                where
                            }
                        } 
                       />
            })}
            {!hasNextPage && <p>No more items to load</p>}
        </div>
    </div>
    )
}