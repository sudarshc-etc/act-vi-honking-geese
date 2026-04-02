"use client";

import { useState } from "react";
import DatingShow from "./Modes/DatingShow";
import GamePlay from "./Modes/GamePlay";
import TalkShow from "./Modes/TalkShow";

type Mode = "menu" | "datingshow" | "gameplay" | "meisnerexercise" | "talkshow";

export default function MainMenu() {
    const [mode, setMode] = useState<Mode>("menu");

    if (mode === "datingshow") {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans text-white p-6 relative">
                <button 
                    onClick={() => setMode("menu")}
                    className="absolute top-6 left-6 text-gray-500 hover:text-white font-bold uppercase tracking-widest text-sm"
                >
                    Back to Menu
                </button>
                <DatingShow/>
            </div>
        );
    }

    if (mode === "gameplay") {
        return (
            <GamePlay/>
        );
    }

    /* if (mode === "meisnerexercise") {
        return (
            <MeinserExercise/>
        );
    } */

    if (mode === "talkshow") {
        return (
            <TalkShow/>
        );
    }

    if (mode === "menu") {
        return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans text-white p-6">
            <h1 className="text-5xl font-black mb-12 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-pink-500">
            SELECT MODE
            </h1>
            <div className="flex flex-col gap-6 w-full max-w-sm">
                <button 
                    onClick={() => { setMode("datingshow"); }}
                    className="w-full py-4 bg-sky-900/30 border border-sky-500 hover:bg-sky-600 rounded-lg text-sky-100 font-black uppercase tracking-widest transition-all hover:scale-105"
                >
                    Dating Show
                </button>
                <button 
                    onClick={() => { setMode("gameplay"); }}
                    className="w-full py-4 bg-fuchsia-900/30 border border-fuchsia-500 hover:bg-fuchsia-600 rounded-lg text-fuchsia-100 font-black uppercase tracking-widest transition-all hover:scale-105"
                >
                    Game Play
                </button>
                <button 
                    onClick={() => { setMode("meisnerexercise"); }}
                    className="w-full py-4 bg-fuchsia-900/30 border border-fuchsia-500 hover:bg-fuchsia-600 rounded-lg text-fuchsia-100 font-black uppercase tracking-widest transition-all hover:scale-105"
                >
                    Meisner Exercise
                </button>
                <button 
                    onClick={() => { setMode("talkshow"); }}
                    className="w-full py-4 bg-fuchsia-900/30 border border-fuchsia-500 hover:bg-fuchsia-600 rounded-lg text-fuchsia-100 font-black uppercase tracking-widest transition-all hover:scale-105"
                >
                    Talk Show
                </button>
            </div>
        </div>
        );
    }
}