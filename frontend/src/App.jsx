import { BrowserRouter, Routes, Route } from "react-router-dom";
import BlogLanding from "./pages/BlogLanding";
import BlogEditor from "./pages/BlogEditor";
import PostDetails from "./pages/PostDetails";
import { LingoProviderWrapper } from "lingo.dev/react/client";
import { loadDictionary } from "./lingo/dictionary";
import { AuthProvider } from "./context/AuthContext";


function App() {
  return (
    <LingoProviderWrapper
      loadDictionary={loadDictionary}
      fallback={<div className="flex items-center justify-center h-screen text-xl">Loading Translations...</div>}
    >
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<BlogLanding />} />
            <Route path="/editor" element={<BlogEditor />} />
            <Route path="/post/:id" element={<PostDetails />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LingoProviderWrapper>
  );
}

export default App;
