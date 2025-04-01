<script setup lang="ts">
import ChatLogin from './views/ChatLogin.vue'
import ChatInfo from './components/ChatInfo.vue'
import MyChat from './components/MyChat.vue'
import RemoteChats from './components/RemoteChats.vue'
import ChatNotification from './components/ChatNotification.vue'

import { currentViewStore, layoutStore } from './stores/store'

import { onMounted, onUnmounted } from 'vue'

layoutStore().$state.isDesktop = window.innerWidth / window.innerHeight > 1
onMounted(() => {
  window.addEventListener('resize', updateIsDesktop)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsDesktop)
})

function updateIsDesktop() {
  layoutStore().$state.isDesktop = window.innerWidth / window.innerHeight > 1
}

// 모바일용 ChatInfo 토글
function toggleChatInfo() {
  // ChatInfo와 ChatRoom state 전환
  currentViewStore().$state.currentView =
    currentViewStore().$state.currentView === 'ChatInfo' ? 'ChatRoom' : 'ChatInfo'

  // Chatroom에서 누르면 pip모드로 전환
  const myVideo = document.getElementById('myVideo') as HTMLVideoElement
  if (
    myVideo && // myVideo가 존재하고
    typeof myVideo.requestPictureInPicture === 'function' && // pip모드 기능이 있고
    document.pictureInPictureElement === null // 현재 페이지에 pip모드가 실행중이지 않은 경우
  ) {
    myVideo.requestPictureInPicture().then(() => {
      myVideo.play() // pip모드 실행 후 바로 재생 시작 (없으면 멈추는경우도 있음)
    })
  }

  // ChatInfo에서 누르면 pip모드 해제
  if (document.pictureInPictureElement) {
    // 현재 페이지에 pip모드가 실행중인 경우
    document.exitPictureInPicture() // pip모드 해제
  }
}
</script>

<template>
  <div class="border-black bg-zinc-100 h-full p-5 min-w-48" v-bind="$attrs">
    <!--로그인 (공통)-->
    <ChatLogin v-if="currentViewStore().$state.currentView === 'ChatLogin'" />

    <!-- 모바일 -->
    <div v-if="!layoutStore().$state.isDesktop">
      <!-- ChatRoom -->
      <Transition name="fade" mode="out-in">
        <div v-if="currentViewStore().$state.currentView === 'ChatRoom'">
          <h1 class="bg-blue-100 w-full h-10 text-2xl text-center mb-5 rounded-2xl shadow-2xl">
            WebRTC
          </h1>
          <MyChat class="w-full rounded-2xl bg-gray-200 mb-5" />
          <RemoteChats class="w-full rounded-2xl bg-slate-200 shadow-2xl" />
        </div>
      </Transition>

      <!-- ChatInfo -->
      <Transition name="slide">
        <ChatInfo
          v-if="currentViewStore().$state.currentView === 'ChatInfo'"
          class="h-full fixed right-0 bottom-0 w-full border border-gray-200 shadow-2xl bg-slate-100"
        />
      </Transition>

      <!-- ChatRoom, ChatInfo 토글 버튼 -->
      <button
        v-if="currentViewStore().$state.currentView !== 'ChatLogin'"
        class="fixed right-0 top-0 m-5 bg-slate-300 w-10 h-10 rounded-full shadow-2xl"
        @click="toggleChatInfo()"
      >
        <i class="fa-solid fa-bars text-gray-500"></i>
      </button>

      <!-- 채팅 알림 -->
      <ChatNotification
        v-if="currentViewStore().$state.currentView === 'ChatRoom'"
        class="w-1/2 fixed right-0 bottom-0"
      />
    </div>

    <!-- 데스크탑 -->
    <div
      v-if="layoutStore().$state.isDesktop && currentViewStore().$state.currentView !== 'ChatLogin'"
      class="h-full"
    >
      <div v-if="currentViewStore().$state.currentView !== 'ChatLogin'" class="flex h-full">
        <MyChat class="w-[400px] bg-gray-200" />
        <RemoteChats class="bg-slate-300" />
        <ChatInfo class="w-[400px]" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-enter-active {
  transition: all 0.5s ease;
}

.slide-leave-active {
  transition: all 0.5s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.fade-enter-active {
  transition: opacity 0.5s;
}
.fade-enter-from {
  opacity: 0;
}

.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-leave-to {
  opacity: 0;
}
</style>
