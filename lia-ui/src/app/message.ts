export interface Message {
  threadId: string;
  text: string;
  fromUser: boolean;
  generating?: boolean;
}
