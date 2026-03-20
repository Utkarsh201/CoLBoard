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
import { useState } from 'react'


function App(){
  const [page, setPage] = useState("home");

  if (page === "login") {
    return <Login onNavigate={setPage} />;
  }

  if (page === "signup") {
    return <Signup onNavigate={setPage} />;
  }

  if (page === "board") {
    return (
      <CanvasContextProvider>
        <ToolBoxProvider>
          <BoardProvider>
            <Boardutil/>
          </BoardProvider>
        </ToolBoxProvider>
      </CanvasContextProvider>
    );
  }

  return <Home onStartDrawing={() => setPage("board")} onNavigate={setPage} />;
}

export default App

