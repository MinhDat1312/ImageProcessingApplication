import React from 'react'
import { Input as AntInput } from 'antd'
import type { InputProps as AntInputProps } from 'antd'
import '../../styles/design-tokens.css'

export type InputProps = AntInputProps

export const Input: React.FC<InputProps> & { 
  TextArea: typeof AntInput.TextArea;
  Password: typeof AntInput.Password;
  Search: typeof AntInput.Search;
  OTP: typeof AntInput.OTP;
} = (props) => {
  return <AntInput {...props} />
}

Input.TextArea = AntInput.TextArea
Input.Password = AntInput.Password
Input.Search = AntInput.Search
Input.OTP = AntInput.OTP

export default Input
