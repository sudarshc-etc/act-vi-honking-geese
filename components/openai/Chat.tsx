import CustomPhasesSlider from "../shared/CustomPhasesSlider";
import OpenAIIntegration from "./OpenAIIntegration";

export default function Chat(){
  return (
      <div className="grid md:grid-cols-2 gap-1 content-evenly">
        <div>
          <CustomPhasesSlider gooseName = 'Simba'/>
          <div className="flex justify-center">
            <OpenAIIntegration gooseName="Simba"></OpenAIIntegration>
          </div>
        </div>
        <div>
          <CustomPhasesSlider gooseName = 'Nala'/>
          <div className="flex justify-center">
            <OpenAIIntegration gooseName="Nala"></OpenAIIntegration>
          </div>
        </div>
      </div>
  );
}
