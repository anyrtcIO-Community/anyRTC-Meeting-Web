<template>
  <div class="ar-container">
    <div class="ar-meet_side ar-aside">
      <div class="ar-container is-vertical">
        <div class="ar-meet_info">
          <div class="flex info_item isHoster1">
            <span class="inof_item_label">房间号：</span>
            <input type="text" v-model="roomId" id="meetId">
            <a @click="copyID('meetId')">复制</a>
          </div>
          <div class="flex info_item">
            <span class="inof_item_label">视频源:</span>
            <select class="ar-device_select" v-model="cameraDeviceId" @change="handleCameraChange">
              <option v-for="(camera, idx) in cameraList" :key="idx" :value="camera.value">{{camera.label}}</option>
            </select>
          </div>
          <div class="flex info_item">
            <span class="inof_item_label">音频源:</span>
            <select class="ar-device_select" v-model="micphoneDeviceId" @change="handleMicponeChange">
              <option v-for="(micphone, idx) in micphoneList" :key="idx" :value="micphone.value">{{micphone.label}}</option>
            </select>
          </div>
          <div class="video info_item">
            <div class="my_video" ref="myVideoView"></div>
            <span>本地视频窗口</span>
          </div>
          <div class="video info_item" v-if="screenSharing">
            <div class="my_video" ref="myScreenView"></div>
            <span>屏幕共享窗口</span>
          </div>
        </div>
        <div class="ar-meet_log_title">日志</div>
        <div class="ar-meet_box_background"></div>
        <div class="ar-main ar-log_view" ref="logView">
          <div class="ar-meet_log" ref="logList">
            <div :class="['ar-meet_log_item', {'error': log.type === 'error'}]" v-for="(log, n) in logs" :key="n">{{log.content}}</div>
          </div>
        </div>
        <div class="ar-meet_box_background"></div>
        <!-- <input type="number" v-model="startIndex"><input type="number" v-model="endIndex"><button @click="setShow">setShow</button> -->
      </div>
    </div>
    <!--  -->
    <div class="ar-main ar-meet_view">
      <div class="ar-container is-vertical">
        <!--  -->
        <div class="ar-meet_control">
          <div class="ar-meet_control_left">
            <button class="boxShow" v-if="!screenSharing" @click="shareScreen">屏幕共享</button>
            <button class="boxShow" v-else @click="stopShareScreen">结束屏幕共享</button>
          </div>

          <div class="ar-meet_control_right">
            <!-- <input type="text" v-model="broadCastId">
            <button type="primary" @click="setBroadCast">setBroadCast</button>
            <button type="primary" @click="endBroadCast">endBroadCast</button>
            <button type="primary" @click="setTalkOnly">setTalkOnly</button>
            <button type="primary" @click="endTalkOnly">endTalkOnly</button> -->
            <button :class="videoEnable ? 'on': 'off'" style="margin-left: 5px;" hollow @click="switchVideo">视频 ： {{ videoEnable ? '开' : '关' }}</button>
            <button :class="audioEnable ? 'on': 'off'" style="margin-left: 5px;" hollow @click="switchAudio">音频 ： {{ audioEnable ? '开' : '关' }}</button>
            <button class="signOut" style="margin-left: 5px;" @click="leaveMeet">退出</button>
          </div>
        </div>
        <!--  -->
        <h3>远程视频窗口</h3>
        <!--  -->
        <div class="ar-main">
          <div class="ar-video_view" ref="videoView">
            <div class="ar-video_wrap" ref="videoWrap">
              <div class="ar-video_box" v-for="(video, n) in videoList" :key="n" :id="video.id" :style="{'width': video.width, 'height': video.height}">
                <!-- <div>{{video.id}}</div> -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import MeetMixin from '@/mixins/MeetMixin';
import ArMeet from 'ar-meet';
import getScreenStream from 'ar-share-screen';
import config from '@/config';

export default {
  data() {
    return {
      endIndex: 0,
      Meet: null,
      broadCastId: '',
      isHoster: 0,
      roomId: '',           //房间ID
      logs: [],             //日志队列
      cameraList: [],       //视频驶入设备列表
      micphoneList: [],     //音频输入设备列表
      screenSharing: false, //屏幕共享中
      cameraDeviceId: '',
      micphoneDeviceId: '',
      videoEnable: true,
      audioEnable: true,
      videoList: [],
    }
  },
  
  mixins: [MeetMixin],

  mounted() {
    let that = this;

    let Meet = new ArMeet({
      userId: 'user_' + parseInt(Math.random()*10e4),
      userData: '{}',
      meetMode: 0,//0 普通 1 主持人模式 2 ZOOM
      logLevel: 'info',
      audioMeet: false,
      autoBitrate: true,//默认true，true为根据网络状况自适应码流，false为强制指定码率
      // videoProfile: 'ARVideoProfile1080P',
    });

    Meet.configServer(config.RTC_SERVER_URL);

    that.addLog('info', '方法：initEngine：初始化');
    Meet.initAppInfo(config.APP_ID, config.APP_TOKEN);

    //加入房间成功
    Meet.on("join-success", () => {
      that.addLog('info', '回调：join-success: 加入房间成功');
      that.Meet = Meet;
      //刷新页面离开房间
      window.onbeforeunload = function(e) { //窗口关闭事件,要考虑到滚动条的宽度，一般是20px
        var event = e || window.event;
        event.returnValue = "确认是否关闭当前网页";//点击关闭的时候给提示
      }
      // 退出会议
      window.onunload = function (e) {
        Meet.leaveRTC();
      }
    });

    //加入房间失败
    Meet.on("join-failed", (code) => {
      that.addLog('error', `回调：join-failed: 加入房间失败，错误码${code}`);
    });
    
    //远程视频流打开
    Meet.on("stream-subscribed", (peerId, pubId, userData, mediaRender) => {
      that.addLog('info', `回调：stream-subscribed: 远程人员加入 ${pubId}`);
      
      that.videoList.push({
        id: "video-player_" + pubId,
        width: "100%",
        height: "100%",
        isFull: false,
      });
      
      that.$nextTick(() => {
        document.getElementById("video-player_"+pubId).appendChild(mediaRender);
        that.handleResize();
      });
    });

    //远程视频流断开
    Meet.on("stream-unsubscribed", (peerId, pubId, userData) => {
      that.addLog('info', `回调：stream-unsubscribed: 远程人员离开 ${pubId}`);
      that.videoList.map((video, index) => {
        if (video.id == "video-player_" + pubId) {
          that.videoList.splice(index, 1);
        }
      });
      that.$nextTick(() => {
        that.handleResize();
      });
    });

    //远程屏幕共享流打开
    Meet.on("exstream-subscribed", (peerId, pubId, userData, mediaRender) => {
      that.addLog('info', `exstream-subscribed: 远程屏幕共享打开`);
      console.log('屏幕共享打开', that.videoList)
      that.videoList.push({
        id: "video-player_" + pubId,
        width: "100%",
        height: "100%",
        isFull: false,
      });
      that.$nextTick(() => {
        document.getElementById("video-player_"+pubId).appendChild(mediaRender);
        that.handleResize();
      })
    });
    //远程屏幕共享流关闭
    Meet.on("exstream-unsubscribed", (peerId, pubId, userData) => {
      that.addLog('info', `回调：exstream-unsubscribed: 远程屏幕共享关闭 ${pubId}`);
      document.getElementById("video-player_" + pubId) && document.getElementById("video-player_" + pubId).remove();
      that.videoList.map((video, index) => {
        if (video.id === "video-player_" + pubId) {
          that.videoList.splice(index, 1);
        }
      });
      that.$nextTick(() => {
        that.handleResize();
      });
    });
    //打开共享通道结果
    Meet.on("share-result", (ok) => {
      that.addLog('info', `回调：share-result: 共享屏幕结果 ${ok}`);
      if (ok) {
        that.addLog('info', `获取屏幕共享流`);
        getScreenStream().then(e => {
          if (e === 'no-ready') {
            that.Meet.closeShare(0);
            alert(
            '1. 请检查是否安装"anyRTC-ScreenShare"屏幕共享插件,如果没有请点击https://chrome.google.com/webstore/detail/anyrtc-screenshare/daiabbkkhgegdmhfpocaakcgbajnkgbp?hl=zh-CN下载\n' +
            '2. 安装了屏幕共享插件，但是没有启用该插件。\n' + 
            '说明：\n火狐浏览器或谷歌版本72以上无需安装插件。\n' +
            '360、QQ平台也有对应的插件下次。');
          }
          else if (e === 'no-support') {
            that.Meet.closeShare(0);
            alert(`该浏览器不支持，请选择谷歌、火狐、QQ、360浏览器`);
            that.addLog('error', `该浏览器不支持，请选择谷歌、火狐、QQ、360浏览器`);
          }
          else if (e === "user-cancel") {
            that.Meet.closeShare(0);
            alert(`共享被取消`);
            that.addLog('error', `共享被取消`);
          }
          else if (e === "user-Denied") {
            that.Meet.closeShare(0);
            alert(`用户未授权`);
            that.addLog('error', `用户未授权`);
          }
          else {
            that.addLog('info', `获取屏幕共享流成功`);
            Meet.startScreenCap(e.stream);

            let screenView = document.createElement('div');
            screenView.id = "myScreen";
            screenView.appendChild(e.video);

            that.screenSharing = true;
            that.$nextTick(() => {
              that.$refs.myScreenView.appendChild(screenView);
            });
          }
        }).catch(err => {
          that.addLog('error', `获取屏幕共享流失败`);
          that.Meet.closeShare(0);
          throw new Error(err);
        });
      } else {
        alert('共享失败，请检查共享通道是否被占用');
        that.addLog('error', `共享失败，请检查共享通道是否被占用`);
      }
    });
    //共享被打开
    Meet.on("share-opened", (shareType, shareInfo, sharerUserId, sharerUserData) => {
      that.addLog('info', `远程打开共享通道`);
    });

    //共享被关闭
    Meet.on("share-closed", () => {
      that.addLog('info', `共享通道关闭`);
      if (that.screenSharing) {
        that.screenSharing = false;
        document.getElementById('myScreen').remove();
      }
    });
    
    //
    Meet.on("av-status", (isRemote, pubId, audioEnable, videoEnable) => {
      console.log('av-status: ', isRemote, pubId, audioEnable, videoEnable);
    });
    //
    Meet.on("audio-volume", (isRemote, pubId, audioLeval) => {
      // console.log('audio-volume: ', isRemote, pubId, audioLeval);
    });
    //
    Meet.on("network-status", (isRemote, pubId, videoBytes, ARNetQuality) => {
      // console.log('network-status: ', isRemote, pubId, videoBytes, ARNetQuality);
    });

    that.addLog('info', '方法：getDevices，获取设备列表');
    Meet.getDevices().then(deviceInfo => {
      that.cameraList = deviceInfo.videoinput;
      that.micphoneList = deviceInfo.audioinput;

      that.cameraDeviceId = that.cameraList[that.cameraList.length - 1].value;
      that.micphoneDeviceId = that.micphoneList[that.micphoneList.length - 1].value;
      
      that.addLog('info', `方法：setLocalVideoCapturer: 采集本地媒体流`);
      Meet.setLocalVideoCapturer({
      }).then(e => {
        this.$refs.myVideoView.appendChild(e.mediaRender);
        Meet.joinRTC(that.roomId);
      });
    });
  },

  methods: {
    //添加日志
    addLog(type, strLog) {
      this.logs.push({
        type: type,
        content: strLog
      });
      this.$nextTick(() => {
        let logView = this.$refs.logView.getBoundingClientRect();
        let logList = this.$refs.logList.getBoundingClientRect();
        if (logList.height > logView.height) {
          this.$refs.logView.scrollTop = (logList.height - logView.height);
        }
      });
    },
    //切换摄像头
    handleCameraChange() {
      let that = this;
      that.addLog('info', `切换摄像头`);
      that.Meet.switchDevice({
        video: {
          enabled: that.videoEnable,
          deviceId: that.cameraDeviceId
        },
        audio: {
          enabled: that.audioEnable,
          deviceId: that.micphoneDeviceId
        }
      }).then(e => {
        document.getElementById("myVideo").remove();
        let myVideo = document.createElement('div');
        myVideo.id = "myVideo";
        e.video && myVideo.appendChild(e.video);
        e.audio && myVideo.appendChild(e.audio);
        that.$refs.myVideoView.appendChild(myVideo);
      }).catch(err => {

      });
    },
    //切换麦克风
    handleMicponeChange() {
      let that = this;
      that.addLog('info', `切换麦克风`);
      that.Meet.switchDevice({
        video: {
          enabled: that.videoEnable,
          deviceId: that.cameraDeviceId
        },
        audio: {
          enabled: that.audioEnable,
          deviceId: that.micphoneDeviceId
        }
      }).then(e => {
        document.getElementById("myVideo").remove();
        let myVideo = document.createElement('div');
        myVideo.id = "myVideo";
        e.video && myVideo.appendChild(e.video);
        e.audio && myVideo.appendChild(e.audio);
        that.$refs.myVideoView.appendChild(myVideo);
      }).catch(err => {

      });
    },
    //屏幕共享
    shareScreen () {
      this.Meet && this.Meet.openShare(0);
      this.addLog('info', `方法：openShare: 开启屏幕共享`);
    },
    //结束屏幕共享
    stopShareScreen() {
      this.addLog('info', `方法：openShare: 关闭屏幕共享`);
      this.Meet && this.Meet.stopScreenCap();
    },
    //视频开关
    switchVideo() {
      let that = this;
    
      that.Meet && that.Meet.setLocalVideoEnable(that.videoEnable = !that.videoEnable);
    },
    //音频开关
    switchAudio() {
      this.Meet && this.Meet.setLocalAudioEnable(this.audioEnable = !this.audioEnable);
    },
    copyID(id){
      document.getElementById(id).select();
      document.execCommand("Copy");
    },
    leaveMeet() {
      let that = this;
      
      if (confirm('确定离开房间吗？')) {
        if (that.Meet) {
          that.Meet.leaveRTC();
          that.Meet = null;
        }
        that.$router.push('/');
      }
    },
  },
  destroyed(){
    this.Meet && (this.Meet.leaveRTC(), this.Meet = null);
  }
}
</script>

<style lang="scss">

  $videoBackground: #000;

  .ar-meet_side {
    box-shadow: 1px 0 20px 0 rgba(0,0,0,.1);
    z-index: 1;
  }

  .ar-meet_info {
    box-sizing: border-box;
    height: auto;
    padding: 25px 30px;
    padding: 20px 30px 0px;

    .my_video {
      width: 260px;
      height: 135px;
      overflow: hidden;
      background-color: $videoBackground;
    }
    .info_item {
      margin-bottom: 20px;
      height: 34px;
      line-height: 34px;
      &:last-child { margin-bottom: 0; }
      &.isHoster1{
        // margin-bottom: 20px;
        input{
          padding-left: 15px;
          font-size: 12px;
          text-align: right;
          color: #333;
          background-color: transparent;
          border: none;
          outline: none;
        }
      }
      .ar-device_select {
        outline: none;
        width: 180px;
        height: 34px;
        background:rgba(236,236,236,1);
        border-radius:4px;
        line-height: 34px;
        vertical-align: middle;
        border: none;
        box-sizing: border-box;
        padding: 0 8px;
      }

      .inof_item_label {
        font-size: 14px;
        color: #333;
      }

      &.flex {
        display: flex;
        justify-content: space-between;
      }
      &.video {
        text-align: center;
        height: auto;
        span {
          display: block;
          margin-top: 8px;
        }
      }
    }
  }
  .ar-meet_box_background{
    height: 30px; 
    background: #E5E7E9;
  }
  .ar-meet_log_title {
    height: 44px;
    line-height: 44px;
    text-align: center;
    font-size: 14px;
    color: #333;
    border-top: 1px solid #E5E7E9;
    box-sizing: border-box;
  }
  .ar-log_view {
    background-color: #E5E7E9;
    .ar-meet_log {
      padding: 0 30px;
      overflow: hidden;
      overflow-y: auto;
      width: 100%;
      box-sizing: border-box;

      .ar-meet_log_item {
        margin-bottom: 10px;
        font-size: 14px;
        line-height: 18px;
        color: #666;
        word-break: break-word;

        &.error {
          color: red;
        }
      }
    }
  }

  .ar-meet_view {
    padding: 0 20px 20px;
    background-color: #F6F6F6;
  }

  .ar-meet_control {
    margin: 17px 0 7px;
    display: flex;
    justify-content: space-between;

    button{
      outline: none;
      width:110px;
      height:34px;
      text-align: center;
      border: none;
      line-height: 34px;
      background:rgba(255,255,255,1);
      border-radius:4px;
      font-size:12px;
      margin-right: 10px;
      color:rgba(102,102,102,1);
      cursor: pointer;
      &.boxShow{
        box-shadow:0px 2px 8px 0px rgba(5,7,37,0.17);
      }
      &.on{
        border:1px solid rgba(51,177,93,1);
        color: rgba(51,177,93,1);
      }
      &.off{
        border:1px solid rgba(227,76,76,1);
        color: rgba(227,76,76,1);
      }
      &.signOut{
        background:rgba(233,74,74,1);
        color: #fff;
      }
    }
  }
  h3{
    color: #333333;
    height: 40px;
    line-height: 40px;
    font-size:16px;
    margin-bottom: 10px !important;
    font-weight:bold;
  }
  .ar-video_view {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%; 
    height: 100%;

    .ar-video_wrap {
      display: flex;
      flex-wrap: wrap;
      width: 100%; 
      height: 100%;
      overflow: hidden;
      overflow-y: auto;

      .ar-video_box {
        flex: 0 1 auto;
        box-sizing: border-box;
        overflow: hidden;
        background-color: #000;
        border-bottom: 1px solid #FFF;
        position: relative;
        &:nth-child(even) {
          border-left: 1px solid #fff;
        }
        span{
          position: absolute;
          top: 10px;
          display: inline-block;
          width:100px;
          height:32px;
          line-height:32px;
          font-size:12px;
          color:rgba(255,255,255,1);
          text-align: center;
          background:rgba(29,34,40, .6);
          border-radius:4px;
          z-index: 1;
          cursor: pointer;
          &.full-screen{
            left: 20px;
          }
          &.AR-code{
            right: 20px;
          }
        }
      }
    }
  }
  ::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  }
  ::-webkit-scrollbar-track {
  background-color: transparent;
  }
  ::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.2);
  background-color: #DDD;
  }
</style>