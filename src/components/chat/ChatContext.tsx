'use client'
import { PropsWithChildren, createContext, useContext, useRef, useState } from "react"
import { useToast } from "../ui/use-toast"
import { useMutation } from "@tanstack/react-query"
import { trpc } from "@/utils/trpc"
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query"


type StreamResponse = {
  addMessage: () => void,
  message: string,
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void,
  isLoading: boolean,
}
export const ChatContext = createContext<StreamResponse>({
  addMessage: () => { },
  message: '',
  handleInputChange: () => { },
  isLoading: false
})

interface ChatContextProviderProps extends PropsWithChildren {
  filedId: string
}
export const ChatContextProvider = ({ filedId, children }: ChatContextProviderProps) => {
  const trpcUtils = trpc.useUtils()
  const [message, setMessage] = useState<string>('')
  const { toast } = useToast()
  const backUpMessage = useRef('')
  const { mutateAsync: sendMessage, isLoading } = useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      const response = await fetch('/api/message', {
        method: 'POST',
        body: JSON.stringify({
          filedId,
          message
        })
      })
      if (!response.ok) {
        throw new Error('Failed to send message')
      }
      return response.json()
    },
    onMutate: async () => {
      backUpMessage.current = message
      setMessage('')
      await trpcUtils.getFileMessages.cancel()
      const previousMessages = trpcUtils.getFileMessages.getInfiniteData()
      trpcUtils.getFileMessages.setInfiniteData(
        { limit: INFINITE_QUERY_LIMIT, filedId },
        (old) => {
          if (!old) {
            return {
              pages: [],
              pageParams: []
            }
          }
          let newPages = [...old.pages]
          let lastPage = newPages[0]!
          lastPage.messages = [
            {
              created_at: new Date().toISOString(),
              id: crypto.randomUUID(),
              text: message,
              isUserMessage: true
            },
            ...lastPage.messages
          ]
          newPages[0] = lastPage
          return {
            ...old,
            pages: newPages
          }
        }
      )
      return {
        previousMessages
      }
    },
    onSettled: () => {
      trpcUtils.getFileMessages.invalidate({ filedId })
    },
    onSuccess: () => {

    },
    onError: (error, newMessage, context) => {
      trpcUtils.getFileMessages.setInfiniteData(
        { limit: INFINITE_QUERY_LIMIT, filedId },
        context?.previousMessages
      )
    }
  })

  const addMessage = () => sendMessage({ message })
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
  }
  return (
    <ChatContext.Provider value={{
      message,
      addMessage,
      handleInputChange,
      isLoading
    }}>{children}</ChatContext.Provider>
  )
}
export const useChat = () => useContext(ChatContext)