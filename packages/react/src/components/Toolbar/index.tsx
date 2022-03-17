import React, {
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import WorkbookContext from "../../context";
import produce from "immer";
import { handleBold } from "@fortune-sheet/core/src/modules/toolbar";
import "./index.css";

const Toolbar: React.FC = () => {
  const { context, setContext, refs } = useContext(WorkbookContext);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="fortune-toolbar">
      <div className="luckysheet-toolbar-left-theme" />
      <div
        className="luckysheet-toolbar-button luckysheet-inline-block disabled"
        data-tips="撤销"
        id="luckysheet-icon-undo"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-icon luckysheet-inline-block "
              style={{ userSelect: "none" }}
            >
              <div
                aria-hidden="true"
                className="luckysheet-icon-img-container luckysheet-icon-img luckysheet-icon-undo iconfont luckysheet-iconfont-qianjin"
                style={{ userSelect: "none" }}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button luckysheet-inline-block disabled"
        data-tips="重做"
        id="luckysheet-icon-redo"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-icon luckysheet-inline-block "
              style={{ userSelect: "none" }}
            >
              <div
                aria-hidden="true"
                className="luckysheet-icon-img-container luckysheet-icon-img luckysheet-icon-redo iconfont luckysheet-iconfont-houtui"
                style={{ userSelect: "none" }}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button luckysheet-inline-block"
        data-tips="格式刷"
        id="luckysheet-icon-paintformat"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-icon luckysheet-inline-block "
              style={{ userSelect: "none" }}
            >
              <div
                aria-hidden="true"
                className="luckysheet-icon-img-container luckysheet-icon-img iconfont luckysheet-iconfont-geshishua"
                style={{ userSelect: "none" }}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        id="toolbar-separator-paint-format"
        className="luckysheet-toolbar-separator luckysheet-inline-block"
        style={{ userSelect: "none" }}
      />
      <div
        className="luckysheet-toolbar-button luckysheet-inline-block"
        data-tips="货币格式"
        id="luckysheet-icon-currency"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-icon luckysheet-inline-block "
              style={{ userSelect: "none" }}
            >
              <div
                aria-hidden="true"
                className="luckysheet-icon-img-container luckysheet-icon-img iconfont luckysheet-iconfont-jine"
                style={{ userSelect: "none" }}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button luckysheet-inline-block"
        data-tips="百分比格式"
        id="luckysheet-icon-percent"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-icon luckysheet-inline-block "
              style={{ userSelect: "none" }}
            >
              <div
                aria-hidden="true"
                className="luckysheet-icon-img-container luckysheet-icon-img iconfont luckysheet-iconfont-baifenhao"
                style={{ userSelect: "none" }}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button luckysheet-inline-block"
        data-tips="减少小数位数"
        id="luckysheet-icon-fmt-decimal-decrease"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-icon luckysheet-inline-block toolbar-decimal-icon"
              style={{ userSelect: "none" }}
            >
              <div
                aria-hidden="true"
                className="luckysheet-icon-img-container luckysheet-icon-img luckysheet-icon-decimal-decrease iconfont luckysheet-iconfont-jianxiaoxiaoshuwei"
                style={{ userSelect: "none" }}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button luckysheet-inline-block"
        data-tips="增加小数位数"
        id="luckysheet-icon-fmt-decimal-increase"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-icon luckysheet-inline-block toolbar-decimal-icon"
              style={{ userSelect: "none" }}
            >
              <div
                aria-hidden="true"
                className="luckysheet-icon-img-container luckysheet-icon-img luckysheet-icon-decimal-increase iconfont luckysheet-iconfont-zengjiaxiaoshuwei"
                style={{ userSelect: "none" }}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-select luckysheet-toolbar-menu-button luckysheet-inline-block"
        data-tips="更多格式"
        id="luckysheet-icon-fmt-other"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-menu-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-menu-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-toolbar-menu-button-caption luckysheet-inline-block"
              style={{ userSelect: "none" }}
            >
              {" "}
              自动{" "}
            </div>
            <div
              className="luckysheet-toolbar-menu-button-dropdown luckysheet-inline-block iconfont luckysheet-iconfont-xiayige"
              style={{ userSelect: "none" }}
            />
          </div>
        </div>
      </div>
      <div
        id="toolbar-separator-more-formats"
        className="luckysheet-toolbar-separator luckysheet-inline-block"
        style={{ userSelect: "none" }}
      />
      <div
        className="luckysheet-toolbar-select luckysheet-toolbar-menu-button luckysheet-inline-block"
        data-tips="字体"
        id="luckysheet-icon-font-family"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-menu-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-menu-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-toolbar-menu-button-caption luckysheet-inline-block"
              style={{ userSelect: "none" }}
            >
              {" "}
              Times New Roman{" "}
            </div>
            <div
              className="luckysheet-toolbar-menu-button-dropdown luckysheet-inline-block iconfont luckysheet-iconfont-xiayige"
              style={{ userSelect: "none" }}
            />
          </div>
        </div>
      </div>
      <div
        id="toolbar-separator-font"
        className="luckysheet-toolbar-separator luckysheet-inline-block"
        style={{ userSelect: "none" }}
      />
      <div
        className="luckysheet-toolbar-select luckysheet-toolbar-zoom-combobox luckysheet-toolbar-combo-button luckysheet-inline-block"
        data-tips="字号大小"
        id="luckysheet-icon-font-size"
        style={{ userSelect: "none" }}
        itemvalue="11"
      >
        <div
          className="luckysheet-toolbar-combo-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-combo-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              aria-posinset={4}
              aria-setsize={7}
              className="luckysheet-inline-block luckysheet-toolbar-combo-button-caption"
              style={{ userSelect: "none" }}
            >
              <input
                aria-label="字号大小"
                className="luckysheet-toolbar-combo-button-input luckysheet-toolbar-textinput"
                role="combobox"
                style={{ userSelect: "none" }}
                tabIndex="-1"
                type="text"
                value="10"
                onChange={() => {}}
              />
            </div>
            <div
              className="luckysheet-toolbar-combo-button-dropdown luckysheet-inline-block iconfont luckysheet-iconfont-xiayige"
              style={{ userSelect: "none" }}
            />
          </div>
        </div>
      </div>
      <div
        id="toolbar-separator-font-size"
        className="luckysheet-toolbar-separator luckysheet-inline-block"
        style={{ userSelect: "none" }}
      />
      <div
        className="luckysheet-toolbar-button luckysheet-inline-block"
        data-tips="粗体 (Ctrl+B)"
        id="luckysheet-icon-bold"
        onClick={() => {
          setContext(
            produce((draftCtx) => {
              handleBold(draftCtx, refs.cellInput.current!);
            })
          );
        }}
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-icon luckysheet-inline-block "
              style={{ userSelect: "none" }}
            >
              <div
                aria-hidden="true"
                className="luckysheet-icon-img-container luckysheet-icon-img luckysheet-icon-bold iconfont luckysheet-iconfont-jiacu"
                style={{ userSelect: "none" }}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button luckysheet-inline-block"
        data-tips="斜体 (Ctrl+I)"
        id="luckysheet-icon-italic"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-icon luckysheet-inline-block "
              style={{ userSelect: "none" }}
            >
              <div
                aria-hidden="true"
                className="luckysheet-icon-img-container luckysheet-icon-img luckysheet-icon-italic iconfont luckysheet-iconfont-wenbenqingxie1"
                style={{ userSelect: "none" }}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button luckysheet-inline-block"
        data-tips="删除线 (Alt+Shift+5)"
        id="luckysheet-icon-strikethrough"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-icon luckysheet-inline-block "
              style={{ userSelect: "none" }}
            >
              <div
                aria-hidden="true"
                className="luckysheet-icon-img-container luckysheet-icon-img luckysheet-icon-strikethrough iconfont luckysheet-iconfont-wenbenshanchuxian"
                style={{ userSelect: "none" }}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button luckysheet-inline-block"
        data-tips="下划线"
        id="luckysheet-icon-underline"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-icon luckysheet-inline-block "
              style={{ userSelect: "none" }}
            >
              <div
                aria-hidden="true"
                className="luckysheet-icon-img-container luckysheet-icon-img luckysheet-icon-underline iconfont luckysheet-iconfont-wenbenxiahuaxian"
                style={{ userSelect: "none" }}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button-split-left luckysheet-toolbar-button luckysheet-inline-block luckysheet-icon-text-color"
        data-tips="文本颜色"
        id="luckysheet-icon-text-color"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-menu-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-toolbar-menu-button-caption luckysheet-inline-block"
              style={{ userSelect: "none" }}
            >
              <div
                className="luckysheet-color-menu-button-indicator"
                style={{
                  borderBottomColor: "rgb(0, 0, 0)",
                  userSelect: "none",
                }}
              >
                <div
                  className="luckysheet-icon luckysheet-inline-block "
                  style={{ userSelect: "none" }}
                >
                  <div
                    className="text-color-bar"
                    style={{
                      backgroundColor: "#000",
                    }}
                  />
                  <div
                    aria-hidden="true"
                    className="luckysheet-icon-img-container luckysheet-icon-img luckysheet-icon-text-color iconfont luckysheet-iconfont-wenbenyanse"
                    style={{ userSelect: "none" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button-split-right luckysheet-toolbar-menu-button luckysheet-inline-block"
        data-tips="颜色选择..."
        id="luckysheet-icon-text-color-menu"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-menu-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-menu-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-toolbar-menu-button-dropdown luckysheet-inline-block iconfont luckysheet-iconfont-xiayige"
              style={{ userSelect: "none" }}
            />
          </div>
        </div>
      </div>
      <div
        id="toolbar-separator-text-color"
        className="luckysheet-toolbar-separator luckysheet-inline-block"
        style={{ userSelect: "none" }}
      />
      <div
        className="luckysheet-toolbar-button-split-left luckysheet-toolbar-button luckysheet-inline-block luckysheet-icon-cell-color"
        data-tips="单元格颜色"
        id="luckysheet-icon-cell-color"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-menu-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-toolbar-menu-button-caption luckysheet-inline-block"
              style={{ userSelect: "none" }}
            >
              <div
                className="luckysheet-color-menu-button-indicator"
                style={{
                  borderBottomColor: "rgb(255, 255, 255",
                  userSelect: "none",
                }}
              >
                <div
                  className="luckysheet-icon luckysheet-inline-block "
                  style={{ userSelect: "none" }}
                >
                  <div
                    className="text-color-bar"
                    style={{ backgroundColor: "#fff" }}
                  />
                  <div
                    aria-hidden="true"
                    className="luckysheet-icon-img-container luckysheet-icon-img luckysheet-icon-cell-color iconfont luckysheet-iconfont-tianchong"
                    style={{ userSelect: "none" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button-split-right luckysheet-toolbar-menu-button luckysheet-inline-block"
        data-tips="颜色选择..."
        id="luckysheet-icon-cell-color-menu"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-menu-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-menu-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-toolbar-menu-button-dropdown luckysheet-inline-block iconfont luckysheet-iconfont-xiayige"
              style={{ userSelect: "none" }}
            />
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button-split-left luckysheet-toolbar-button luckysheet-inline-block luckysheet-icon-border-all"
        data-tips="边框"
        id="luckysheet-icon-border-all"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-icon luckysheet-inline-block "
              style={{ userSelect: "none" }}
            >
              <div
                aria-hidden="true"
                className="luckysheet-icon-img-container luckysheet-icon-img luckysheet-icon-border-all iconfont luckysheet-iconfont-quanjiabiankuang"
                style={{ userSelect: "none" }}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button-split-right luckysheet-toolbar-menu-button luckysheet-inline-block"
        data-tips="边框类型..."
        id="luckysheet-icon-border-menu"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-menu-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-menu-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-toolbar-menu-button-dropdown luckysheet-inline-block iconfont luckysheet-iconfont-xiayige"
              style={{ userSelect: "none" }}
            />
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button-split-left luckysheet-toolbar-button luckysheet-inline-block luckysheet-icon-merge-button"
        data-tips="合并单元格"
        id="luckysheet-icon-merge-button"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-icon luckysheet-inline-block "
              style={{ userSelect: "none" }}
            >
              <div
                aria-hidden="true"
                className="luckysheet-icon-img-container luckysheet-icon-img luckysheet-icon-merge iconfont luckysheet-iconfont-hebing"
                style={{ userSelect: "none" }}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button-split-right luckysheet-toolbar-menu-button luckysheet-inline-block"
        data-tips="选择合并类型..."
        id="luckysheet-icon-merge-menu"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-menu-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-menu-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-toolbar-menu-button-dropdown luckysheet-inline-block iconfont luckysheet-iconfont-xiayige"
              style={{ userSelect: "none" }}
            />
          </div>
        </div>
      </div>
      <div
        id="toolbar-separator-merge-cell"
        className="luckysheet-toolbar-separator luckysheet-inline-block"
        style={{ userSelect: "none" }}
      />
      <div
        className="luckysheet-toolbar-button-split-left luckysheet-toolbar-button luckysheet-inline-block luckysheet-icon-align"
        data-tips="水平对齐"
        id="luckysheet-icon-align"
        role="button"
        style={{ userSelect: "none" }}
        type="left"
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-menu-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-toolbar-menu-button-caption luckysheet-inline-block"
              style={{ userSelect: "none" }}
            >
              <div
                className="luckysheet-icon luckysheet-inline-block "
                style={{ userSelect: "none" }}
              >
                <div
                  aria-hidden="true"
                  style={{ userSelect: "none" }}
                  className="luckysheet-icon-img-container luckysheet-icon-img luckysheet-icon-align-left iconfont luckysheet-iconfont-wenbenzuoduiqi"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button-split-right luckysheet-toolbar-menu-button luckysheet-inline-block"
        data-tips="对齐方式..."
        id="luckysheet-icon-align-menu"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-menu-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-menu-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-toolbar-menu-button-dropdown luckysheet-inline-block iconfont luckysheet-iconfont-xiayige"
              style={{ userSelect: "none" }}
            />
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button-split-left luckysheet-toolbar-button luckysheet-inline-block luckysheet-icon-valign"
        data-tips="垂直对齐"
        id="luckysheet-icon-valign"
        role="button"
        style={{ userSelect: "none" }}
        type="top"
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-menu-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-toolbar-menu-button-caption luckysheet-inline-block"
              style={{ userSelect: "none" }}
            >
              <div
                className="luckysheet-icon luckysheet-inline-block "
                style={{ userSelect: "none" }}
              >
                <div
                  aria-hidden="true"
                  style={{ userSelect: "none" }}
                  className="luckysheet-icon-img-container luckysheet-icon-img luckysheet-icon-valign-top iconfont luckysheet-iconfont-dingbuduiqi"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button-split-right luckysheet-toolbar-menu-button luckysheet-inline-block"
        data-tips="对齐方式..."
        id="luckysheet-icon-valign-menu"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-menu-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-menu-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-toolbar-menu-button-dropdown luckysheet-inline-block iconfont luckysheet-iconfont-xiayige"
              style={{ userSelect: "none" }}
            />
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button-split-left luckysheet-toolbar-button luckysheet-inline-block luckysheet-icon-textwrap"
        data-tips="文本换行"
        id="luckysheet-icon-textwrap"
        role="button"
        style={{ userSelect: "none" }}
        type="clip"
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-menu-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-toolbar-menu-button-caption luckysheet-inline-block"
              style={{ userSelect: "none" }}
            >
              <div
                className="luckysheet-icon luckysheet-inline-block "
                style={{ userSelect: "none" }}
              >
                <div
                  aria-hidden="true"
                  style={{ userSelect: "none" }}
                  className="luckysheet-icon-img-container luckysheet-icon-img luckysheet-icon-textwrap-clip iconfont luckysheet-iconfont-jieduan"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button-split-right luckysheet-toolbar-menu-button luckysheet-inline-block"
        data-tips="换行方式..."
        id="luckysheet-icon-textwrap-menu"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-menu-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-menu-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-toolbar-menu-button-dropdown luckysheet-inline-block iconfont luckysheet-iconfont-xiayige"
              style={{ userSelect: "none" }}
            />
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button-split-left luckysheet-toolbar-button luckysheet-inline-block luckysheet-icon-rotation"
        data-tips="文本旋转"
        id="luckysheet-icon-rotation"
        role="button"
        style={{ userSelect: "none" }}
        type="none"
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-menu-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-toolbar-menu-button-caption luckysheet-inline-block"
              style={{ userSelect: "none" }}
            >
              <div
                className="luckysheet-icon luckysheet-inline-block "
                style={{ userSelect: "none" }}
              >
                <div
                  aria-hidden="true"
                  style={{ userSelect: "none" }}
                  className="luckysheet-icon-img-container luckysheet-icon-img luckysheet-icon-rotation-none iconfont luckysheet-iconfont-wuxuanzhuang"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button-split-right luckysheet-toolbar-menu-button luckysheet-inline-block"
        data-tips="旋转方式..."
        id="luckysheet-icon-rotation-menu"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-menu-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-menu-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-toolbar-menu-button-dropdown luckysheet-inline-block iconfont luckysheet-iconfont-xiayige"
              style={{ userSelect: "none" }}
            />
          </div>
        </div>
      </div>
      <div
        id="toolbar-separator-text-rotate-mode"
        className="luckysheet-toolbar-separator luckysheet-inline-block"
        style={{ userSelect: "none" }}
      />
      <div
        className="luckysheet-toolbar-button-split-left luckysheet-toolbar-button luckysheet-inline-block"
        data-tips="插入图片"
        id="luckysheet-insertImg-btn-title"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-menu-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-toolbar-menu-button-caption luckysheet-inline-block"
              style={{ userSelect: "none" }}
            >
              <div
                className="luckysheet-icon luckysheet-inline-block "
                style={{ userSelect: "none" }}
              >
                <div
                  aria-hidden="true"
                  className="luckysheet-icon-img-container luckysheet-icon-img luckysheet-icon-rotation-none iconfont luckysheet-iconfont-tupian"
                  style={{ userSelect: "none" }}
                >
                  <input
                    id="luckysheet-imgUpload"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button-split-left luckysheet-toolbar-button luckysheet-inline-block"
        data-tips="插入链接"
        id="luckysheet-insertLink-btn-title"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-menu-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-toolbar-menu-button-caption luckysheet-inline-block"
              style={{ userSelect: "none" }}
            >
              <div
                className="luckysheet-icon luckysheet-inline-block "
                style={{ userSelect: "none" }}
              >
                <div
                  aria-hidden="true"
                  className="luckysheet-icon-img-container luckysheet-icon-img luckysheet-icon-rotation-none iconfont luckysheet-iconfont-lianjie"
                  style={{ userSelect: "none" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button-split-left luckysheet-toolbar-button luckysheet-inline-block"
        data-tips="图表"
        id="luckysheet-chart-btn-title"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-menu-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-toolbar-menu-button-caption luckysheet-inline-block"
              style={{ userSelect: "none" }}
            >
              <div
                className="luckysheet-icon luckysheet-inline-block "
                style={{ userSelect: "none" }}
              >
                <div
                  aria-hidden="true"
                  className="luckysheet-icon-img-container luckysheet-icon-img luckysheet-icon-rotation-none iconfont luckysheet-iconfont-tubiao"
                  style={{ userSelect: "none" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-select luckysheet-toolbar-menu-button luckysheet-inline-block"
        data-tips="批注"
        id="luckysheet-icon-postil"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-menu-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-menu-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-icon-img-container luckysheet-toolbar-menu-button-caption luckysheet-inline-block iconfont luckysheet-iconfont-zhushi"
              style={{ userSelect: "none" }}
            />
            <div
              className="luckysheet-toolbar-menu-button-dropdown luckysheet-inline-block iconfont luckysheet-iconfont-xiayige"
              style={{ userSelect: "none" }}
            />
          </div>
        </div>
      </div>
      <div
        className="luckysheet-toolbar-button luckysheet-inline-block"
        data-tips="更多功能"
        id="luckysheet-icon-morebtn"
        role="button"
        style={{ userSelect: "none" }}
      >
        <div
          className="luckysheet-toolbar-button-outer-box luckysheet-inline-block"
          style={{ userSelect: "none" }}
        >
          <div
            className="luckysheet-toolbar-button-inner-box luckysheet-inline-block"
            style={{ userSelect: "none" }}
          >
            <div
              className="luckysheet-toolbar-menu-button-caption luckysheet-inline-block"
              style={{ userSelect: "none" }}
            >
              更多
            </div>
            <div
              className="luckysheet-toolbar-menu-button-dropdown luckysheet-inline-block iconfont luckysheet-iconfont-xiayige"
              style={{ userSelect: "none", fontSize: 12 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
