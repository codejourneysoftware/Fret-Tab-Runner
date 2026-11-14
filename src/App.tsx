import React from "react";
import { ModularInstrumentHub } from "./components/ModularInstrumentHub";
import { RunnerStudio } from "./components/RunnerStudio";
import { FretStackProvider, useFretStack } from "./state/useFretStackStore";

const FretTabRunnerRoot: React.FC = () => {
  const { currentScreen } = useFretStack();
  return currentScreen === "instrumentHub" ? (
    <ModularInstrumentHub />
  ) : (
    <RunnerStudio />
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
