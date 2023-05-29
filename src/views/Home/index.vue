<template>
    <div class="home" v-if="weixin.code">
        <div class="h-logo">
            <img src="/src/assets/idc.png">
        </div>
        <label style="position: fixed;top: 1px">
            <!--            {{security}}-->
        </label>
        <div class="step1" v-if="step==1">
            <van-field
                    v-model="security.phone"
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
        </div>
        <div class="step2" v-if="step==2">
            {{codeTrue}}
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
            <div class="load" v-if="showLoad">
                <van-loading size="24px">验证中，请稍后...</van-loading>
            </div>
        </div>
        <div class="step3" v-if="step==3">
            <template v-if="isCertified">
                <div class="certified">
                    <van-icon name="passed" size="100" color="#67C23A"/>
                    <p class="mt10">商品为正品</p>
                    <p class="cx">第 <label>{{number}}</label> 次查询</p>
                </div>
                <div class="info">
                    <van-divider>产品订单信息</van-divider>
                    <van-cell-group inset>
                        <van-cell title="订单号" value="400039283882"/>
                        <van-cell title="买方" value="浙江XXXXX有限公司"/>
                        <van-cell title="卖方" value="浙江班尼戈流体控制有限公司"/>
                        <van-cell title="追溯号" value="bng2023102232433"/>
                    </van-cell-group>
                </div>
                <div class="info">
                    <van-divider>产品资料</van-divider>
                    <van-cell-group inset>
                        <van-cell title="安装视频" is-link url="https://www.baidu.com"/>
                        <van-cell title="说明书" is-link url="https://www.baidu.com"/>
                    </van-cell-group>
                </div>
            </template>
            <template v-else>
                <div class="certified">
                    <van-icon name="warning-o" size="100" color="#F56C6C"/>
                    <p class="mt10">商品为仿品</p>
                    <p class="cx">您可点击下方 <label>热线</label> 或 <label>客诉</label> 咨询</p>
                </div>
            </template>

            <div class="comp">
                <van-button type="primary" icon="phone-o" url="tel:4001001000">热线 400-100-10000</van-button>
                <van-button type="primary" icon="comment-o" url="https://www.baidu.com" class="ml10">客诉</van-button>
            </div>
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

    //动态码
    const code = ref('')
    const codeTrue = ref('');
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
                security.value.erCode = v.value;
                if (v.value.length == 6) {
                    if (v.value == codeTrue.value) {
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
    }

    //判断微信access_token是否失效
    async function isWxToken() {
        if (weixin.value.access_token) {
            const time2 = m(weixin.value.time).format();
            const diff = m().diff(time2, 'second');
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
    async function getRandomString(len: number) {
        let _charStr = 'abacdefghjklmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ0123456789',
            min = 0,
            max = _charStr.length - 1,
            _str = '';                    //定义随机字符串 变量
        //判断是否指定长度，否则默认长度为15
        len = len || 15;
        //循环生成字符串
        for (var i = 0, index; i < len; i++) {
            index = (function (randomIndexFunc, i) {
                return randomIndexFunc(min, max, i, randomIndexFunc);
            })(function (min: any, max: any, i: any, _self: any) {
                let indexTemp = Math.floor(Math.random() * (max - min + 1) + min),
                    numStart = _charStr.length - 10;
                if (i == 0 && indexTemp >= numStart) {
                    indexTemp = _self(min, max, i, _self);
                }
                return indexTemp;
            }, i);
            _str += _charStr[index];
        }
        return _str;
    }

    async function getCgiSign() {
        sign.value.noncestr = await getRandomString(16);
        let json: string = 'jsapi_ticket=' + cgi.value.jsapi_ticket + '&noncestr=' + sign.value.noncestr + '&timestamp=' + sign.value.timestamp + '&url=' + sign.value.url
        sign.value.signature = sha1(json)
        await wxInit();
    }

    //初始化微信授权
    async function wxInit() {
        //console.log(cgi.value, sign.value)
        wx.config({
            debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
            appId: weixin.value.appid, // 必填，公众号的唯一标识
            timestamp: sign.value.timestamp, // 必填，生成签名的时间戳
            nonceStr: sign.value.noncestr, // 必填，生成签名的随机串
            signature: sign.value.signature,// 必填，签名
            jsApiList: ['scanQRCode', 'getLocation'] // 必填，需要使用的JS接口列表
        });

        wx.ready(function () {
            if (that.$route.query.state === 'STATE') {
                wx.scanQRCode({
                    needResult: 1, // 默认为0，扫描结果由微信处理，1则直接返回扫描结果，
                    scanType: ["qrCode", "barCode"], // 可以指定扫二维码还是一维码，默认二者都有
                    success: function (res: any) {
                        security.value.batch = (res.resultStr).split('batch=')[1]; // 当needResult 为 1 时，扫码返回的结果
                    }
                });
            } else {
                security.value.batch = that.$route.query.state;
            }

            wx.getLocation({
                type: 'wgs84', // 默认为wgs84的gps坐标，如果要返回直接给openLocation用的火星坐标，可传入'gcj02'
                success: function (res: any) {
                    security.value.latitude = res.latitude;
                    security.value.longitude = res.longitude;
                    //@ts-ignore
                    let geocoder = new TMap.service.Geocoder();
                    //@ts-ignore
                    let location = new TMap.LatLng(res.latitude, res.longitude);
                    geocoder.getAddress({location: location}).then((result: any) => {
                        security.value.address = result.result.address
                    });
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
        if (/^1[3,4,5,6,7,8,9][0-9]{9}$/.test(security.value.phone)) {
            codeLoading.value = true;
            idc.conex_getDynamic_post({
                phone: security.value.phone,
                batch: security.value.batch,
                longitude: security.value.longitude,
                latitude: security.value.latitude,
                address: security.value.address,
            }).then((data: any) => {
                if (data.state.code == '200') {
                    codeTrue.value = data.state.msg;
                    step.value = 2;
                    loop();
                    codeLoading.value = false;
                }
            }).finally(() => {
                codeLoading.value = false;
            })
        } else {
            Notify({type: 'danger', message: '手机号格式错误', duration: 3000});
        }
    }

    const isCertified = ref(true)
    const number = ref('')
    const showLoad = ref(false)

    //验证结果
    function step3() {
        showLoad.value = true
        showKeyboard.value = false
        clear();
        idc.conex_verify_post({
            field: security.value.erCode,
        }).then((data: any) => {
            step.value = 3;
            showLoad.value = false
            if (data.state.code == '200') {
                isCertified.value = true
                number.value = data.state.msg;
            } else {
                isCertified.value = false
            }
        }).finally(() => {
            showLoad.value = false
        })
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

    const security = ref({
        batch: '',
        latitude: '',
        longitude: '',
        address: '',
        phone: '',
        erCode: ''
    })

    //初始化判断入口
    async function init() {
        if (that.$route.query.batch) {
            //直接扫一扫跳转
            window.location.href = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx6bb1791a5ba66248&redirect_uri=http%3A%2F%2F192.168.137.1&response_type=code&scope=snsapi_userinfo&state=' + that.$route.query.batch + '#wechat_redirect'
        } else {
            //微信公众号
            await cookies();
            await isWxToken();
            await isCgiToken();
        }
    }

    onMounted(async () => {
        await init();
    })


</script>

<style scoped lang="scss">
    .home {
        width: 100%;
        height: 100%;
        background-color: #f7f8fa;
        overflow: scroll;

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

            .load {
                text-align: center;
                margin-top: 1rem;
            }
        }

        .step3 {
            font-size: 1.2rem;
            padding-bottom: 10rem;

            .certified {
                text-align: center;

                .cx {
                    margin-top: 10px;
                    font-size: 1rem;

                    label {
                        color: $primary;
                    }
                }
            }

            .info {
                margin-top: 10px;

                ::v-deep .van-cell {
                    .van-cell__title {
                        flex: auto;
                    }

                    .van-cell__value {

                        flex: auto;
                    }
                }
            }

            .comp {
                width: 100%;
                padding: .5rem 1rem;
                position: fixed;
                left: 0;
                bottom: 0;
                background-color: $white;
                border-top: .5px solid #ebedf0;
                text-align: center;
            }
        }
    }
</style>
