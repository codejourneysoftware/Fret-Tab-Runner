import React from "react";
import { ModularInstrumentHub } from "./components/ModularInstrumentHub";
import { RunnerStudio } from "./components/RunnerStudio";
import { YouTubeSyncHost } from "./components/YouTubeSyncHost";
import { FretStackProvider, useFretStack } from "./state/useFretStackStore";

const FretTabRunnerRoot: React.FC = () => {
  const { currentScreen } = useFretStack();
  return (
    <>
      {currentScreen === "instrumentHub" ? (
        <ModularInstrumentHub />
      ) : (
        <RunnerStudio />
      )}
      <YouTubeSyncHost />
    </>
  );
};

export function App() {
  return (
    <FretStackProvider>
      <FretTabRunnerRoot />
    </FretStackProvider>
  );
}

export default App;
