import axios from 'axios'

const service = axios.create({
    //baseURL: '',
    timeout: 20000
})

// Request interceptors
service.interceptors.request.use(
    (config) => {
        return config
    },
    (error) => {
        Promise.reject(error)
    }
)

// Response interceptors
service.interceptors.response.use(
    (response) => {
        let obj: any = {
            200: async () => {

            },
            401: async () => {

            },
            10500: async () => {//未知错误
            }
        }
        try {
            obj[response.data.state.code]();
        } catch (e) {

        }
        return Promise.resolve(response.data)
    },
    (error) => {
        let obj: any = {
            401: async () => {//认证失败，无法访问系统资源

            },
            403: async () => {//当前操作没有权限

            },
            10500: async () => {//未知错误

            }
        }
        try {
            obj[error.response.state.code]();
        } catch (e) {

        }
        return Promise.reject(error)
    }
)

export default service
