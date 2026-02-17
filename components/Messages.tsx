import { useVoice } from "@humeai/voice-react";

export default function Messages() {
  const { messages } = useVoice();

  return (
    <div>
      {messages.map((msg, index) => {
        if (msg.type === "user_message" || msg.type === "assistant_message") {
          return null;
        }

        return (
          <div key={msg.type + index}>
            <div>{msg.receivedAt.getDate()}</div>
            <div>{msg.type}</div>
          </div>
        );
      })}
    </div>
  );
}
