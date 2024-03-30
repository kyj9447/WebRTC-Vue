<script setup lang="ts">
import { myStreamStore } from '../stores/store'
</script>

<template>
  <div>
    <p>!!!MyChat.vue!!!</p>
    <video
      id="myVideo"
      :srcObject="myStreamStore().$state.myStream"
      class="video"
      autoplay
      controls
      autopictureinpicture
    ></video>
  </div>
</template>

<style scoped>
.video {
  width: 320px;
  height: auto;
}
</style>
