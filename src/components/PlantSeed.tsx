import { useContext, useState } from "react";
import { object, string } from "zod";
import { trpc } from "../utils/trpc";

export const seedSchema = object({
    text: string({
        required_error: "Seed text is required"
    }).min(10).max(340)
})

export function PlantSeed(){
    const [text, setText] = useState('')
    const [error, setError] = useState('')
    
    const utils = trpc.useContext()

    const { mutateAsync } = trpc.seed.create.useMutation({
        onSuccess: () => {
            setText("")
            utils.seed.garden.invalidate();
        }
    })


    async function handleSubmit(event){
        event.preventDefault();
        try { 
            await seedSchema.parse({ text })
        } catch (error) {
            setError(error.message)
            return;
        }
        mutateAsync({ text });
    }

    return (
        <>
        {error && JSON.stringify(error)}        
        <form onSubmit={handleSubmit} className="w-full flex flex-col border-2 p-4 rounded-md mb-4">
            <textarea value={text} className="shadow p-4 w-full" onChange={(event) => setText(event?.target.value)} />
            <div className="mt-4 flex justify-end">
                <button className="bg-primary text-white px-4 py-2 rounded-md" type="submit">
                    Seed
                </button>
            </div>
        </form>
        </>
    )
}