'use client'
import { PropsWithChildren, createContext, useContext, useState } from "react"
import { useToast } from "../ui/use-toast"
import { useMutation } from "@tanstack/react-query"
import { trpc } from "@/utils/trpc"


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
    onSettled: () => {
      trpcUtils.getFileMessages.invalidate()
    },
    onError: (error) => {
      console.log(error)
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