'use client'
import React, { useEffect, useRef, useState } from 'react';
 
export default function Timer() {   
  const initialTime : number = new Date().getTime() + 601900; 
  const [displayDate, setDisplayDate] = useState({
    displayDate: 0,
    lastTime: 0 
  });

  const timeStart = useRef(initialTime);
  const [isActive, setIsActive] = useState(false);
 

  useEffect(() => {
    let intervalId: string | number | NodeJS.Timeout | undefined;    

    if(isActive){
      intervalId = setInterval(() => {    
      const now: number = new Date().getTime();   
      const remainder = timeStart.current - now; 

      setDisplayDate(prevState => ({
          displayDate: remainder - 1,
          lastTime: prevState.lastTime,
      }));

      }, 1000);
      return () => {
        if (intervalId) clearInterval(intervalId);
      }
     }   
    if(!isActive){
       setDisplayDate(prevState => ({
        displayDate: prevState.lastTime,
        lastTime: prevState.displayDate,
       }));       
      }
    }, [isActive]);

  const start = ()  => {
    //record start
    //add time elapsed back to to display date 
    setDisplayDate({
      displayDate: displayDate.lastTime,
      lastTime: displayDate.displayDate
    });
    setIsActive(true);
  };

  const stop = ()  => {
     //record time elapsed since stop pressed   
      setIsActive(false);    
      setDisplayDate({
        displayDate: displayDate.displayDate,
        lastTime: displayDate.displayDate
      });
  }

  return (
    <div>
     <span>{new Date(displayDate.displayDate).getMinutes().toString().padStart(2, '0')}:{new Date(displayDate.displayDate).getSeconds().toString().padStart(2, '0')}</span>  
     {!isActive && 
      <button 
      className="text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 
      font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 mx-5"
      onClick={start}>
        Start
      </button>      
    }
     
    {isActive && 
    <button 
      className="text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 
      font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800 mx-5"
      onClick={stop}>
        Pause
      </button>
      }
    </div>
    )  
}