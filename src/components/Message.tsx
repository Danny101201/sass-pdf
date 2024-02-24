import { ExtendedMessage } from '@/types/message'
import React, { forwardRef } from 'react'

interface MessageProps {
  message: ExtendedMessage
}

// eslint-disable-next-line react/display-name
export const Message = forwardRef<HTMLDivElement, MessageProps>(({ message }, ref) => {
  return (
    <div ref={ref}>
      {message.text}
    </div>
  );
});
