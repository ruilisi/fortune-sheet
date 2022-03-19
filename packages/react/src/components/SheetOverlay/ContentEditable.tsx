import React from "react";
import _ from "lodash";

type ContentEditableProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> & {
  innerRef: (e: HTMLDivElement | null) => void;
  onChange: (html: string) => void;
};

class ContentEditable extends React.Component<ContentEditableProps> {
  lastHtml?: string = undefined;

  root: HTMLDivElement | null = null;

  emitChange() {
    const { onChange } = this.props;
    const html = this.root?.innerHTML;
    if (onChange && html !== this.lastHtml) {
      onChange(html || "");
    }
    this.lastHtml = html;
  }

  render() {
    const { innerRef } = this.props;
    return (
      <div
        {..._.omit(this.props, "innerRef", "onChange", "html")}
        ref={(e) => {
          this.root = e;
          innerRef?.(e);
        }}
        tabIndex={0}
        onInput={this.emitChange.bind(this)}
        onBlur={this.emitChange.bind(this)}
        contentEditable
      />
    );
  }
}

export default ContentEditable;
