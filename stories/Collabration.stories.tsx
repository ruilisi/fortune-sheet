import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Sheet, Op, Selection, colors } from "@fortune-sheet/core";
import { Workbook, WorkbookInstance } from "@fortune-sheet/react";
import { v4 as uuidv4 } from "uuid";
import { hashCode } from "./utils";

export default {
  component: Workbook,
} as ComponentMeta<typeof Workbook>;

const Template: ComponentStory<typeof Workbook> = ({ ...args }) => {
  const [data, setData] = useState<Sheet[]>();
  const [error, setError] = useState(false);
  const wsRef = useRef<WebSocket>();
  const workbookRef = useRef<WorkbookInstance>(null);
  const lastSelection = useRef<any>();
  const { username, userId } = useMemo(() => {
    const _userId = uuidv4();
    return { username: `User-${_userId.slice(0, 3)}`, userId: _userId };
  }, []);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8081/ws");
    wsRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ req: "getData" }));
    };
    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.req === "getData") {
        setData(msg.data);
      } else if (msg.req === "op") {
        workbookRef.current?.applyOp(msg.data);
      } else if (msg.req === "addPresences") {
        workbookRef.current?.addPresences(msg.data);
      } else if (msg.req === "removePresences") {
        workbookRef.current?.removePresences(msg.data);
      }
    };
    socket.onerror = () => {
      setError(true);
    };
  }, []);

  const onOp = useCallback((op: Op[]) => {
    const socket = wsRef.current;
    if (!socket) return;
    socket.send(JSON.stringify({ req: "op", data: op }));
  }, []);

  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);

  const afterSelectionChange = useCallback(
    (sheetId: string, selection: Selection) => {
      const socket = wsRef.current;
      if (!socket) return;
      const s = {
        r: selection.row[0],
        c: selection.column[0],
      };
      if (
        lastSelection.current?.r === s.r &&
        lastSelection.current?.c === s.c
      ) {
        return;
      }
      lastSelection.current = s;
      socket.send(
        JSON.stringify({
          req: "addPresences",
          data: [
            {
              sheetId,
              username,
              userId,
              color: colors[Math.abs(hashCode(userId)) % colors.length],
              selection: s,
            },
          ],
        })
      );
    },
    [userId, username]
  );

  if (error)
    return (
      <div style={{ padding: 16 }}>
        <p>Failed to connect to websocket server.</p>
        <p>
          Please note that this collabration demo connects to a local websocket
          server (ws://localhost:8081/ws).
        </p>
        <p>
          To make this work:
          <ol>
            <li>Clone the project</li>
            <li>Run server in backend-demo/: node index.js</li>
            <li>Make sure you also have mongodb running locally</li>
            <li>Try again</li>
          </ol>
        </p>
      </div>
    );

  if (!data) return <div />;

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Workbook
        ref={workbookRef}
        {...args}
        data={data}
        onChange={onChange}
        onOp={onOp}
        hooks={{
          afterSelectionChange,
        }}
      />
    </div>
  );
};

export const Example = Template.bind({});
