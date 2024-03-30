<script setup lang="ts">
import { remoteStreamStore } from '../stores/store'
</script>

<template>
  <div class="container">
    <div
      v-for="(video, index) in remoteStreamStore().$state.remoteStream"
      :key="index"
      :id="video.id"
      class="video-container"
    >
      <div class="username">{{ video.dataset.username }}</div>
      <video class="remoteVideo" :srcObject="video.srcObject" autoplay controls></video>
    </div>
  </div>
  <!-- <UserEntity /> -->
</template>

<style>
.container {
  display: flex;
  flex-wrap: wrap;
  padding: 15px;
}

.video-container {
  position: relative;
  width: 320px;
  height: 240px;
  max-width: 320px;
  max-height: 240px;
  margin: 15px;
}

.username {
  position: absolute;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  z-index: 1;
  width: 320px;
}

.remoteVideo {
  position: absolute;
  top: 0;
  left: 0;
  max-width: 320px;
  max-height: 240px;
}
</style>
