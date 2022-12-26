import dayjs from 'dayjs';
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocal from "dayjs/plugin/updateLocale";
import Image from 'next/image';
import { trpc, RouterOutputs } from '../utils/trpc';
import { PlantSeed } from "./PlantSeed";
import { useEffect, useState } from 'react';
import { AiFillHeart } from 'react-icons/ai'

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

function Seed({seed}: {seed: RouterOutputs['seed']['garden']['seeds'][number]}){
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
                        <p className='font-bold'>{seed.author.name}</p>
                        <p className='text-sm text-gray-400'> - {dayjs(seed.createdAt).fromNow()}</p>
                    </div>
                    <div>
                        {seed.text}
                    </div>
                </div>
            </div>
            <div className='flex mt-4 p-2 items-center'>
                <AiFillHeart
                    // color='red'
                    size="1.5rem"
                    onClick={() => console.log('like')}
                />
                <span className='text-sm text-gray-500'>
                    {10}
                </span>
            </div>
        </div>
    )
}

export function Garden(){

    const scrollPosition = useScrollPosition();

    const { data, hasNextPage, fetchNextPage, isFetching } = trpc.seed.garden.useInfiniteQuery({ 
        limit: 10 
    },{
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

    useEffect(() => {
        if(scrollPosition > 90 && hasNextPage && !isFetching){
            fetchNextPage();
        }
    }, [scrollPosition, hasNextPage, isFetching, fetchNextPage])


    const seeds = data?.pages.flatMap((page) => page.seeds) ?? [];

    return (
    <div>
        <PlantSeed />
        <div className='border-l-2 border-r-2 border-t-2 border-gray-400'>
            {seeds.map((seed) => {
                return <Seed key={seed.id} seed={seed} />
            })}
            {!hasNextPage && <p>No more items to load</p>}
        </div>
    </div>
    )
}