import Link from "next/link"
import Image from 'next/image';

export default function Home() {
  return (
    <main className="grid place-items-center min-h-screen">
      <div className="flex flex-col items-center">
        <Image
          src="/ActVI_Logo.png" // Path relative to public/
          alt="My Photo"
          width={150} // Required
          height={150} // Required
          priority // Loads image immediately
        />
        <h1 className="m-3 text-center font-bold text-heading md:text-5xl lg:text-6xl">
          <span className="text-transparent bg-clip-text bg-gradient-to-r to-pink-300 from-gray-400">Team Act VI Presents - <br/><br/> The Geese Matchmaking Show Platforms</span>
        </h1>
        <Link href="/openai" className="m-3 text-white bg-gray-700 px-4 py-2 rounded hover:bg-gray-300">OpenAI (Realtime Voice)</Link>
        <Link href="/hume" className="m-3 text-white bg-pink-700 px-4 py-2 rounded hover:bg-pink-300">Hume AI (Emotion Voice)</Link>
      </div>
    </main>
  )
}