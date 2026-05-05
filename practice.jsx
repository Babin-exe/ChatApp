import { useEffect, useState } from "react";
import api from "./frontend/src/lib/api";
export const ChatPanelll = ({ selectedContact }) => {
  const normalizeId = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value?._id || value?.id || "";
  };

  /* 
  
  You have to ask yourself what is the most basic thing we have 
  to do in this component no question asked ???



  we need to know who is the person that is selcted and according to 
  that we have to fetch the chat info and show the user ...


  and how do i know who is selected that will be given to me as props , thanks 
  */

  //lets do the fetching then

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    if (!selectedContact?._id) return;

    try {
      setLoading(true);
      const res = await api.get(`/api/chats/messages/${selectedContact?._id}`);
      setMessages(res.data.data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedContact?._id) {
      setMessages([]);
      return;
    }
    fetchMessages();
  }, [selectedContact?._id]);

  //Now comes the final part while it is loading we will show loading messages
  //when the message is finally available we will show them that it :)

  /*
  
Okay now i have to implement message sending 

what do i need for that i will need some input form in which user will type 
something with each input change i will lets say update that in state
etc ect and we will give a button on click of that some sending api is hit

now lets try to write that actual api then ....

i will need a state to hold a new message a user want to send 
and i will need a state to check loading stuff over here


one i have sent the message what do i want to do ??
i have to see what i have sent in the chat also 
  
  */

  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  const sendMessage = async (contentToSend) => {
    if (!selectedContact || !contentToSend.trim()) return;

    try {
      setSending(true);
      const res = await api.post(`/api/messages/send/${selectedContact._id}`, {
        content: contentToSend,
        type: "text",
      });

      if (!res.data.messageData?._id) {
        throw new Error("Invalid response");
      }

      setNewMessage("");

      const savedMessage = res.data.messageData;

      setMessages((prev) => {
        return [...prev, savedMessage];
      });
    } catch (error) {
      console.log(error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {!selectedContact && <p>Please Select a contact </p>}
      {loading && <p>Loading.....</p>}
      {messages.length === 0 && <p>Nothing to show </p>}
      {messages.map((msg) => {
        return <div key={msg?._id}>{msg?.content}</div>;
      })}
    </div>
  );
};
