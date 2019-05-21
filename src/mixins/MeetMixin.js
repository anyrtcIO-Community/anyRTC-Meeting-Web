export default {
  data() {
    return {
      
    }
  },

  created() {
    if (JSON.stringify(this.$route.params) === "{}") {
      this.$router.push('/');
    } else {
      this.roomId = this.$route.params.roomId;
      this.isHoster = this.$route.params.isHoster || 0;
    }
  },

  mounted() {
    let that = this;
    that.handleResize();
    window.addEventListener('resize', that.handleResize, false);
  },

  methods: {
    handleResize(e) {
      let that = this;
      let videos = document.querySelectorAll('.ar-video_box');
      if (videos.length === 0) return;
      let videoArray = Array.prototype.slice.call(videos);
      let videoRect = that.$refs.videoView.getBoundingClientRect();
      let optimumWidth = 0;
      let optimumHeight = 0;
      let currentWidth = videoRect.width;
      let currentHeight = videoRect.height;
      //videoView最佳视图以当前的宽度计算
      if (parseInt(currentWidth * 9 / 16) < currentHeight) {
        optimumWidth = currentWidth;
        optimumHeight = parseInt(currentWidth * 9 / 16);
      }
      //最佳视图以当前的高度计算
      else {
        optimumWidth = parseInt(currentHeight * 16 / 9);
        optimumHeight = currentHeight;
      }
      that.$refs.videoWrap.style.width = optimumWidth + 'px';
      that.$refs.videoWrap.style.height = optimumHeight + 'px';

      
      if (videoArray.length > 1) {
        videoArray.map(item => {
          item.style.width = "50%";
          item.style.height = "50%";
        });
      }
      else {
        videos[0].style.width = optimumWidth + 'px';
        videos[0].style.height = optimumHeight + 'px';
      }
    }
  },

  destroyed() {
    window.removeEventListener('resize', this.handleResize, false);
    window.onbeforeunload = null;
    window.onunload = null;
  },
}