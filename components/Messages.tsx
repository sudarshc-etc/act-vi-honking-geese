"use client";
import { useVoice } from "@humeai/voice-react";

export default function Messages() {
  const { messages } = useVoice();

  return (
    <div className="flex flex-col gap-4 p-4 w-full max-w-md h-[400px] overflow-y-auto border rounded-lg bg-gray-50 mb-4">
      {messages.map((msg, index) => {
        // Display only actual conversation content
        if (msg.type === "user_message" || msg.type === "assistant_message") {
          return (
            <div 
              key={index} 
              className={`p-3 rounded-xl max-w-[80%] ${msg.type === "user_message" ? "bg-blue-600 text-white self-end" : "bg-white text-gray-800 border self-start"}`}
            >
              <p className="text-[10px] uppercase font-bold mb-1 opacity-70">
                {msg.type === "user_message" ? "User" : "Hume AI"}
              </p>
              <p className="text-sm">{msg.message.content}</p>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}