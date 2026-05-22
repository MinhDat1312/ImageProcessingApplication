import React from 'react'
import { Input as AntInput } from 'antd'
import type { InputProps as AntInputProps } from 'antd'
import '../../styles/design-tokens.css'

export type InputProps = AntInputProps

export const Input: React.FC<InputProps> & { TextArea: typeof AntInput.TextArea } = (props) => {
  return <AntInput {...props} />
}

Input.TextArea = AntInput.TextArea

export default Input
