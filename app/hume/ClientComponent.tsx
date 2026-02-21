'use client';
import dynamic from "next/dynamic";
const Chat = dynamic(() => import("@/components/humeai/Chat"), {
  ssr: false,
});

export default Chat;