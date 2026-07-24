import { useContext, useEffect, useMemo, useRef, useState } from "react";
import getStroke from "perfect-freehand";
import rough from "roughjs/bundled/rough.esm";
import { TOOL_ACTION_TYPES, TOOL_ITEMS } from "../../constants";
import { BoardContext } from "../../store/BoardContext";
import { CanvasContext } from "../../store/CanvasHistory";
import { getSvgPathFromStroke, serializeElements } from "../../utils/Elemenst";
import classess from "./index.module.css";

function Canvas() {
  const canvasref = useRef(null);
  const textref = useRef(null);
  const isFirstRender = useRef(true);
  const [resizeCounter, setResizeCounter] = useState(0);
  const {
    elements,
    HandleMouseDown,
    HandleMouseMove,
    ToolActionType,
    HandleMouseUp,
    HandleTextOnblur,
    UndoHandler,
    RedoHandler,
    SetElementsOnRefresh,
  } = useContext(BoardContext);
  const { currentRoom } = useContext(CanvasContext);

  const activeTextElement =
    ToolActionType === TOOL_ACTION_TYPES.WRITING && elements.length > 0
      ? elements[elements.length - 1]
      : null;

  useEffect(() => {
    const canvas = canvasref.current;
    if (!canvas) return undefined;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      setResizeCounter((c) => c + 1);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  useEffect(() => {
    const textarea = textref.current;
    if (!textarea || ToolActionType !== TOOL_ACTION_TYPES.WRITING) return;

    setTimeout(() => {
      textarea.focus();
    }, 0);
  }, [ToolActionType]);

  useEffect(() => {
    const canvas = canvasref.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    const roughcanvas = rough.canvas(canvas);

    context.clearRect(0, 0, canvas.width, canvas.height);

    elements.forEach((element) => {
      switch (element.type) {
        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.ARROW:
        case TOOL_ITEMS.CIRCLE:
        case TOOL_ITEMS.RECTANGLE: {
          if (element.roughEle) {
            roughcanvas.draw(element.roughEle);
          }
          break;
        }
        case TOOL_ITEMS.BRUSH: {
          context.save();
          context.fillStyle = element.stroke;
          const path = new Path2D(getSvgPathFromStroke(getStroke(element.points)));
          context.fill(path);
          context.restore();
          break;
        }
        case TOOL_ITEMS.TEXT: {
          context.save();
          context.textBaseline = "top";
          context.font = `${element.size}px Caveat`;
          context.fillStyle = element.stroke;
          context.fillText(element.text, element.x1, element.y1);
          context.restore();
          break;
        }
        default:
          break;
      }
    });
  }, [elements, resizeCounter]);

  useEffect(() => {
    const Handlekeydown = (event) => {
      if (event.ctrlKey && event.key === "z") {
        UndoHandler();
      } else if (event.ctrlKey && event.key === "y") {
        RedoHandler();
      }
    };

    document.addEventListener("keydown", Handlekeydown);
    return () => document.removeEventListener("keydown", Handlekeydown);
  }, [UndoHandler, RedoHandler]);

  useEffect(() => {
    if (currentRoom) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    localStorage.setItem("canvaselements", JSON.stringify(serializeElements(elements)));
  }, [currentRoom, elements]);

  useEffect(() => {
    if (currentRoom) return;

    const savedCanvas = localStorage.getItem("canvaselements");
    if (savedCanvas) {
      try {
        SetElementsOnRefresh(JSON.parse(savedCanvas));
      } catch {
        localStorage.removeItem("canvaselements");
      }
    }
  }, [currentRoom, SetElementsOnRefresh]);

  const textBoxStyle = useMemo(() => {
    if (!activeTextElement) return {};

    return {
      top: activeTextElement.y1,
      left: activeTextElement.x1,
      color: activeTextElement.stroke,
      fontSize: `${activeTextElement.size}px`,
    };
  }, [activeTextElement]);

  return (
    <>
      {activeTextElement ? (
        <textarea
          ref={textref}
          type="text"
          className={classess.textElementBox}
          style={textBoxStyle}
          onBlur={(event) => {
            HandleTextOnblur(event.target.value);
          }}
        />
      ) : null}
      <canvas
        ref={canvasref}
        id="canvas"
        onMouseDown={HandleMouseDown}
        onMouseMove={(event) => {
          if (
            ToolActionType === TOOL_ACTION_TYPES.DRAWING ||
            ToolActionType === TOOL_ACTION_TYPES.ERASING
          ) {
            HandleMouseMove(event);
          }
        }}
        onMouseUp={HandleMouseUp}
      />
    </>
  );
}

export default Canvas;
