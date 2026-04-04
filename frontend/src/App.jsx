import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Boardutil from "./Boardutil.jsx";
import Login from "./auth/Login.jsx";
import Signup from "./auth/Signup.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./hero/home.jsx";
import { BoardProvider } from "./store/BoardProvider.jsx";
import CanvasContextProvider from "./store/CanvasContextProvider.jsx";
import ToolBoxProvider from "./store/ToolBoxProvider.jsx";

function BoardScreen() {
  return (
    <ToolBoxProvider>
      <BoardProvider>
        <Boardutil />
      </BoardProvider>
    </ToolBoxProvider>
  );
}

function App() {
  return (
    <CanvasContextProvider>
      <BrowserRouter>
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          closeOnClick
          pauseOnHover
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/board"
            element={
              <ProtectedRoute>
                <BoardScreen />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </CanvasContextProvider>
  );
}

export default App;

