import { locale } from "@fortune-sheet/core";
import React, { useContext } from "react";
import WorkbookContext from "../../context";
import "./index.css";

type Props = {
  type: "ok" | "yesno";
  onOk?: () => void;
  onCancel?: () => void;
};

const MessageBox: React.FC<Props> = ({ type, onOk, onCancel, children }) => {
  const { context } = useContext(WorkbookContext);
  const { button } = locale(context);
  return (
    <div className="fortune-message-box">
      <div className="fortune-message-box-content">{children}</div>
      <div className="fortune-message-box-button-container">
        {type === "ok" ? (
          <div
            className="fortune-message-box-button button-default"
            onClick={onOk}
          >
            {button.confirm}
          </div>
        ) : (
          <>
            <div
              className="fortune-message-box-button button-primary"
              onClick={onOk}
            >
              {button.confirm}
            </div>
            <div
              className="fortune-message-box-button button-default"
              onClick={onCancel}
            >
              {button.cancel}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageBox;
