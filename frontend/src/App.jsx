import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import BlogLanding from "./pages/BlogLanding";
import BlogEditor from "./pages/BlogEditor";
import PostDetails from "./pages/PostDetails";
import { LingoProviderWrapper } from "lingo.dev/react/client";
import { loadDictionary } from "./lingo/dictionary";
import { AuthProvider } from "./context/AuthContext";
import ChatBot from "./components/ChatBot";


function App() {
  return (
    <LingoProviderWrapper
      loadDictionary={loadDictionary}
      fallback={<div className="flex items-center justify-center h-screen text-xl">Loading Translations...</div>}
    >
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/blog" element={<BlogLanding />} />
            <Route path="/editor" element={<BlogEditor />} />
            <Route path="/post/:id" element={<PostDetails />} />
          </Routes>
          <ChatBot />
        </BrowserRouter>
      </AuthProvider>
    </LingoProviderWrapper>
  );
}

export default App;
