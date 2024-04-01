<script setup lang="ts">
import { chatStore } from '../stores/store'
</script>

<template>
  <div class="w-full border border-gray-500  ">
    <ul class="ChatList max-w-full overflow-auto">
      <li class="bg-gray-200 border border-gray-300">Chat Message 1</li>
      <li class="bg-gray-200 border border-gray-300">Chat Message 2</li>
      <li class="bg-gray-200 border border-gray-300">Chat Message 3</li>
      <li
        v-for="(chat, index) in chatStore().$state.chatList"
        :key="index"
        :style="chat.split(',', 2)[0] === 'true' ? { color: 'blue' } : { color: 'black' }"
        class="animate-grow bg-gray-200 border border-gray-300"
      >
        {{ chat.split(',', 2)[1] }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
@keyframes grow {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(0);
  }
}

li.animate-grow {
  animation: grow 0.3s ease;
}

ul {
  padding-bottom: 200px;
}

li {
  border-radius: 0.5rem;
  padding: 5px;
  word-break: break-all;
  margin: 5px
}
</style>
