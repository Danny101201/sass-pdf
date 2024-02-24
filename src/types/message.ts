import { RouterOutput } from '@/server/trpc';

type Messages = RouterOutput['getFileMessages']['messages']
type OmitText = Omit<Messages[number], 'text'>
type ExtendedText = {
  text: string | JSX.Element
}
export type ExtendedMessage = OmitText & ExtendedText