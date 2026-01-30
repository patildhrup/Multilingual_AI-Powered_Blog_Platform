import Home from "./components/Home";
import { LingoProviderWrapper } from "lingo.dev/react/client";
import { loadDictionary } from "./lingo/dictionary";

function App() {
  return (
    <LingoProviderWrapper
      loadDictionary={loadDictionary}
      fallback={<div className="flex items-center justify-center h-screen text-xl">Loading Translations...</div>}
    >
      <Home />
    </LingoProviderWrapper>
  );
}

export default App;
