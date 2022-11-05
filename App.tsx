import React from "react";
import { StatusBar } from "expo-status-bar";
import { NativeBaseProvider } from "native-base";
import { SafeAreaProvider } from "react-native-safe-area-context";

import Main from "./src/screens/main";

export default function App() {
  return (
    <SafeAreaProvider>
      <NativeBaseProvider>
        <Main />
      </NativeBaseProvider>
    </SafeAreaProvider>
  );
}
