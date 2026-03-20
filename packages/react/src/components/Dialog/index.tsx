import { locale } from "@fortune-sheet/core";
import React, { useContext, useEffect, useRef } from "react";
import WorkbookContext from "../../context";
import SVGIcon from "../SVGIcon";
import "./index.css";

type Props = {
  type?: "ok" | "yesno";
  onOk?: () => void;
  onCancel?: () => void;
  containerStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  children?: React.ReactNode;
};

const Dialog: React.FC<Props> = ({
  type,
  onOk,
  onCancel,
  children,
  containerStyle,
  contentStyle,
}) => {
  const { context } = useContext(WorkbookContext);
  const { button } = locale(context);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousActiveElement.current =
      document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const trapFocus = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel?.();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusable.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement as HTMLElement | null;
      if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      dialog.focus();
    }
    dialog.addEventListener("keydown", trapFocus);
    return () => {
      dialog.removeEventListener("keydown", trapFocus);
      if (previousActiveElement.current?.isConnected) {
        previousActiveElement.current.focus();
      }
    };
  }, [onCancel]);

  const activateOnEnter = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.click();
    }
  };

  return (
    <div
      className="fortune-dialog"
      style={containerStyle}
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fortune-sort-title"
      aria-label="Dialog"
      tabIndex={-1}
    >
      <div className="fortune-modal-dialog-header">
        <div
          className="fortune-modal-dialog-icon-close"
          onClick={onCancel}
          onKeyDown={activateOnEnter}
          tabIndex={0}
          role="button"
          aria-label={button.close}
        >
          <SVGIcon name="close" style={{ padding: 7, cursor: "pointer" }} />
        </div>
      </div>
      <div className="fortune-dialog-box-content" style={contentStyle}>
        {children}
      </div>
      {type != null && (
        <div className="fortune-dialog-box-button-container">
          {type === "ok" ? (
            <div
              className="fortune-message-box-button button-default"
              onClick={onOk}
              onKeyDown={activateOnEnter}
              tabIndex={0}
            >
              {button.confirm}
            </div>
          ) : (
            <>
              <div
                className="fortune-message-box-button button-primary"
                onClick={onOk}
                onKeyDown={activateOnEnter}
                tabIndex={0}
              >
                {button.confirm}
              </div>
              <div
                className="fortune-message-box-button button-default"
                onClick={onCancel}
                onKeyDown={activateOnEnter}
                tabIndex={0}
              >
                {button.cancel}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Dialog;
