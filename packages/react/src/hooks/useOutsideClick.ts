import React, { useEffect } from "react";

export function useOutsideClick(
  containerRef: React.RefObject<HTMLElement | null>,
  handler: () => void,
  deps?: React.DependencyList
) {
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as HTMLElement)
      ) {
        handler();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
