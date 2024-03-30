<script setup lang="ts">
import ChatLogin from './views/ChatLogin.vue'
import ChatRoom from './views/ChatRoom.vue'
import ChatInfo from './views/ChatInfo.vue'

import { currentViewStore, layoutStore } from './stores/store'

import { onMounted, onUnmounted } from 'vue'

layoutStore().$state.isDesktop = window.innerWidth >= 768
onMounted(() => {
  window.addEventListener('resize', updateIsDesktop)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsDesktop)
})

function updateIsDesktop() {
  layoutStore().$state.isDesktop = window.innerWidth >= 768
}
</script>

<template>
  <p>!!!App.vue!!!</p>
  <!-- 모바일 -->
  <div v-if="!layoutStore().$state.isDesktop" class="chat-container">
    <ChatLogin v-if="currentViewStore().$state.currentView === 'ChatLogin'" />
    <ChatRoom v-if="currentViewStore().$state.currentView === 'ChatRoom'" />
    <ChatInfo v-if="currentViewStore().$state.currentView === 'ChatInfo'" />
  </div>

  <!-- 데스크탑 -->
  <div v-if="layoutStore().$state.isDesktop" class="chat-container">
    <ChatLogin v-if="currentViewStore().$state.currentView === 'ChatLogin'" />
    <div v-if="currentViewStore().$state.currentView === 'ChatRoom'" class="ChatDesktop">
      <ChatRoom class="ChatRoom" />
      <ChatInfo class="ChatInfo" />
    </div>
  </div>
</template>

<style scoped>
.ChatDesktop {
  display: flex;
  flex-direction: row;
}
.ChatDesktop > .ChatRoom {
  display: flex;
  width: 80%;
}
.ChatDesktop > .ChatInfo {
  width: 250px;
}
</style>
