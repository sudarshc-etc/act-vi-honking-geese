export type AIAgentHandle = {
  startSession: () => void;
  endSession: () => void;
  sendMessage: (text: string) => void;
  interrupt: () => void;
};