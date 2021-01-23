import React, { useState, useEffect, useRef } from "react";
import { last, trim } from "lodash";
import { PlayerID, PlayerInfo, Message } from "../types";
import { Chat as ChatIcon } from "./icons";

interface ChatMessageProps {
  message: Message;
  playerInfos: { [key: string]: PlayerInfo };
  itsMe: boolean;
}
const SPACE = 32;
const ESC = 27;
const MAX_MSG_LENGTH = 120;

const ChatMessage = (props: ChatMessageProps) => {
  const { message, playerInfos, itsMe } = props;
  const { text, playerID } = message;

  const color = playerInfos[playerID].color;

  let className = `chatMessage bgcolor${color}`;

  if (itsMe) {
    className += " chatMessageItsMe";
  }

  return <div className={className}>{text}</div>;
};

interface ChatProps {
  messages: Message[];
  sendMessage: (string) => void;
  playerID: PlayerID | null;
  playerInfos: { [key: string]: PlayerInfo };
}

const Chat = (props: ChatProps) => {
  const [isHidden, setIsHidden] = useState(true);

  // We have read until that timestamp.
  const [lastReadTs, setLastReadTs] = useState<number | undefined>(undefined);
  const [numUnread, setNumUnread] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, playerID, playerInfos } = props;

  // When the messages change, if we are looking at the messages, we will mark them are
  // read.
  useEffect(() => {
    if (!isHidden) {
      setLastReadTs(last(messages)?.ts);
    }
  }, [messages, isHidden]);

  // When the chat becomes visible, focus in the <input>.
  /*useEffect(() => {
    if (!isHidden) {
      inputRef.current?.focus();
    }
  }, [isHidden]);
  */

  // Update the number of unread messages.
  useEffect(() => {
    let n;
    if (lastReadTs == null) {
      n = messages.length;
    } else {
      // Count the number of unread messages.
      n = messages.filter((msg) => msg.ts > lastReadTs).length;
    }
    setNumUnread(n);
  }, [lastReadTs, messages]);

  // const inputClassName = isInputHidden ? "chatCollapsed" : "";

  // Listen for <space> and <Esc>.
  useEffect(() => {
    const onTab = (e) => {
      // If we hit a <space> and we are not already focused, then we focus and prevent
      // default (to not type a space).
      // On <Esc> we unfocus.
      const weHavefocus = inputRef.current === document.activeElement;
      if (e.keyCode === SPACE && !weHavefocus) {
        setIsHidden(false);
        inputRef.current?.focus();
        e.preventDefault();
      } else if (e.keyCode === ESC && weHavefocus) {
        inputRef.current?.blur();
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", onTab, false);

    return () => window.removeEventListener("keydown", onTab, false);
  }, [inputRef]);

  let chatWrapClassName = "chatWrap pointer";
  if (isHidden) {
    chatWrapClassName += " chatWrapCollapsed";
  }

  const numUnreadStr =
    numUnread > 9 ? (
      <span className="ninePlus">
        9<sup>+</sup>
      </span>
    ) : (
      numUnread
    );

  return (
    <div className="chatPosition">
      <div
        className={chatWrapClassName}
        onClick={() => {
          setIsHidden(!isHidden);
        }}
      >
        {isHidden ? (
          <>
            <ChatIcon />
            {numUnread > 0 && (
              <div className="chatNumUnreadWrap">
                <div className="chatNumUnread">{numUnreadStr}</div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="chatMessages">
              <div>
                {messages.map((message, i) => {
                  return (
                    <div className="chatMessageWrap">
                      <ChatMessage
                        message={message}
                        key={i}
                        playerInfos={playerInfos}
                        itsMe={
                          playerID == null || playerID === message.playerID
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <input
              onClick={(e) => {
                setIsHidden(false);
                e.stopPropagation();
              }}
              ref={inputRef}
              placeholder="Say something"
              maxLength={MAX_MSG_LENGTH}
              onKeyDown={(e) => {
                let text = (e.target as HTMLInputElement).value;
                if (e.keyCode === 13) {
                  text = trim(text);
                  if (text.length > 0) {
                    sendMessage(text);
                  }
                  if (inputRef.current != null) {
                    inputRef.current.value = "";
                  }
                  return false;
                }
                return true;
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
