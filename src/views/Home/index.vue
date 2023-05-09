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
                                @click="send">发送动态码
                    </van-button>
                </template>
            </van-field>
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
            <p class="mt10">您所查询的商品为首次验证</p>
            <p>商品为正品</p>
<!--            <van-icon name="warning-o" size="100" color="#F56C6C"/>-->
<!--            <p class="mt10">非首次验证</p>-->
        </div>
    </div>
</template>

<script setup lang="ts">
    import {getCurrentInstance, ref, unref, watch, computed, onMounted, nextTick} from 'vue';
    import {Notify} from 'vant';
    import wx from 'weixin-js-sdk'

    //步骤
    const step = ref(1);
    //手机号
    const phone:any = ref('')
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

    //发送动态码
    function send() {
        if(/^1[3,4,5,6,7,8,9][0-9]{9}$/.test(phone.value)){
            codeLoading.value = true;
            setTimeout(() => {
                codeLoading.value = false;
                step.value = 2;
                loop();
            }, 1000)
        }else{
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

    onMounted(()=>{
        // wx.config({
        //     debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
        //     appId: 'wxeea2ecc832d7dbb8', // 必填，公众号的唯一标识
        //     timestamp: '', // 必填，生成签名的时间戳
        //     nonceStr: '', // 必填，生成签名的随机串
        //     signature: 'b807ed06481638a813b754b1c228f58c',// 必填，签名
        //     jsApiList: [] // 必填，需要使用的JS接口列表
        // });
        //
        // wx.ready(function(){
        //     // config信息验证后会执行ready方法，所有接口调用都必须在config接口获得结果之后，config是一个客户端的异步操作，所以如果需要在页面加载时就调用相关接口，则须把相关接口放在ready函数中调用来确保正确执行。对于用户触发时才调用的接口，则可以直接调用，不需要放在ready函数中。
        //     wx.updateAppMessageShareData({
        //         title: '1', // 分享标题
        //         desc: '1', // 分享描述
        //         link: '2', // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
        //         imgUrl: '3', // 分享图标
        //         success: function () {
        //             // 设置成功
        //         }
        //     })
        // });
        //
        // wx.error(function(res:any){
        //     // config信息验证失败会执行error函数，如签名过期导致验证失败，具体错误信息可以打开config的debug模式查看，也可以在返回的res参数中查看，对于SPA可以在这里更新签名。
        //     //console.log(res)
        // });
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
            margin-top: 3rem;
            padding: 1.2rem;
        }

        .step2{
            margin-top: 4.2rem;
        }

        .step3 {
            padding: 1.2rem;
            font-size: 1.2rem;
            text-align: center;
        }
    }
</style>
