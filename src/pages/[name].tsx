import { useRouter } from "next/router";
import { Garden } from "../components/Garden";

export default function UserPage(){
    const router = useRouter()

    const name = router.query.name as string;

    return (
        <div>
            <Garden 
                where={{author: {
                    name,
                },}
            } />
        </div>
    )
}