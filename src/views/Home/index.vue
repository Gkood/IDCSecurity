<template>
    <div class="home">
        <div class="h-logo">
            <img src="/src/assets/idc.png">
        </div>
        <div class="step1" v-if="step==1">
            <van-field
                    v-model="phone"
                    center
                    clearable
                    type="number"
                    label="手机号"
                    placeholder="请输入手机号">
                <template #button>
                    <van-button size="small"
                                type="primary"
                                :loading="codeLoading"
                                loading-text="发送中..."
                                @click="send">获取动态码
                    </van-button>
                </template>
            </van-field>
            <div>{{location}}</div>
            <div>{{locationIp}}</div>
            {{result}}
        </div>
        <div class="step2" v-if="step==2">
            <van-password-input
                    :value="code"
                    :mask="false"
                    :focused="showKeyboard"
                    :info="codeInfo"
                    @focus="showKeyboard = true"/>
            <van-number-keyboard
                    v-model="code"
                    maxlength="6"
                    :show="showKeyboard"
                    @blur="showKeyboard = false"/>
        </div>
        <div class="step3" v-if="step==3">
            <van-icon name="passed" size="100" color="#67C23A"/>
            <!--            <p class="mt10">您所查询的商品为首次验证</p>-->
            <p class="mt10">商品为正品</p>
            <!--            <van-icon name="warning-o" size="100" color="#F56C6C"/>-->
            <!--            <p class="mt10">非首次验证</p>-->
        </div>
    </div>
</template>

<script setup lang="ts">
    import {getCurrentInstance, ref, unref, watch, computed, onMounted, nextTick} from 'vue';
    import {Notify} from 'vant';
    //@ts-ignore
    import wx from 'weixin-js-sdk'
    import {idc} from "@/api";
    import {getCookie, setCookie} from '@/utils/cookies'
    import m from 'moment';
    //@ts-ignore
    import sha1 from 'sha1'

    const that = (getCurrentInstance() as any).proxy;
    //步骤
    const step = ref(1);
    //手机号
    const phone: any = ref('')
    //动态码
    const code = ref('');
    const codeLoading = ref(false)
    const codeInfo = ref('')

    const showKeyboard = ref(true)

    //计时器
    const time: number = 179
    const loopTime: number = 1000;
    const setTime: any = ref(null)


    watch(
        () => {
            return code
        },
        (v: any) => {
            nextTick(() => {
                if (v.value.length == 6) {
                    if (v.value == '123456') {
                        step3();
                    } else {
                        Notify({type: 'danger', message: '动态码有误', duration: 3000});
                    }
                }
            })
        },
        {deep: true}
    )

    //微信授权
    const weixin = ref({
        appid: 'wx6bb1791a5ba66248',
        appsecret: '9efad0285cdae9021bc9a6a21e7b0923',
        code: '',
        access_token: '',
        openid: '',
        time: '',
        diffTime: 7200
    })

    const cgi = ref({
        access_token: '',
        jsapi_ticket: '',
        time: '',
        diffTime: 7200
    })

    //读取本地缓存
    async function cookies() {
        getCookie('weixin') ? (weixin.value = JSON.parse(getCookie('weixin'))) : null
        getCookie('cgi') ? (cgi.value = JSON.parse(getCookie('cgi'))) : null
        //console.log(weixin.value, cgi.value)
    }

    //判断微信access_token是否失效
    async function isWxToken() {
        if (weixin.value.access_token) {
            const time2 = m(weixin.value.time).format();
            const diff = m().diff(time2, 'second');
            //console.log(diff)
            if (diff < weixin.value.diffTime) {

            } else {
                await getWxCode()
            }
        } else {
            await getWxCode()
        }
    }

    //获取微信基本信息
    async function getWxCode() {
        weixin.value.code = that.$route.query.code
        idc.weixin_access_token({
            appid: weixin.value.appid,
            secret: weixin.value.appsecret,
            code: weixin.value.code,
            grant_type: 'authorization_code'
        }).then(async (data: any) => {
            if (data.access_token) {
                weixin.value.access_token = data.access_token;
                weixin.value.openid = data.openid
                weixin.value.time = m().format()
                setCookie('weixin', JSON.stringify(weixin.value))
            }

            //获取用户信息
            // idc.weixin_userinfo({
            //     access_token: weixin.value.access_token,
            //     openid: weixin.value.openid,
            //     lang: 'zh_CN'
            // }).then((data: any) => {
            //     console.log(data)
            // })
        })
    }

    //判断cgi access_token是否失效
    async function isCgiToken() {
        if (cgi.value.access_token) {
            const time2 = m(cgi.value.time).format();
            const diff = m().diff(time2, 'second');
            if (diff < cgi.value.diffTime) {
                await getCgiSign()
            } else {
                await getCgiToken()
            }
        } else {
            await getCgiToken()
        }
    }

    //获取cgi token
    async function getCgiToken() {
        idc.weixin_token({
            grant_type: 'client_credential',
            appid: weixin.value.appid,
            secret: weixin.value.appsecret
        }).then(async (data: any) => {
            cgi.value.access_token = data.access_token
            cgi.value.time = m().format()
            await getCgiTicket();
        })
    }

    //获取cgi jsapi_ticket
    async function getCgiTicket() {
        idc.weixin_getticket({
            access_token: cgi.value.access_token,
            type: 'jsapi',
        }).then((data: any) => {
            cgi.value.jsapi_ticket = data.ticket;
            setCookie('cgi', JSON.stringify(cgi.value))
            getCgiSign();
        })
    }

    //生成签名
    const sign = ref({
        noncestr: '',
        timestamp: m().format('X'),
        url: self.location.href.split('#')[0],
        signature: ''
    })

    //随机生成字符串
    async function getRandomString(len:number){
        let _charStr = 'abacdefghjklmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ0123456789',
            min = 0,
            max = _charStr.length-1,
            _str = '';                    //定义随机字符串 变量
        //判断是否指定长度，否则默认长度为15
        len = len || 15;
        //循环生成字符串
        for(var i = 0, index; i < len; i++){
            index = (function(randomIndexFunc, i){
                return randomIndexFunc(min, max, i, randomIndexFunc);
            })(function(min:any, max:any, i:any, _self:any){
                let indexTemp = Math.floor(Math.random()*(max-min+1)+min),
                    numStart = _charStr.length - 10;
                if(i==0&&indexTemp >=numStart){
                    indexTemp = _self(min, max, i, _self);
                }
                return indexTemp ;
            }, i);
            _str += _charStr[index];
        }
        return _str;
    }

    async function getCgiSign() {
        sign.value.noncestr = await getRandomString(16);
        let json: string = 'jsapi_ticket=' + cgi.value.jsapi_ticket + '&noncestr=' + sign.value.noncestr + '&timestamp=' + sign.value.timestamp + '&url=' + sign.value.url
        sign.value.signature = sha1(json)
        //console.log(json)
        await wxInit();
    }

    //初始化微信授权
    const result = ref('')
    async function wxInit() {
        //console.log(cgi.value, sign.value)
        wx.config({
            debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
            appId: weixin.value.appid, // 必填，公众号的唯一标识
            timestamp: sign.value.timestamp, // 必填，生成签名的时间戳
            nonceStr: sign.value.noncestr, // 必填，生成签名的随机串
            signature: sign.value.signature,// 必填，签名
            jsApiList: ['scanQRCode','getLocation'] // 必填，需要使用的JS接口列表
        });

        wx.ready(function(){
            // wx.scanQRCode({
            //     needResult: 1, // 默认为0，扫描结果由微信处理，1则直接返回扫描结果，
            //     scanType: ["qrCode","barCode"], // 可以指定扫二维码还是一维码，默认二者都有
            //     success: function (res:any) {
            //         result.value = res.resultStr; // 当needResult 为 1 时，扫码返回的结果
            //     }
            // });

            wx.getLocation({
                type: 'wgs84', // 默认为wgs84的gps坐标，如果要返回直接给openLocation用的火星坐标，可传入'gcj02'
                success: function (res:any) {
                    console.log(res)
                    location.value = res
                }
            });


        });
        //
        // wx.error(function(res:any){
        //     // config信息验证失败会执行error函数，如签名过期导致验证失败，具体错误信息可以打开config的debug模式查看，也可以在返回的res参数中查看，对于SPA可以在这里更新签名。
        //     console.log(res)
        // });
    }

    //发送动态码
    function send() {
        if (/^1[3,4,5,6,7,8,9][0-9]{9}$/.test(phone.value)) {
            codeLoading.value = true;
            setTimeout(() => {
                codeLoading.value = false;
                step.value = 2;
                loop();
            }, 1000)
        } else {
            Notify({type: 'danger', message: '手机号格式错误', duration: 3000});
        }
    }

    //验证结果
    function step3() {
        setTimeout(() => {
            clear();
            step.value = 3;
        }, 500)
    }

    //计时器
    function loop() {
        let t = time;
        codeInfo.value = t + '秒'
        setTime.value = setInterval(() => {
            if (t > 0) {
                codeInfo.value = (t--) + '秒'
            } else {
                step.value = 1;
                clear();
            }
        }, loopTime)
    }

    //清空计时器
    function clear() {
        clearInterval(setTime.value)
        setTime.value = null;
        codeInfo.value = '';
    }

    const location = ref('')
    const locationIp = ref('')

    //定位
    function getLocation() {
        //IP地址定位
        // @ts-ignore
        new BMapGL.LocalCity().get((result: any) => {
            // @ts-ignore
            new BMapGL.Geocoder().getLocation(new BMapGL.Point(result.center.lng, result.center.lat), function (result: any) {
                if (result) {
                    //console.log(result)
                    locationIp.value = result.address;
                }
            });
        });

        //浏览器定位
        // @ts-ignore
        let geolocation = new BMapGL.Geolocation();
        // 开启SDK辅助定位
        geolocation.enableSDKLocation();
        geolocation.getCurrentPosition(function (r: any) {
            let address = r.address.country + r.address.province + r.address.city + r.address.district + r.address.street + r.address.street_number
            //console.log(r, address)
            location.value = address;
        });
    }

    onMounted(async () => {
        await cookies();
        await isWxToken();
        await isCgiToken();
    })


</script>

<style scoped lang="scss">
    .home {
        width: 100%;
        height: 100%;
        background-color: #f7f8fa;

        .h-logo {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 5rem 0 2rem 0;

            img {
                width: 12rem;
            }
        }

        .step1 {
            padding: 1.2rem;

            ::v-deep .van-field {
                .van-cell__title {
                    width: 3.2em;
                }
            }
        }

        .step2 {
            margin-top: 1rem;
        }

        .step3 {
            padding: 1.2rem;
            font-size: 1.2rem;
            text-align: center;
        }
    }
</style>
