<script setup lang="ts">
import ChatText from '../components/ChatText.vue'
import ChatSend from '../components/ChatSend.vue'
import ShareRoomNumber from '../components/ShareRoomNumber.vue'
</script>

<template>
  <div class="flex flex-col justify-between h-full p-5">
    <ShareRoomNumber class="mt-12" />
    <ChatText class="flex-grow mt-5 mb-5 h-full overflow-auto" />
    <ChatSend class="mb-12" />
  </div>
</template>

<style scoped>
.viewname {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  pointer-events: none;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 5px;
}
</style>
