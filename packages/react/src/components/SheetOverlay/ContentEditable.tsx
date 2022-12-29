import React from "react";
import _ from "lodash";

type ContentEditableProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> & {
  initialContent?: string;
  innerRef?: (e: HTMLDivElement | null) => void;
  onChange?: (html: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLDivElement, Element>) => void;
  autoFocus?: boolean;
  allowEdit?: boolean;
};

class ContentEditable extends React.Component<ContentEditableProps> {
  lastHtml?: string = undefined;

  root: HTMLDivElement | null = null;

  componentDidMount() {
    const { autoFocus, initialContent } = this.props;
    if (autoFocus) {
      this.root?.focus();
    }
    if (initialContent && this.root) {
      this.root.innerHTML = initialContent;
    }
  }

  UNSAFE_componentWillUpdate() {
    const { initialContent } = this.props;
    if (initialContent && this.root) {
      this.root.innerHTML = initialContent;
    }
  }

  emitChange() {
    const { onChange } = this.props;
    const html = this.root?.innerHTML;
    if (onChange && html !== this.lastHtml) {
      onChange(html || "");
    }
    this.lastHtml = html;
  }

  render() {
    const { innerRef, onBlur } = this.props;
    let { allowEdit } = this.props;
    if (_.isNil(allowEdit)) allowEdit = true;
    return (
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        {..._.omit(
          this.props,
          "innerRef",
          "onChange",
          "html",
          "onBlur",
          "autoFocus",
          "allowEdit",
          "initialContent"
        )}
        ref={(e) => {
          this.root = e;
          innerRef?.(e);
        }}
        tabIndex={0}
        onInput={this.emitChange.bind(this)}
        onBlur={(e) => {
          this.emitChange.bind(this)();
          onBlur?.(e);
        }}
        contentEditable={allowEdit}
      />
    );
  }
}

export default ContentEditable;
