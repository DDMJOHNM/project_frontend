import Counter from "../components/counter/counter";
import Timer from "../components/timer/timer";
         

export default function Scoreboard() {

    return (
      <div>
        <div className="container mx-auto py-24"> 
        <h1 className="bg-foreground text-white px-4 py-4 font-bold text-1xl">Scoreboard</h1>
        <div className="grid gap-x-20 gap-y-2 grid-cols-2 bg-foreground text-white">
          <div className='px-4 py-4'>Time: (1h)</div>
          <div className='px-4 py-4'><Timer /></div>
          <div className='px-4 py-4 font-bold text-2xl'>Home</div>
          <div className='px-4 py-4 font-bold text-2xl'><Counter /></div>
          <div className='px-4 py-4 font-bold text-2xl'>Away</div>
          <div className='px-4 py-4 font-bold text-2xl'><Counter /></div>
        </div>
       </div>
      </div>
    );
  }
  