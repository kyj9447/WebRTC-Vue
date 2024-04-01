<script setup lang="ts">
import LoginForm from '../components/LoginForm.vue'
import { myStreamStore } from '../stores/store'
</script>

<template>
  <div class="flex items-center justify-center h-full">
    <div class="max-w-xs m-auto">
      <h1 style="font-size: 40px; text-align: center" class="mb-10">WebRTC Chat</h1>
      <div class="flex items-center justify-center">
        <video
          id="myVideo"
          :srcObject="myStreamStore().$state.myStream"
          autoplay
          autopictureinpicture
          class="mb-10 rounded-2xl shadow-2xl"
        ></video>
      </div>
      <LoginForm />
    </div>
  </div>
</template>

<style scoped></style>
