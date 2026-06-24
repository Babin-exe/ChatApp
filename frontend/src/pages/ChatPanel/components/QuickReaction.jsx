import EmojiPicker from "emoji-picker-react";
import React, { useState } from "react";
import api from "../../../lib/api.js";

const quickReactions = ["👍", "❤️", "😂", "😮", "😢"];
const PickerMode = {
  QUICK: "quick",
  FULL: "full",
};

const QuickReaction = ({ messageId }) => {
  const [pickerMode, setPickerMode] = useState(PickerMode.QUICK);

  return (
    <div className="emoji-picker">
      {pickerMode === PickerMode.QUICK ? (
        <>
          {quickReactions.map((emoji) => (
            <button
              key={emoji}
              onClick={async () => {
                console.log(`clicked : ${emoji}`);

                const data = await api.post(
                  `/api/messages/${messageId}/reactions`,
                  {
                    emoji: emoji,
                  }
                );

                console.log(`Result of the function call : ${data}`);
              }}
            >
              {emoji}
            </button>
          ))}
          <button onClick={() => setPickerMode(PickerMode.FULL)}>+</button>
        </>
      ) : (
        <EmojiPicker
          onEmojiClick={async (obj) => {
            console.log(obj.emoji);
            await api.post(`/api/messages/${messageId}/reactions`, {
              emoji: obj.emoji,
            });
          }}
        />
      )}
    </div>
  );
};

export default QuickReaction;
