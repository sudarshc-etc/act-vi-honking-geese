import { VoiceProvider } from "@humeai/voice-react";
import Messages from "./Messages";
import StartCall from "./StartCall";
import CustomPhasesSlider from "../shared/CustomPhasesSlider";

export default function Chat({
  accessToken,
}: {
  accessToken: string;
}) {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-1 content-evenly">
        <div>
          <CustomPhasesSlider gooseName = 'Simba'/>
          <div className="flex justify-center">
            <VoiceProvider>
              <Messages />
              <StartCall accessToken={accessToken} gooseName="Simba"/>
            </VoiceProvider>
          </div>
        </div>
        <div>
          <CustomPhasesSlider gooseName = 'Nala'/>
          <div className="flex justify-center">
            <VoiceProvider>
              <Messages />
              <StartCall accessToken={accessToken} gooseName="Nala"/>
            </VoiceProvider>
          </div>
        </div>
      </div>
    </>
  );
}
