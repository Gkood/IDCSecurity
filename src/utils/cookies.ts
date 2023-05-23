import Cookies from 'js-cookie'

export const getCookie:any = (key:any) => Cookies.get(key)
export const setCookie:any = (key:any,value: any) => Cookies.set(key, value)


