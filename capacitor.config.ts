import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.jascasekeeper.app",
  appName: "JAS Case Keeper",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
