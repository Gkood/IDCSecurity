import {fileURLToPath, URL} from 'node:url'

import {defineConfig, loadEnv} from 'vite'
import legacy from '@vitejs/plugin-legacy'
import vue2 from '@vitejs/plugin-vue2'
import vue2Jsx from '@vitejs/plugin-vue2-jsx'
import requireTransform from 'vite-plugin-require-transform';

// https://vitejs.dev/config/
export default ({mode}: any) => {
    const env = loadEnv(mode, process.cwd());
    return defineConfig({
        server: {
            https: false, //(使用https)启用 TLS + HTTP/2。注意：当 server.proxy 选项 也被使用时，将会仅使用 TLS
            host: true, // 监听所有地址
            port: 80, //指定开发服务器端口：默认3000
            open: false, //启动时自动在浏览器中打开
            cors: false, //为开发服务器配置 CORS
            proxy: {
                //配置自定义代理规则
                [env.VITE_BASE_CONEX]: {
                    target: env.VITE_PATH_CONEX,
                    changeOrigin: true, //是否跨域
                    rewrite: path => path.replace(/^\/api/, '')
                },
                [env.VITE_BASE_SNS]: {
                    target: env.VITE_PATH_SNS,
                    changeOrigin: true, //是否跨域
                    rewrite: path => path.replace(/^\/api/, '')
                },
                [env.VITE_BASE_CGI]: {
                    target: env.VITE_PATH_SNS,
                    changeOrigin: true, //是否跨域
                    rewrite: path => path.replace(/^\/api/, '')
                },
                [env.VITE_BASE_CGI]: {
                    target: env.VITE_PATH_SNS,
                    changeOrigin: true, //是否跨域
                    rewrite: path => path.replace(/^\/api/, '')
                }
            }
        },
        plugins: [
            vue2(),
            vue2Jsx(),
            legacy({
                targets: ['ie >= 11'],
                additionalLegacyPolyfills: ['regenerator-runtime/runtime']
            }),
            requireTransform({
                fileRegex:/.ts$|.tsx$|.vue$/
            })
        ],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        },
        css: {
            preprocessorOptions: {
                scss: {
                    additionalData: '@import "@/style/_variables.scss";'
                }
            }
        },
        define: {'process.env': {}},
        base: env.VITE_BASE_URL
    })
}
