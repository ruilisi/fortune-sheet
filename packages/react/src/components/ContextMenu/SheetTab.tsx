import { locale, deleteSheet, api } from "@tomerkakou/fortune-sheet-core";
import _ from "lodash";
import React, {
  useContext,
  useRef,
  useState,
  useLayoutEffect,
  useCallback,
} from "react";
import WorkbookContext from "../../context";
import { useAlert } from "../../hooks/useAlert";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import { ChangeColor } from "../ChangeColor";
import SVGIcon from "../SVGIcon";
import Divider from "./Divider";
import "./index.css";
import Menu from "./Menu";

const SheetTabContextMenu: React.FC = () => {
  const { context, setContext, settings } = useContext(WorkbookContext);
  const { x, y, sheet, onRename } = context.sheetTabContextMenu;
  const { sheetconfig } = locale(context);
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const [isShowChangeColor, setIsShowChangeColor] = useState<boolean>(false);
  const [isShowInputColor, setIsShowInputColor] = useState<boolean>(false);
  const { showAlert, hideAlert } = useAlert();
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setContext((ctx) => {
      ctx.sheetTabContextMenu = {};
    });
  }, [setContext]);

  useLayoutEffect(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect && x != null && y != null) {
      setPosition({ x, y: y - rect.height });
    }
  }, [x, y]);

  useOutsideClick(containerRef, close, [close]);

  const moveSheet = useCallback(
    (delta: number) => {
      if (context.allowEdit === false) return;
      if (!sheet) return;
      setContext((ctx) => {
        let currentOrder = -1;
        _.sortBy(ctx.luckysheetfile, ["order"]).forEach((_sheet, i) => {
          _sheet.order = i;
          if (_sheet.id === sheet.id) {
            currentOrder = i;
          }
        });
        api.setSheetOrder(ctx, { [sheet.id!]: currentOrder + delta });
      });
    },
    [context.allowEdit, setContext, sheet]
  );

  const hideSheet = useCallback(() => {
    if (context.allowEdit === false) return;
    if (!sheet) return;
    setContext((ctx) => {
      const shownSheets = ctx.luckysheetfile.filter(
        (oneSheet) => _.isUndefined(oneSheet.hide) || oneSheet?.hide !== 1
      );
      if (shownSheets.length > 1) {
        api.hideSheet(ctx, sheet.id as string);
      } else {
        showAlert(sheetconfig.noMoreSheet, "ok");
      }
    });
  }, [context.allowEdit, setContext, sheet, showAlert, sheetconfig]);

  const copySheet = useCallback(() => {
    if (context.allowEdit === false) return;
    if (!sheet?.id) return;
    setContext(
      (ctx) => {
        api.copySheet(ctx, sheet.id!);
      },
      { addSheetOp: true }
    );
  }, [context.allowEdit, setContext, sheet?.id]);
  const updateShowInputColor = useCallback((state: boolean) => {
    setIsShowInputColor(state);
  }, []);

  const focusSheet = useCallback(() => {
    if (context.allowEdit === false) return;
    if (!sheet?.id) return;
    setContext((ctx) => {
      _.forEach(ctx.luckysheetfile, (sheetfile) => {
        sheetfile.status = sheet.id === sheetfile.id ? 1 : 0;
      });
    });
  }, [context.allowEdit, setContext, sheet?.id]);

  const updateEntitie=useCallback(()=>{
    setContext((ctx)=>{
      let sheetIndex:number=-1;
      for (let i = 0; i < ctx.luckysheetfile.length; i += 1) {
        if (ctx.luckysheetfile[i]?.id === sheet?.id) {
          sheetIndex = i;
          break;
        }
      }
      if(sheetIndex === -1 || !(sheet?.id)){
        throw Error("Invalid sheet");
      }
      settings.updateEntitie(false,sheet?.id,sheetIndex)
    })
  },[sheet?.id,setContext,settings.updateEntitie])

  const addEntitie=useCallback(()=>{
    setContext((ctx)=>{
      let sheetIndex:number=-1;
      for (let i = 0; i < ctx.luckysheetfile.length; i += 1) {
        if (ctx.luckysheetfile[i]?.id === sheet?.id) {
          sheetIndex = i;
          break;
        }
      }
      if(sheetIndex === -1 || !(sheet?.id)){
        throw Error("Invalid sheet");
      }
      settings.addEntitie(false,sheet?.id,sheetIndex)
    })
  },[sheet?.id,setContext,settings.addEntitie])

  if (!sheet || x == null || y == null) return null;

  return (
    <div
      className="fortune-context-menu luckysheet-cols-menu"
      onContextMenu={(e) => e.stopPropagation()}
      style={{ left: position.x, top: position.y, overflow: "visible" }}
      ref={containerRef}
    >
      {settings.sheetTabContextMenu?.map((name, i) => {
        if (name === "delete") {
          return (
            <Menu
              key={name}
              onClick={() => {
                const shownSheets = context.luckysheetfile.filter(
                  (singleSheet) =>
                    _.isUndefined(singleSheet.hide) || singleSheet.hide !== 1
                );
                if (
                  context.luckysheetfile.length > 1 &&
                  shownSheets.length > 1
                ) {
                  showAlert(sheetconfig.confirmDelete, "yesno", () => {
                    setContext(
                      (ctx) => {
                        deleteSheet(ctx, sheet.id!);
                      },
                      {
                        deleteSheetOp: {
                          id: sheet.id!,
                        },
                      }
                    );
                    hideAlert();
                  });
                } else {
                  showAlert(sheetconfig.noMoreSheet, "ok");
                }
                close();
              }}
            >
              {sheetconfig.delete}
            </Menu>
          );
        }
        if (name === "rename") {
          return (
            <Menu
              key={name}
              onClick={() => {
                onRename?.();
                close();
              }}
            >
              {sheetconfig.rename}
            </Menu>
          );
        }
        if (name === "move") {
          return (
            <React.Fragment key={name}>
              <Menu
                onClick={() => {
                  moveSheet(-1.5);
                  close();
                }}
              >
                {sheetconfig.moveLeft}
              </Menu>
              <Menu
                onClick={() => {
                  moveSheet(1.5);
                  close();
                }}
              >
                {sheetconfig.moveRight}
              </Menu>
            </React.Fragment>
          );
        }
        if (name === "hide") {
          return (
            <Menu
              key={name}
              onClick={() => {
                hideSheet();
                close();
              }}
            >
              {sheetconfig.hide}
            </Menu>
          );
        }
        if (name === "copy") {
          return (
            <Menu
              key={name}
              onClick={() => {
                copySheet();
                close();
              }}
            >
              {sheetconfig.copy}
            </Menu>
          );
        }
        if (name === "color") {
          return (
            <Menu
              key={name}
              onMouseEnter={() => {
                setIsShowChangeColor(true);
              }}
              onMouseLeave={() => {
                if (!isShowInputColor) {
                  setIsShowChangeColor(false);
                }
              }}
            >
              {sheetconfig.changeColor}
              <span className="change-color-triangle">
                <SVGIcon name="rightArrow" width={18} />
              </span>
              {isShowChangeColor && context.allowEdit && (
                <ChangeColor triggerParentUpdate={updateShowInputColor} />
              )}
            </Menu>
          );
        }
        if (name === "focus") {
          return (
            <Menu
              key={name}
              onClick={() => {
                focusSheet();
                close();
              }}
            >
              {sheetconfig.focus}
            </Menu>
          );
        }
        if (name === "|") {
          return <Divider key={`divide-${i}`} />;
        }
        if(name === "updateEntitie" && settings.onUpdate){
          return (
            <Menu
              key={name}
              onClick={() => {
                updateEntitie();
                close();
              }}
            >
              {sheetconfig.updateEntitie}
            </Menu>
          );
        }
        if(name === "revertChanges" && settings.onUpdate){
          return (
            <Menu
              key={name}
              onClick={() => {
                settings.revertChanges();
                close();
              }}
            >
              {sheetconfig.revertChanges}
            </Menu>
          );
        }
        if(name === "addEntitie" && !(settings.onUpdate)){
          return (
            <Menu
              key={name}
              onClick={() => {
                addEntitie();
                close();
              }}
            >
              {sheetconfig.addEntitie}
            </Menu>
          );
        }
        return null;
      })}
    </div>
  );
};

export default SheetTabContextMenu;
