'use client'
import React, { MutableRefObject, forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'



export const State = () => {
  return (
    <Form />
  )
}



const Form = () => {
  const asfdsf = useRef<HTMLHeadingElement | null>(null)
  const { width } = useGetElementHeight(asfdsf)
  const [show, setShow] = React.useState(false)
  const [height, setHeight] = React.useState<number>(0)
  const ref = useCallback((node: HTMLInputElement | null) => {
    console.log()
    node?.focus()
  }, [])
  const h1Ref = useCallback((node: HTMLHeadingElement | null) => {
    if (node !== null) {
      setHeight(node.getBoundingClientRect().height)
    }
  }, [])
  return (
    <form>
      <h1 ref={h1Ref}>123</h1>
      <p>height : {height}</p>
      <button type="button" onClick={() => setShow(!show)}>
        show
      </button>
      <p>width : {width}</p>
      <h1 ref={asfdsf}>12</h1>
      {/* {show && <input
        ref={ref}
        defaultValue="Hello world"
      />} */}
      <input
        ref={ref}
        defaultValue="Hello world"
      />
    </form>
  )
}
type DimensionInfo = {
  width: number,
  height: number
}
const useGetElementHeight = <ElementRef extends HTMLElement>(
  ref: MutableRefObject<ElementRef | null>
) => {
  const [dimension, setDimension] = useState<DimensionInfo>({
    width: 0,
    height: 0
  })
  useLayoutEffect(() => {
    const getElementDimension = (): DimensionInfo => ({
      width: ref.current?.offsetWidth ?? 0,
      height: ref.current?.offsetHeight ?? 0
    })
    const handleResize = () => {
      setDimension(getElementDimension())
    }
    if (ref.current) {
      setDimension(getElementDimension())
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [ref])

  return dimension
}