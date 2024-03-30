<script setup lang="ts">
import RemoteChats from '../components/RemoteChats.vue'
import MyChat from '../components/MyChat.vue'
import { currentViewStore, layoutStore } from '../stores/store'

// 채팅정보 보이기
const showChatInfo = () => {
  // pip모드로 전환
  const myVideo = document.getElementById('myVideo') as HTMLVideoElement
  if (myVideo && typeof myVideo.requestPictureInPicture === 'function') {
    myVideo.requestPictureInPicture().then(() => {
      myVideo.play()
    })
  }
  // 뷰 전환
  currentViewStore().$state.currentView = 'ChatInfo'
}

// 렌더링시 pip모드인 경우 (ChatInfo에서 돌아올경우) pip모드 해제
if (document.pictureInPictureElement) {
  document.exitPictureInPicture()
}
</script>

<template>
  <div>
    <button v-show="!layoutStore().$state.isDesktop" @click="showChatInfo()">i</button>
    <MyChat/>
    <RemoteChats/>
  </div>
</template>

<style scoped>
</style>
