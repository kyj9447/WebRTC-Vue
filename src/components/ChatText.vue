<script setup lang="ts">
import { chatStore } from '../stores/store'

</script>
<template>
  <div>
    <p>!!!ChatText.vue!!!</p>
    <ul id="ChatList">
      <li>Chat Message 1</li>
      <li>Chat Message 2</li>
      <li>Chat Message 3</li>
      <li v-for="(chat, index) in chatStore().$state.chatList" 
      :key="index"
      :style="chat.split(',', 2)[0] === 'true' ? { color: 'blue' } : { color: 'black' }">
      {{ chat.split(',', 2)[1] }}</li>
    </ul>
    <br/>
    <input type="text" id="chatInput" name="chatInput" placeholder="채팅 입력" style="width: 320" />
    <button id="sendButton" onclick="sendChat(event)">전송</button>
  </div>
</template>

<style></style>
