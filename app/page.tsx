import { fetchAccessToken } from "hume";
import ClientComponent from './ClientComponent';

export default async function Page() {
  // Use environment variables for security
  const accessToken = await fetchAccessToken({
    apiKey: String(process.env.HUME_API_KEY),
    secretKey: String(process.env.HUME_SECRET_KEY),
  });

  return (
    <div className="grow flex flex-col items-center justify-center min-h-screen">
      <ClientComponent accessToken={accessToken} />
    </div>
  );
}