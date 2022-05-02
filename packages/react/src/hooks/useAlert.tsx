import React, { useContext, useCallback } from "react";
import MessageBox from "../components/MessageBox";
import { ModalContext } from "../context/modal";

export function useAlert() {
  const { showModal, hideModal } = useContext(ModalContext);
  const showAlert = useCallback(
    (
      message: string,
      type: "ok" | "yesno" = "ok",
      onOk: () => void = hideModal,
      onCancel: () => void = hideModal
    ) => {
      showModal(
        <MessageBox type={type} onOk={onOk} onCancel={onCancel}>
          {message}
        </MessageBox>
      );
    },
    [hideModal, showModal]
  );
  return {
    showAlert,
    hideAlert: hideModal,
  };
}
