"use client";
import React, { useMemo, useRef, useState } from "react";
import { cn } from "../lib/utils";

export const BackgroundRippleEffect = ({
    rows = 12,
    cols = 27,
    cellSize = 56,
    interactive = true,
}) => {
    const [clickedCell, setClickedCell] = useState(null);
    const [rippleKey, setRippleKey] = useState(0);
    const ref = useRef(null);

    return (
        <div
            ref={ref}
            className={cn(
                "fixed inset-0 h-full w-full overflow-hidden bg-transparent z-[10] pointer-events-none",
            )}>
            <div className="relative h-full w-full overflow-hidden pointer-events-auto">
                <DivGrid
                    key={`base-${rippleKey}`}
                    className="opacity-100"
                    rows={rows}
                    cols={cols}
                    cellSize={cellSize}
                    borderColor="rgba(0,0,0,0.06)"
                    fillColor="transparent"
                    clickedCell={clickedCell}
                    onCellClick={(row, col) => {
                        setClickedCell({ row, col });
                        setRippleKey((k) => k + 1);
                    }}
                    interactive={interactive} />
            </div>
        </div>
    );
};

const DivGrid = ({
    className,
    rows = 7,
    cols = 30,
    cellSize = 56,
    borderColor = "rgba(255,255,255,0.1)",
    fillColor = "transparent",
    clickedCell = null,
    onCellClick = () => { },
    interactive = true
}) => {
    const cells = useMemo(() => Array.from({ length: rows * cols }, (_, idx) => idx), [rows, cols]);

    const gridStyle = {
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        width: "100vw",
        height: "100vh",
        justifyContent: "center",
    };

    return (
        <div className={cn("relative", className)} style={gridStyle}>
            {cells.map((idx) => {
                const rowIdx = Math.floor(idx / cols);
                const colIdx = idx % cols;
                const distance = clickedCell
                    ? Math.hypot(clickedCell.row - rowIdx, clickedCell.col - colIdx)
                    : 0;
                const delay = clickedCell ? Math.max(0, distance * 55) : 0;
                const duration = 500 + distance * 40;

                const style = clickedCell
                    ? {
                        "--delay": `${delay}ms`,
                        "--duration": `${duration}ms`,
                    }
                    : {};

                return (
                    <div
                        key={idx}
                        className={cn(
                            "cell relative border-[0.5px] opacity-30 transition-all duration-300 hover:opacity-100 hover:bg-black/[0.03]",
                            clickedCell && "animate-cell-ripple",
                            !interactive && "pointer-events-none"
                        )}
                        style={{
                            backgroundColor: fillColor,
                            borderColor: borderColor,
                            ...style,
                        }}
                        onClick={
                            interactive ? () => onCellClick?.(rowIdx, colIdx) : undefined
                        } />
                );
            })}
        </div>
    );
};