import React, {
  useContext,
  useState,
  useMemo,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import {
  locale,
  saveHyperlink,
  LinkCardProps,
  removeHyperlink,
  replaceHtml,
  getRangetxt,
  goToLink,
  isLinkValid,
  normalizeSelection,
  onRangeSelectionModalMoveStart,
} from "@fortune-sheet/core";
import "./index.css";
import _ from "lodash";
import WorkbookContext from "../../context";
import SVGIcon from "../SVGIcon";

export const LinkEditCard: React.FC<LinkCardProps> = ({
  r,
  c,
  rc,
  originText,
  originType,
  originAddress,
  isEditing,
  position,
  selectingCellRange,
}) => {
  const { context, setContext, refs } = useContext(WorkbookContext);
  const [linkText, setLinkText] = useState<string>(originText);
  const [linkAddress, setLinkAddress] = useState<string>(originAddress);
  const [linkType, setLinkType] = useState<string>(originType);
  const { insertLink, linkTypeList, button } = locale(context);
  const lastCell = useRef(
    normalizeSelection(context, [{ row: [r, r], column: [c, c] }])
  );
  const skipCellRangeSet = useRef(true);
  const isLinkAddressValid = isLinkValid(context, linkType, linkAddress);

  const tooltip = (
    <div className="validation-input-tip">{isLinkAddressValid.tooltip}</div>
  );

  const hideLinkCard = useCallback(() => {
    _.set(refs.globalCache, "linkCard.mouseEnter", false);
    setContext((draftCtx) => {
      draftCtx.linkCard = undefined;
    });
  }, [refs.globalCache, setContext]);

  const setRangeModalVisible = useCallback(
    (visible: boolean) =>
      setContext((draftCtx) => {
        draftCtx.luckysheet_select_save! = lastCell.current!;
        if (draftCtx.linkCard != null)
          draftCtx.linkCard.selectingCellRange = visible;
      }),
    [setContext]
  );

  const containerEvent = useMemo(
    () => ({
      onMouseEnter: () => _.set(refs.globalCache, "linkCard.mouseEnter", true),
      onMouseLeave: () => _.set(refs.globalCache, "linkCard.mouseEnter", false),
      onMouseDown: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
        e.stopPropagation(),
      onMouseMove: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
        e.stopPropagation(),
      onMouseUp: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
        e.stopPropagation(),
      onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) =>
        e.stopPropagation(),
      onDoubleClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
        e.stopPropagation(),
    }),
    [refs.globalCache]
  );

  const renderBottomButton = useCallback(
    (onOk: () => void, onCancel: () => void) => (
      <div className="button-group">
        <div className="button-basic button-default" onClick={onCancel}>
          {button.cancel}
        </div>
        <div className="button-basic button-primary" onClick={onOk}>
          {button.confirm}
        </div>
      </div>
    ),
    [button]
  );

  const renderToolbarButton = useCallback(
    (iconId: string, onClick: () => void) => (
      <div className="fortune-toolbar-button" onClick={onClick}>
        <SVGIcon name={iconId} style={{ width: 18, height: 18 }} />
      </div>
    ),
    []
  );

  useLayoutEffect(() => {
    setLinkAddress(originAddress);
    setLinkText(originText);
    setLinkType(originType);
  }, [rc, originAddress, originText, originType]);

  useLayoutEffect(() => {
    if (selectingCellRange) {
      skipCellRangeSet.current = true;
    }
  }, [selectingCellRange]);

  useLayoutEffect(() => {
    if (skipCellRangeSet.current) {
      skipCellRangeSet.current = false;
      return;
    }
    if (selectingCellRange) {
      const len = _.size(context.luckysheet_select_save);
      if (len > 0) {
        setLinkAddress(
          getRangetxt(
            context,
            context.currentSheetId,
            context.luckysheet_select_save![len - 1],
            ""
          )
        );
      }
    }
  }, [context, selectingCellRange]);

  if (!isEditing) {
    return (
      <div
        {...containerEvent}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
        className="fortune-link-modify-modal link-toolbar"
        style={{ left: position.cellLeft + 20, top: position.cellBottom + 4 }}
      >
        <div
          className="link-content"
          onClick={() => {
            setContext((draftCtx) =>
              goToLink(
                draftCtx,
                r,
                c,
                linkType,
                linkAddress,
                refs.scrollbarX.current!,
                refs.scrollbarY.current!
              )
            );
          }}
        >
          {linkType === "webpage"
            ? insertLink.openLink
            : replaceHtml(insertLink.goTo, { linkAddress })}
        </div>
        <div className="divider" />
        {linkType === "webpage" &&
          renderToolbarButton("copy", () => {
            navigator.clipboard.writeText(originAddress);
            hideLinkCard();
          })}
        {renderToolbarButton("pencil", () =>
          setContext((draftCtx) => {
            if (draftCtx.linkCard != null) {
              draftCtx.linkCard.isEditing = true;
            }
          })
        )}
        <div className="divider" />
        {renderToolbarButton("unlink", () =>
          setContext((draftCtx) => {
            _.set(refs.globalCache, "linkCard.mouseEnter", false);
            removeHyperlink(draftCtx, r, c);
          })
        )}
      </div>
    );
  }

  return selectingCellRange ? (
    <div
      className="fortune-link-modify-modal range-selection-modal"
      style={{ left: position.cellLeft, top: position.cellBottom + 5 }}
      {..._.omit(containerEvent, ["onMouseDown", "onMouseMove", "onMouseUp"])}
      onMouseDown={(e) => {
        const { nativeEvent } = e;
        onRangeSelectionModalMoveStart(context, refs.globalCache, nativeEvent);
        e.stopPropagation();
      }}
    >
      <div
        className="modal-icon-close"
        onClick={() => setRangeModalVisible(false)}
      >
        <SVGIcon name="close" />
      </div>
      <div className="modal-title">{insertLink.selectCellRange}</div>
      <input
        {...containerEvent}
        className={`range-selection-input ${
          !linkAddress || isLinkAddressValid.isValid ? "" : "error-input"
        }`}
        placeholder={insertLink.cellRangePlaceholder}
        onChange={(e) => setLinkAddress(e.target.value)}
        value={linkAddress}
      />
      {tooltip}
      <div className="modal-footer">
        {renderBottomButton(
          () => {
            if (isLinkAddressValid.isValid) setRangeModalVisible(false);
          },
          () => {
            setLinkAddress(originAddress);
            setRangeModalVisible(false);
          }
        )}
      </div>
    </div>
  ) : (
    <div
      className="fortune-link-modify-modal"
      style={{
        left: position.cellLeft + 20,
        top: position.cellBottom + 4,
      }}
      {...containerEvent}
    >
      <div className="fortune-link-modify-line">
        <div className="fortune-link-modify-title">{insertLink.linkText}</div>
        <input
          className="fortune-link-modify-input"
          spellCheck="false"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          value={linkText}
          onChange={(e) => setLinkText(e.target.value)}
        />
      </div>
      <div className="fortune-link-modify-line">
        <div className="fortune-link-modify-title">{insertLink.linkType}</div>
        <select
          className="fortune-link-modify-select"
          value={linkType}
          onChange={(e) => {
            if (e.target.value === "sheet") {
              if (!linkText) {
                setLinkText(context.luckysheetfile[0].name);
              }
              setLinkAddress(context.luckysheetfile[0].name);
            } else {
              setLinkAddress("");
            }
            if (e.target.value === "cellrange") setRangeModalVisible(true);
            setLinkType(e.target.value);
          }}
        >
          {linkTypeList.map((type) => (
            <option key={type.value} value={type.value}>
              {type.text}
            </option>
          ))}
        </select>
      </div>
      <div className="fortune-link-modify-line">
        {linkType === "webpage" && (
          <>
            <div className="fortune-link-modify-title">
              {insertLink.linkAddress}
            </div>
            <input
              className={`fortune-link-modify-input ${
                !linkAddress || isLinkAddressValid.isValid ? "" : "error-input"
              }`}
              spellCheck="false"
              value={linkAddress}
              onChange={(e) => setLinkAddress(e.target.value)}
            />
            {tooltip}
          </>
        )}
        {linkType === "cellrange" && (
          <>
            <div className="fortune-link-modify-title">
              {insertLink.linkCell}
            </div>
            <input
              className={`fortune-link-modify-input ${
                !linkAddress || isLinkAddressValid.isValid ? "" : "error-input"
              }`}
              spellCheck="false"
              value={linkAddress}
              onChange={(e) => setLinkAddress(e.target.value)}
            />
            <div
              className="fortune-link-modify-cell-selector"
              onClick={() => setRangeModalVisible(true)}
            >
              <SVGIcon name="border-all" />
            </div>
            {tooltip}
          </>
        )}
        {linkType === "sheet" && (
          <>
            <div className="fortune-link-modify-title">
              {insertLink.linkSheet}
            </div>
            <select
              className="fortune-link-modify-select"
              onChange={(e) => {
                if (!linkText) setLinkText(e.target.value);
                setLinkAddress(e.target.value);
              }}
              value={linkAddress}
            >
              {context.luckysheetfile.map((sheet) => (
                <option key={sheet.id} value={sheet.name}>
                  {sheet.name}
                </option>
              ))}
            </select>
            {tooltip}
          </>
        )}
      </div>
      <div className="modal-footer">
        {renderBottomButton(() => {
          if (!isLinkAddressValid.isValid) return;
          _.set(refs.globalCache, "linkCard.mouseEnter", false);
          setContext((draftCtx) =>
            saveHyperlink(draftCtx, r, c, linkText, linkType, linkAddress)
          );
        }, hideLinkCard)}
      </div>
    </div>
  );
};

export default LinkEditCard;
