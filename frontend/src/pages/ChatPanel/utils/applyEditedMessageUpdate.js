export const applyEditedMessageUpdate = (messages, editedMessage) => {
  if (!editedMessage?.messageId) return messages;

  return messages.map((message) =>
    message._id === editedMessage.messageId
      ? {
          ...message,
          content: editedMessage.content,
          edited: editedMessage.edited ?? message.edited,
          updatedAt: editedMessage.updatedAt ?? message.updatedAt,
        }
      : message
  );
};
