"use client";
import {
  useVoice,
  ConnectOptions,
  VoiceReadyState
} from "@humeai/voice-react";

// Can be removed later
import { useState, useEffect } from "react";

export default function StartCall({
  accessToken, gooseName,
}: {
  accessToken: string; gooseName: string;
}) {
  const { connect, disconnect, readyState } = useVoice();

  const [callactive, setCallactive] = useState(false);

  const [mute, setMute] = useState(false);

  let activeButtonClass = gooseName === "Nala" ? "bg-linear-65 from-purple-500 to-pink-500" : 
                                           "bg-linear-to-t from-sky-500 to-indigo-500";

  let muteButttonClass = gooseName === "Nala" ? "border-purple-500" : 
                                           "border-sky-500"; 



  //uncomment this later //if (readyState === VoiceReadyState.OPEN) 
  // Can be removed later
  if(callactive){
    return (
      <div className="w-1/2 flex flex-col items-center space-y-4">
        <button
          onClick={()=>{setMute(true)}}
          className={`w-14 h-14 rounded-full border-4 px-2 py-2 ${muteButttonClass}`}
        >
          { mute ? <svg id="muteIcon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth="1.5" stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9.75 9.75L14.25 14.25M14.25 9.75L9.75 14.25M15.75 5.25v13.5a.75.75 0 01-1.28.53l-4.72-4.72H6.75a.75.75 0 01-.75-.75V10.44a.75.75 0 01.75-.75h3l4.72-4.72a.75.75 0 011.28.53z" />
          </svg> :
          <svg id="muteIcon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth="1.5" stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M14.25 5.25v13.5a.75.75 0 01-1.28.53l-4.72-4.72H6.75a.75.75 0 01-.75-.75V10.44a.75.75 0 01.75-.75h3l4.72-4.72a.75.75 0 011.28.53z" />
          </svg>
          }
        </button>
        <button
          className={`h-14 w-full ${activeButtonClass} cursor-pointer rounded-lg`}
          onClick={() => {
            //uncomment this later //disconnect();
            // Can be removed later
            setCallactive(false);
          }}
        >
          End Session
        </button>
      </div>
    );
  }

  return (
    <button
      className={`h-14 w-1/2 ${activeButtonClass} cursor-pointer rounded-lg`}

      //uncomment this later
      /* onClick={() => {
        connect({
          auth: { type: "accessToken", value: accessToken }
        })
          .then(() => {
            // handle success
          })
          .catch(() => {
            // handle error
          });
      }} */

     // Can be removed later
     onClick={()=>{setCallactive(true)}}
    >
      Start Session
    </button>
  );
}
