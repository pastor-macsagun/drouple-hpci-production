import { fireEvent } from '@testing-library/react'

async function type(element: Element, text: string) {
  const input = element as HTMLInputElement | HTMLTextAreaElement
  const initialValue = input.value ?? ''
  input.value = initialValue

  for (const char of text) {
    const nextValue = (input.value ?? '') + char
    fireEvent.input(input, { target: { value: nextValue } })
    input.value = nextValue
  }
}

async function click(element: Element) {
  fireEvent.click(element)
}

const userEvent = {
  type,
  click,
}

export default userEvent
