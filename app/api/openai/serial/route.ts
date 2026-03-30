import { SerialPort } from "serialport";

let port: SerialPort | null = null;

function getPort() {
  if (!port) {
    port = new SerialPort({
      path: "COM3",
      baudRate: 9600,
    });
  }
  return port;
}

export async function POST(req: Request) {
  const { volume } = await req.json();

  const port = getPort();

  // Send as number + newline
  port.write(`${volume}\n`);

  return Response.json({ success: true });
}