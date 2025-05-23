import { AuthProvider } from "@/provider/authProvider";
import PluginInit from "@/helper/PluginInit";
import "./font.css";
import "./globals.css";

export const metadata = {
  title: "COINCONNECT",
  description:
    "This is user dashboard for CoinConnect, a cryptocurrency exchange platform and payment gateway.",
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <AuthProvider>
        <PluginInit />
        <body suppressHydrationWarning={true}>{children}</body>
      </AuthProvider>
    </html>
  );
}
