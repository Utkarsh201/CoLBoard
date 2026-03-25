// import './App.css'
// import Tollbar from './components/Toolbar'
// import Toolbox from './components/Toolbox'
// import Canvas from './components/Board/Index'
// import { Loginsignup } from './components/Login&Register.jsx'
// import RightSidebar from './components/RightSidebar'
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// function App() {
 
//   return (
//     <>
//     <ToastContainer
//         position="bottom-right"
//         autoClose={3000}
//         hideProgressBar={false}
//         closeOnClick
//         pauseOnHover
//       />
//       <Loginsignup/>
//       <RightSidebar />
//       <Tollbar/>
//       <Toolbox/>
//       <Canvas/>
//     </>
//   )
// }

// export default App

// line 39 40 44-49 was by the ai

import './index.css'
import { BoardProvider } from './store/BoardProvider.jsx'
import ToolBoxProvider from './store/ToolBoxProvider.jsx'
import CanvasContextProvider from './store/CanvasContextProvider.jsx'
import Boardutil from './Boardutil.jsx'
import Home from './hero/home.jsx'
import Login from './auth/Login.jsx'
import Signup from './auth/Signup.jsx'
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/board" element={
          <CanvasContextProvider>
            <ToolBoxProvider>
              <BoardProvider>
                <Boardutil />
              </BoardProvider>
            </ToolBoxProvider>
          </CanvasContextProvider>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App

