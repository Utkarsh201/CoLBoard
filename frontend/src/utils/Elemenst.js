import getStroke from "perfect-freehand";
import rough from "roughjs/bundled/rough.esm";
import { ARROW_LENGTH, TOOL_ITEMS } from "../constants";
import { getArrowHeadsCoordinates, isPointCloseToLine } from "./math";

const gen = rough.generator();

const buildShapeElement = (base, roughEle) => ({
  ...base,
  roughEle,
});

const GenRoughElements = (id, x1, y1, x2, y2, { type, stroke, fill, size }) => {
  const options = {
    seed: id + 1,
    fillStyle: "solid",
  };

  if (stroke) {
    options.stroke = stroke;
  }

  if (fill) {
    options.fill = fill;
  }

  if (size) {
    options.strokeWidth = size;
  }

  const baseElement = {
    id,
    x1,
    y1,
    x2,
    y2,
    type,
    stroke: stroke || "#000000",
    fill: fill ?? null,
    size: Number(size) || 1,
  };

  switch (type) {
    case TOOL_ITEMS.LINE:
      return buildShapeElement(
        baseElement,
        gen.line(x1, y1, x2, y2, options)
      );
    case TOOL_ITEMS.RECTANGLE:
      return buildShapeElement(
        baseElement,
        gen.rectangle(x1, y1, x2 - x1, y2 - y1, options)
      );
    case TOOL_ITEMS.CIRCLE: {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      return buildShapeElement(
        baseElement,
        gen.ellipse(cx, cy, x2 - x1, y2 - y1, options)
      );
    }
    case TOOL_ITEMS.ARROW: {
      const { x3, y3, x4, y4 } = getArrowHeadsCoordinates(
        x1,
        y1,
        x2,
        y2,
        ARROW_LENGTH
      );
      const points = [
        [x1, y1],
        [x2, y2],
        [x3, y3],
        [x2, y2],
        [x4, y4],
      ];

      return buildShapeElement(baseElement, gen.linearPath(points, options));
    }
    case TOOL_ITEMS.BRUSH:
      return {
        id,
        type,
        points: [{ x: x1, y: y1 }],
        stroke: stroke || "#000000",
        size: Number(size) || 1,
      };
    case TOOL_ITEMS.TEXT:
      return {
        ...baseElement,
        text: "",
        size: Number(size) || 16,
      };
    default:
      throw new Error(`Unknown tool type: ${type}`);
  }
};

export const getSvgPathFromStroke = (stroke) => {
  if (!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], index, array) => {
      const [x1, y1] = array[(index + 1) % array.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  d.push("Z");
  return d.join(" ");
};

export const serializeElement = (element) => {
  if (!element || typeof element !== "object" || !element.type) return null;

  const serializableElement = { ...element };
  delete serializableElement.roughEle;
  delete serializableElement.path;
  return serializableElement;
};

export const serializeElements = (elements) =>
  Array.isArray(elements)
    ? elements.map(serializeElement).filter(Boolean)
    : [];

export const hydrateElement = (element) => {
  if (!element || typeof element !== "object" || !element.type) return null;

  switch (element.type) {
    case TOOL_ITEMS.LINE:
    case TOOL_ITEMS.RECTANGLE:
    case TOOL_ITEMS.CIRCLE:
    case TOOL_ITEMS.ARROW:
      return GenRoughElements(
        element.id ?? 0,
        element.x1,
        element.y1,
        element.x2,
        element.y2,
        {
          type: element.type,
          stroke: element.stroke,
          fill: element.fill,
          size: element.size,
        }
      );
    case TOOL_ITEMS.BRUSH:
      return {
        id: element.id ?? 0,
        type: element.type,
        points: Array.isArray(element.points) ? element.points : [],
        stroke: element.stroke || "#000000",
        size: Number(element.size) || 1,
      };
    case TOOL_ITEMS.TEXT:
      return {
        id: element.id ?? 0,
        x1: element.x1,
        y1: element.y1,
        x2: element.x2 ?? element.x1,
        y2: element.y2 ?? element.y1,
        type: element.type,
        stroke: element.stroke || "#000000",
        size: Number(element.size) || 16,
        text: element.text || "",
      };
    default:
      return null;
  }
};

export const hydrateElements = (elements) =>
  Array.isArray(elements)
    ? elements.map(hydrateElement).filter(Boolean)
    : [];

export const EraseElements = (element, pointX, pointY) => {
  if (!element || typeof element !== "object") return false;

  const { x1, y1, x2, y2, type } = element;
  if (!type) return false;

  const context = document.getElementById("canvas")?.getContext("2d");
  if (!context) return false;

  switch (type) {
    case TOOL_ITEMS.LINE:
    case TOOL_ITEMS.ARROW:
      return isPointCloseToLine(x1, y1, x2, y2, pointX, pointY);
    case TOOL_ITEMS.RECTANGLE:
    case TOOL_ITEMS.CIRCLE:
      return (
        isPointCloseToLine(x1, y1, x2, y1, pointX, pointY) ||
        isPointCloseToLine(x2, y1, x2, y2, pointX, pointY) ||
        isPointCloseToLine(x2, y2, x1, y2, pointX, pointY) ||
        isPointCloseToLine(x1, y2, x1, y1, pointX, pointY)
      );
    case TOOL_ITEMS.BRUSH: {
      const elementPath = new Path2D(getSvgPathFromStroke(getStroke(element.points)));
      return context.isPointInPath(elementPath, pointX, pointY);
    }
    case TOOL_ITEMS.TEXT: {
      context.save();
      context.font = `${element.size}px Caveat`;
      const textWidth = context.measureText(element.text).width;
      const textHeight = parseInt(element.size, 10);
      context.restore();

      return (
        isPointCloseToLine(x1, y1, x1 + textWidth, y1, pointX, pointY) ||
        isPointCloseToLine(
          x1 + textWidth,
          y1,
          x1 + textWidth,
          y1 + textHeight,
          pointX,
          pointY
        ) ||
        isPointCloseToLine(
          x1 + textWidth,
          y1 + textHeight,
          x1,
          y1 + textHeight,
          pointX,
          pointY
        ) ||
        isPointCloseToLine(x1, y1 + textHeight, x1, y1, pointX, pointY)
      );
    }
    default:
      return false;
  }
};

export default GenRoughElements;
