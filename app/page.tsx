import Link from "next/link"

export default function Home() {
  return (
    <main>
      <h1>AI Playground</h1>

      <ul>
        <li>
          <Link href="/hume">Hume AI (Emotion Voice)</Link>
        </li>
        <li>
          <Link href="/openai">OpenAI (Realtime Voice)</Link>
        </li>
      </ul>
    </main>
  )
}