import React from "react";

type ContentEditableProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> & {
  html: string;
  innerRef: React.MutableRefObject<HTMLDivElement | null>;
  onChange: (html: string) => void;
};

class ContentEditable extends React.Component<ContentEditableProps> {
  lastHtml?: string = undefined;

  root: HTMLDivElement | null = null;

  shouldComponentUpdate(nextProps: ContentEditableProps) {
    return nextProps.html !== this.root?.innerHTML;
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
    const { html, innerRef } = this.props;
    return (
      <div
        {...this.props}
        onChange={() => {}}
        ref={(e) => {
          this.root = e;
          innerRef.current = e;
        }}
        onInput={this.emitChange.bind(this)}
        onBlur={this.emitChange.bind(this)}
        contentEditable
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
}

export default ContentEditable;
