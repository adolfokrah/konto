// Type declaration for react-dojah package
declare module 'react-dojah' {
  import { ComponentType } from 'react'

  interface DojahProps {
    response: (type: string, data: any) => void
    appID: string
    publicKey: string
    type: string
    config: {
      widget_id: string
    }
    userData?: {
      first_name?: string
      last_name?: string
      dob?: string
      residence_country?: string
      email?: string
    }
    govData?: {
      nin?: string
      bvn?: string
      dl?: string
      mobile?: string
    }
    metadata?: {
      user_id?: string
      [key: string]: any
    }
  }

  const Dojah: ComponentType<DojahProps>
  export default Dojah
}
