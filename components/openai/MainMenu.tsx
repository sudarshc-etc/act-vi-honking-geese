"use client";

import { useState } from "react";
import DatingShow from "./Iterations/DatingShow";
import GamePlay from "./Iterations/GamePlay";
import TalkShow from "./Iterations/TalkShow";
import MeinserExercise from "./Iterations/MeisnerExercise";
import BorisExercise from "./Iterations/BorisExercise";
import WaitingForGodot from "./Iterations/WaitingForGodot";
import InterrogationNegotiation from "./Iterations/InterrogationNegotiation";
import Ghost from "./Iterations/Ghost";

type Mode = "menu" | "datingshow" | "gameplay" | "meisnerexercise" | "talkshow" | "boris" | "beckett" | "interrogation" | "ghostcall";

export default function MainMenu() {
    const [mode, setMode] = useState<Mode>("menu");

    if (mode === "datingshow") {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans text-white p-6 relative">
                <button 
                    onClick={() => setMode("menu")}
                    className="absolute top-6 left-6 text-gray-500 hover:text-white hover:cursor-pointer font-bold uppercase tracking-widest text-sm"
                >
                    Back to Menu
                </button>
                <DatingShow/>
            </div>
        );
    }

    if (mode === "gameplay") {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans text-white p-6 relative">
                <button 
                    onClick={() => setMode("menu")}
                    className="absolute top-6 left-6 text-gray-500 hover:text-white hover:cursor-pointer font-bold uppercase tracking-widest text-sm"
                >
                    Back to Menu
                </button>
                <GamePlay/>
            </div>
        );
    }

    if (mode === "meisnerexercise") {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans text-white p-6 relative">
                <button 
                    onClick={() => setMode("menu")}
                    className="absolute top-6 left-6 text-gray-500 hover:text-white hover:cursor-pointer font-bold uppercase tracking-widest text-sm"
                >
                    Back to Menu
                </button>
                <MeinserExercise/>
            </div>
        );
    }

    if (mode === "talkshow") {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans text-white p-6 relative">
                <button 
                    onClick={() => setMode("menu")}
                    className="absolute top-6 left-6 text-gray-500 hover:text-white hover:cursor-pointer font-bold uppercase tracking-widest text-sm"
                >
                    Back to Menu
                </button>
                <TalkShow/>
            </div>
        );
    }

    if (mode === "boris") {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans text-white p-6 relative">
                <button 
                    onClick={() => setMode("menu")}
                    className="absolute top-6 left-6 text-gray-500 hover:text-white hover:cursor-pointer font-bold uppercase tracking-widest text-sm"
                >
                    Back to Menu
                </button>
                <BorisExercise/>
            </div>
        );
    }

    if (mode === "beckett") {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans text-white p-6 relative">
                <button 
                    onClick={() => setMode("menu")}
                    className="absolute top-6 left-6 text-gray-500 hover:text-white hover:cursor-pointer font-bold uppercase tracking-widest text-sm"
                >
                    Back to Menu
                </button>
                <WaitingForGodot/>
            </div>
        );
    }

    if (mode === "interrogation") {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans text-white p-6 relative">
                <button 
                    onClick={() => setMode("menu")}
                    className="absolute top-6 left-6 text-gray-500 hover:text-white hover:cursor-pointer font-bold uppercase tracking-widest text-sm"
                >
                    Back to Menu
                </button>
                <InterrogationNegotiation/>
            </div>
        );
    }

    if (mode === "ghostcall") {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans text-white p-6 relative">
                <button 
                    onClick={() => setMode("menu")}
                    className="absolute top-6 left-6 text-gray-500 hover:text-white hover:cursor-pointer font-bold uppercase tracking-widest text-sm"
                >
                    Back to Menu
                </button>
                <Ghost/>
            </div>
        );
    }

    if (mode === "menu") {
        return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans text-white p-6">
            <h1 className="text-5xl font-black mb-12 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-pink-500">
            Iterations
            </h1>
            <div className="flex flex-col gap-6 w-full max-w-sm">
                <button 
                    onClick={() => { setMode("datingshow"); }}
                    className="w-full py-4 bg-sky-900/30 border border-sky-500 hover:bg-sky-600 hover:cursor-pointer rounded-lg text-sky-100 font-black uppercase tracking-widest transition-all hover:scale-105"
                >
                    Dating Show
                </button>
                <button 
                    onClick={() => { setMode("gameplay"); }}
                    className="w-full py-4 bg-fuchsia-900/30 border border-fuchsia-500 hover:bg-fuchsia-600 hover:cursor-pointer rounded-lg text-fuchsia-100 font-black uppercase tracking-widest transition-all hover:scale-105"
                >
                    Game Play
                </button>
                <button 
                    onClick={() => { setMode("meisnerexercise"); }}
                    className="w-full py-4 bg-orange-900/30 border border-orange-500 hover:bg-orange-600 hover:cursor-pointer rounded-lg text-fuchsia-100 font-black uppercase tracking-widest transition-all hover:scale-105"
                >
                    Meisner Exercise
                </button>
                <button 
                    onClick={() => { setMode("talkshow"); }}
                    className="w-full py-4 bg-green-900/30 border border-green-500 hover:bg-green-600 hover:cursor-pointer rounded-lg text-fuchsia-100 font-black uppercase tracking-widest transition-all hover:scale-105"
                >
                    Talk Show
                </button>
                <button 
                    onClick={() => { setMode("boris"); }}
                    className="w-full py-4 bg-purple-900/30 border border-purple-500 hover:bg-purple-600 hover:cursor-pointer rounded-lg text-fuchsia-100 font-black uppercase tracking-widest transition-all hover:scale-105"
                >
                    Boris Exercise
                </button>
                <button 
                    onClick={() => { setMode("beckett"); }}
                    className="w-full py-4 bg-yellow-900/30 border border-yellow-500 hover:bg-yellow-600 hover:cursor-pointer rounded-lg text-fuchsia-100 font-black uppercase tracking-widest transition-all hover:scale-105"
                >
                    Waiting For Godot
                </button>
                <button 
                    onClick={() => { setMode("interrogation"); }}
                    className="w-full py-4 bg-teal-900/30 border border-teal-500 hover:bg-teal-600 hover:cursor-pointer rounded-lg text-fuchsia-100 font-black uppercase tracking-widest transition-all hover:scale-105"
                >
                    Interrogation Negotiation
                </button>
                <button 
                    onClick={() => { setMode("ghostcall"); }}
                    className="w-full py-4 bg-red-900/30 border border-red-500 hover:bg-red-600 hover:cursor-pointer rounded-lg text-fuchsia-100 font-black uppercase tracking-widest transition-all hover:scale-105"
                >
                    Ghost Call
                </button>
            </div>
        </div>
        );
    }
}