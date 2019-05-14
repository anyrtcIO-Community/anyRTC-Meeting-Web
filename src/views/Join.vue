<template>
  <div class="ar-container" id="app">
    <div class="ar-main">
      <div class="meet-bg">

      </div>
      <div class="meet-form">
        <div class="meet-form_title">anyRTC多人音视频效果演示</div>
        <input type="text" v-model="roomId" class="meet-form_iput" autocomplete="off" placeholder="请输入房间号" @keyup.13="joinMeet">
        <button type="button" class="meet-form_submit" @click="joinMeet">加入会议</button>
      </div>
      <div class="meet-footer">
        <div class="meet-footer_item">v3.0.0</div>
        <div class="meet-footer_item">技术支持：<a href="">zhangjianqiang@dync.cc</a></div>
        <div class="meet-footer_item">anyRTC官网：<a href="https://www.anyrtc.io" target="_blank">www.anyrtc.io</a></div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'ArMeeting',
    data() {
      return {
        roomId: '',
      }
    },
    watch: {
      roomId(val, oVal) {
        if (val) {
          let reg = /^[a-z0-9]+$/i;
          if (reg.test(val)) {

          } else {
            this.roomId = oVal;
          }
        }
      }
    },
    methods: {
      joinMeet() {
        if (this.roomId) {
          this.$router.push({
            path: `/meet/${this.roomId}`
          })
        }
        else {
          alert('请输入房间号');
        }
      }
    },
  };
</script>

<style lang="scss">
  .meet-bg {
    z-index: -1;
    width: 100%;
    height: 100%;
    object-fit: cover;
    background-image: url('../assets/img/bg.jpg');
  }

  .meet-form {
    position: fixed;
    padding: 0 80px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width:520px;
    height:360px;
    background:rgba(255,255,255,1);
    box-shadow:0px 8px 21px 0px rgba(102,138,255,0.18);
    border-radius:10px;
    box-sizing: border-box;
    z-index: 1;

    .meet-form_title {
      margin-top: 70px;
      margin-bottom: 60px;
      font-size:24px;
      font-family:PingFang-SC-Bold;
      font-weight:bold;
      color:#555;
      line-height:24px;
      text-align: center;
    }

    .meet-form_iput {
      display: block;
      padding: 0 20px;
      width: 100%;
      height: 50px;
      background:rgba(255,255,255,0.3);
      border:1px solid rgba(221,221,221,1);
      border-radius:4px;
      font-size: 14px;
      outline: none;
      box-sizing: border-box;
    }

    .meet-form_submit {
      margin-top: 40px;
      display: block;
      width: 100%;
      height:50px;
      background:rgba(51,177,93,1);
      border-radius:4px;
      outline: none;
      border: none;
      color: #fff;
      cursor: pointer;
    }
  }

  .meet-footer {
    position: fixed;
    width: 100%;
    bottom: 0;
    text-align: center;
    
    .meet-footer_item {
      margin-bottom: 5px;
      font-size: 12px;
      color: #777;
    }

  }
</style>