import { useReducer } from "react"


const initialState = [
    {
        id : 1, 
        score : 0,
        name : "Utkarsh"
    },
    {
        id : 2, 
        score : 0,
        name : "Vivek"
    }
];


const reducer = (state, action) => {
    switch(action.type){
        case "Increase" :
            return state.map((player)=>{
                if(player.id === action.id){
                    return {...player}
                }
            })
    }
}

export default function ReducerHook(){

    const [state, dispatch] = useReducer(reducer, initialState);
    
    const handleState = (player_id) => {
        dispatch({
            // what ever we send here is the action 
            type : "Increase",
            id : player_id
        })
    }


    // here val store the current state 
    // and set val is used to set the val 
    const [val, setVal] = useState("");


    return (
        <>

        </>
    )

};