export type InboxConversation = {
  id: number;
  status: "bot" | "human" | "closed";
  updatedAt: Date;
};

export type InboxMessage = {
  id: number;
  createdAt: Date;
};

export function buildInboxList<T extends InboxConversation>(conversations: T[]) {
  return [...conversations]
    .sort((first, second) => second.updatedAt.getTime() - first.updatedAt.getTime())
    .map(conversation => ({ ...conversation, needsHumanAttention: conversation.status === "human" }));
}

export function buildInboxHistory<T extends InboxMessage>(messages: T[]) {
  return [...messages].sort((first, second) => first.createdAt.getTime() - second.createdAt.getTime());
}
