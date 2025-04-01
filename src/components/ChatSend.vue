<script setup lang="ts">
import { sendChat } from '../components/WebRTC'
</script>

<template>
  <input
    type="text"
    id="chatInput"
    name="chatInput"
    placeholder="채팅 입력"
    class="overflow-auto h-12 max-h-96 border border-black mb-1 p-2"
    @keyup.enter="sendChat($event)"
  />
  <button
    id="sendButton"
    @click="sendChat($event)"
    class="text-sm bg-teal-600 text-white rounded-full h-12"
  >
    보내기 <i class="fa-regular fa-paper-plane"></i>
  </button>
</template>

<style scoped></style>
