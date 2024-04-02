<script setup lang="ts">
import { myInfoStore } from '../stores/store'
import { onMounted } from 'vue'
import { shareRoomNumber } from './WebRTC'

// 렌더링 시 방번호 표시
onMounted(() => {
  const roomNumber = document.getElementById('roomNumber') as HTMLElement
  roomNumber.textContent = myInfoStore().$state.myRoomrequest
})
</script>

<template>
  <p class="text-center text-4xl mb-5">Chat Info</p>
  <div>
    <p id="roomNumber" class="overflow-auto max-h-16 text-sm p-1 mb-1 border border-gray-500"></p>
  </div>
  <button
    id="shareButton"
    @click.prevent="shareRoomNumber"
    class="text-sm bg-teal-500 text-white rounded-full h-12"
  >
    공유 <i class="fas fa-share"></i>
  </button>
</template>

<style></style>
