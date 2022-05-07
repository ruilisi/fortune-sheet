import React, { useContext, useCallback } from "react";
import Dialog from "../components/Dialog";
import { ModalContext } from "../context/modal";

export function useDialog() {
  const { showModal, hideModal } = useContext(ModalContext);
  const showDialog = useCallback(
    (
      content: string | React.ReactNode,
      type?: "ok" | "yesno",
      onOk: () => void = hideModal,
      onCancel: () => void = hideModal
    ) => {
      showModal(
        <Dialog type={type} onOk={onOk} onCancel={onCancel}>
          {content}
        </Dialog>
      );
    },
    [hideModal, showModal]
  );
  return {
    showDialog,
    hideDialog: hideModal,
  };
}
