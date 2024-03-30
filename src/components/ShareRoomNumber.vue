<script setup lang="ts">
import { myInfoStore, currentViewStore, layoutStore } from '../stores/store'
import { onMounted } from 'vue'

// 렌더링 시 방번호 표시
const hideChatInfo = () => {
  currentViewStore().$state.currentView = 'ChatRoom'
}

onMounted(() => {
  document.getElementById('roomNumber').textContent = myInfoStore().$state.myRoomrequest
})
</script>

<template>
  <div>
    <p>!!!ShareRoomNumber.vue!!!</p>
    <button v-show="!layoutStore().$state.isDesktop" @click="hideChatInfo()">X</button>
    <div>
      <p id="roomNumber"></p>
    </div>
    <button id="shareButton" onclick="shareRoomNumber()">공유</button>
  </div>
</template>

<style></style>
