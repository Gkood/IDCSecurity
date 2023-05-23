//idc接口
import request from '@/utils/request'

const api:string = import.meta.env.VITE_BASE_CONEX;
//后端
export const conex_getDynamic_post = (data: any) => request({url: api + '/getDynamic', method: 'post', data})
export const conex_verify_post = (data: any) => request({url: api + '/verify', method: 'post', data})

//微信
export const weixin_access_token = (params: any) => request({url: '/sns/oauth2/access_token', method: 'get', params})
export const weixin_userinfo = (params: any) => request({url: '/sns/userinfo', method: 'get', params})
export const weixin_auth = (params: any) => request({url: '/sns/auth', method: 'get', params})
export const weixin_token = (params: any) => request({url: '/cgi-bin/token', method: 'get', params})
export const weixin_getticket = (params: any) => request({url: '/cgi-bin/ticket/getticket', method: 'get', params})
