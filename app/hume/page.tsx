import { fetchAccessToken } from "hume";
import ClientComponet from './ClientComponent'

export default async function Page() {
  const accessToken = await fetchAccessToken({
    apiKey: String(process.env.HUME_API_KEY),
    secretKey: String(process.env.HUME_SECRET_KEY),
  });

  return (
    <div className={"grow flex flex-col"}>
      <ClientComponet accessToken={accessToken} />
    </div>
  );
}