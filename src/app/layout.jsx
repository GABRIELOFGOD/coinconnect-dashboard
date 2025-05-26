import { AuthProvider } from "@/provider/authProvider";
import PluginInit from "@/helper/PluginInit";
import "./font.css";
import "./globals.css";
import { ToastContainer } from "react-toastify";

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
        <ToastContainer
          draggable
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
        />
        <body suppressHydrationWarning={true}>{children}</body>
      </AuthProvider>
    </html>
  );
}
