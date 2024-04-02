<script setup lang="ts">
import { remoteStreamStore } from '../stores/store'
</script>

<template>
  <div class="grid grid-cols-2 gap-0 items-center h-full justify-between overflow-auto w-full">
    <div
      v-for="(video, index) in remoteStreamStore().$state.remoteStream"
      :key="index"
      :id="video.id"
      class="video m-5 relative w-4/5 bg-white rounded-2xl shadow-2xl overflow-hidden"
    >
      <video :srcObject="video.srcObject" autoplay class="m-auto shadow-2xl max-h-52"></video>
      <div class="absolute top-0 left-0 bg-black text-white w-full opacity-50 pl-2">
        {{ video.dataset.username }}
      </div>
    </div>
  </div>
</template>

<style scoped></style>
