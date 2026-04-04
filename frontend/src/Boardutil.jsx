import "./App.css";
import Canvas from "./components/Board/Index";
import BoardSyncBridge from "./components/BoardSyncBridge.jsx";
import RightSidebar from "./components/RightSidebar";
import Tollbar from "./components/Toolbar";
import Toolbox from "./components/Toolbox";

function Boardutil() {
  return (
    <>
      <BoardSyncBridge />
      <RightSidebar />
      <Tollbar />
      <Toolbox />
      <Canvas />
    </>
  );
}

export default Boardutil;
