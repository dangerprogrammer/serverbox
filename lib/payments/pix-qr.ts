import QRCode from "qrcode";

export async function buildPixQrCodeSvg(payload: string) {
  return QRCode.toString(payload, {
    type: "svg",
    width: 280,
    margin: 1,
    color: {
      dark: "#0f172a",
      light: "#fffdf8",
    },
  });
}
