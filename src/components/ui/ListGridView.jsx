"use client";
import React from "react";
import clsx from "clsx";

const defaultOptions = [
  { id: "list", icon: "list", name: "List View" },
  { id: "grid", icon: "grid", name: "Grid View" },
];

const sizeClasses = {
  small: "h-8  text-sm",
  medium: "h-9 text-sm",
  large: "h-11 text-sm",
  xl: "h-12  text-sm",
  removeSpace: "text-sm",
};

const ListGridView = React.memo(
  ({
    options = defaultOptions,
    templateViewType,
    onChange,
    size = "medium",
    className = "",
    nameShow = false,
  }) => {
    return (
      <div
        className={clsx(
          "border bg-white shadow-sm  divide-x divide-gray-200 overflow-hidden rounded-lg flex",
          sizeClasses[size],
          className
        )}
        role="group"
        aria-label="View mode selection"
      >
        {options?.map((view) => (
          <button
            key={view?.id}
            className={clsx(
              "flex items-center flex-grow cursor-pointer justify-center font-semibold transition-colors duration-200",
              templateViewType === view?.id
                ? "bg-gray-100 text-gray-900 "
                : "bg-white text-gray-500 hover:bg-gray-50",
              "px-3"
            )}
            onClick={() => onChange(view?.id)}
            aria-label={view?.name}
          >
            {nameShow && <span className="text-sm">{view?.name}</span>}
          
          </button>
        ))}
      </div>
    );
  }
);

export default ListGridView;
