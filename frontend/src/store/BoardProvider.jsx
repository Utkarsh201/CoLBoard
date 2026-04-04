import { useCallback, useContext, useReducer } from "react";
import { BOARD_ACTIONS, TOOL_ACTION_TYPES, TOOL_ITEMS } from "../constants";
import { BoardContext } from "./BoardContext";
import ToolboxContext from "./ToolBoxContext";
import GenRoughElements, { EraseElements, hydrateElements } from "../utils/Elemenst";

const initialState = {
  activetoolitem: TOOL_ITEMS.BRUSH,
  elements: [],
  ToolActionType: TOOL_ACTION_TYPES.NONE,
  undoElements: [],
};

const BoardReducer = (state, action) => {
  switch (action.type) {
    case BOARD_ACTIONS.CHANGE_TOOL:
      return {
        ...state,
        activetoolitem: action.payload.tool,
      };
    case BOARD_ACTIONS.CHANGE_ACTION_TYPE:
      return {
        ...state,
        ToolActionType: action.payload.actiontype,
      };
    case BOARD_ACTIONS.DRAW_DOWN: {
      const { clientX, clientY, stroke, fill, size } = action.payload;
      const nextElement = GenRoughElements(
        state.elements.length,
        clientX,
        clientY,
        clientX,
        clientY,
        {
          type: state.activetoolitem,
          stroke,
          fill,
          size,
        }
      );

      return {
        ...state,
        ToolActionType:
          state.activetoolitem === TOOL_ITEMS.TEXT
            ? TOOL_ACTION_TYPES.WRITING
            : TOOL_ACTION_TYPES.DRAWING,
        elements: [...state.elements, nextElement],
        undoElements: [],
      };
    }
    case BOARD_ACTIONS.DRAW_MOVE: {
      if (state.elements.length === 0) return state;

      const { clientX, clientY, stroke, fill, size } = action.payload;
      const nextElements = [...state.elements];
      const index = nextElements.length - 1;
      const { x1, y1, type } = nextElements[index];

      if (type === TOOL_ITEMS.BRUSH) {
        nextElements[index] = {
          ...nextElements[index],
          points: [...nextElements[index].points, { x: clientX, y: clientY }],
        };
      } else {
        nextElements[index] = GenRoughElements(index, x1, y1, clientX, clientY, {
          type: state.activetoolitem,
          stroke,
          fill,
          size,
        });
      }

      return {
        ...state,
        elements: nextElements,
      };
    }
    case BOARD_ACTIONS.DRAW_UP:
      return {
        ...state,
        ToolActionType: action.payload.actiontype,
      };
    case BOARD_ACTIONS.ERASE: {
      const { clientX, clientY } = action.payload;
      return {
        ...state,
        elements: state.elements.filter(
          (element) => !EraseElements(element, clientX, clientY)
        ),
      };
    }
    case BOARD_ACTIONS.CHANGE_TEXT: {
      if (state.elements.length === 0) {
        return {
          ...state,
          ToolActionType: TOOL_ACTION_TYPES.NONE,
        };
      }

      const nextElements = [...state.elements];
      const index = nextElements.length - 1;
      nextElements[index] = {
        ...nextElements[index],
        text: action.payload.newtext,
      };

      return {
        ...state,
        elements: nextElements,
        ToolActionType: TOOL_ACTION_TYPES.NONE,
      };
    }
    case BOARD_ACTIONS.UNDO: {
      if (state.elements.length === 0) return state;

      const nextElements = [...state.elements];
      const lastElement = nextElements.pop();

      return {
        ...state,
        elements: nextElements,
        undoElements: [...state.undoElements, lastElement],
      };
    }
    case BOARD_ACTIONS.REDO: {
      if (state.undoElements.length === 0) return state;

      const nextUndoElements = [...state.undoElements];
      const redoElement = nextUndoElements.pop();

      return {
        ...state,
        elements: [...state.elements, redoElement],
        undoElements: nextUndoElements,
      };
    }
    case BOARD_ACTIONS.ONREFRESH:
    case BOARD_ACTIONS.SETONAPICALL: {
      const source =
        action.type === BOARD_ACTIONS.ONREFRESH
          ? action.payload.value
          : action.payload.newelements;

      return {
        ...state,
        elements: hydrateElements(source),
        undoElements: [],
        ToolActionType: TOOL_ACTION_TYPES.NONE,
      };
    }
    default:
      return state;
  }
};

export const BoardProvider = ({ children }) => {
  const { Toolboxstate } = useContext(ToolboxContext);
  const [BoardState, DispatchBoardAction] = useReducer(BoardReducer, initialState);

  const HandleToolItemClick = (tool) => {
    DispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_TOOL,
      payload: { tool },
    });
  };

  const HandleMouseDown = (event) => {
    if (BoardState.ToolActionType === TOOL_ACTION_TYPES.WRITING) return;

    const { clientX, clientY } = event;
    if (BoardState.activetoolitem === TOOL_ITEMS.ERASER) {
      DispatchBoardAction({
        type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
        payload: { actiontype: TOOL_ACTION_TYPES.ERASING },
      });
      DispatchBoardAction({
        type: BOARD_ACTIONS.ERASE,
        payload: { clientX, clientY },
      });
      return;
    }

    DispatchBoardAction({
      type: BOARD_ACTIONS.DRAW_DOWN,
      payload: {
        clientX,
        clientY,
        stroke: Toolboxstate[BoardState.activetoolitem]?.stroke,
        fill: Toolboxstate[BoardState.activetoolitem]?.fill,
        size: Toolboxstate[BoardState.activetoolitem]?.size,
      },
    });
  };

  const HandleMouseMove = (event) => {
    if (BoardState.ToolActionType === TOOL_ACTION_TYPES.WRITING) return;

    const { clientX, clientY } = event;
    if (BoardState.ToolActionType === TOOL_ACTION_TYPES.DRAWING) {
      DispatchBoardAction({
        type: BOARD_ACTIONS.DRAW_MOVE,
        payload: {
          clientX,
          clientY,
          stroke: Toolboxstate[BoardState.activetoolitem]?.stroke,
          fill: Toolboxstate[BoardState.activetoolitem]?.fill,
          size: Toolboxstate[BoardState.activetoolitem]?.size,
        },
      });
      return;
    }

    if (BoardState.ToolActionType === TOOL_ACTION_TYPES.ERASING) {
      DispatchBoardAction({
        type: BOARD_ACTIONS.ERASE,
        payload: { clientX, clientY },
      });
    }
  };

  const HandleMouseUp = () => {
    if (BoardState.ToolActionType === TOOL_ACTION_TYPES.WRITING) return;

    DispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
      payload: { actiontype: TOOL_ACTION_TYPES.NONE },
    });
  };

  const HandleTextOnblur = (text) => {
    DispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_TEXT,
      payload: { newtext: text },
    });
  };

  const UndoHandler = useCallback(() => {
    DispatchBoardAction({ type: BOARD_ACTIONS.UNDO });
  }, []);

  const RedoHandler = useCallback(() => {
    DispatchBoardAction({ type: BOARD_ACTIONS.REDO });
  }, []);

  const SetElementsOnRefresh = useCallback((value) => {
    DispatchBoardAction({
      type: BOARD_ACTIONS.ONREFRESH,
      payload: { value },
    });
  }, []);

  const SetelementsOnApicall = useCallback((newelements) => {
    DispatchBoardAction({
      type: BOARD_ACTIONS.SETONAPICALL,
      payload: { newelements },
    });
  }, []);

  const BoardContextValue = {
    HandleToolItemClick,
    activetoolitem: BoardState.activetoolitem,
    elements: BoardState.elements,
    HandleMouseDown,
    HandleMouseMove,
    ToolActionType: BoardState.ToolActionType,
    HandleMouseUp,
    HandleTextOnblur,
    UndoHandler,
    undoElements: BoardState.undoElements,
    RedoHandler,
    SetElementsOnRefresh,
    SetelementsOnApicall,
  };

  return (
    <BoardContext.Provider value={BoardContextValue}>
      {children}
    </BoardContext.Provider>
  );
};
