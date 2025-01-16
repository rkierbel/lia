export interface Message {
  id: string;
  text: string;
  fromUser: boolean;
  generating?: boolean;
}
