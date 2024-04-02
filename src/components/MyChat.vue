<script setup lang="ts">
import { myStreamStore } from '../stores/store'
</script>

<template>
  <div class="flex items-center justify-center w-[640px] mr-auto p-5 rounded-l-2xl shadow-2xl">
    <video
      id="myVideo"
      :srcObject="myStreamStore().$state.myStream"
      autoplay
      autopictureinpicture
      class="rounded-2xl shadow-2xl"
    ></video>
  </div>
</template>

<style scoped>
#myVideo {
  width: 320px;
  height: 240px;
}
</style>
