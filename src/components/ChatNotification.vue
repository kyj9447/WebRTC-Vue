<script setup lang="ts">
import { chatNotificationStore } from '../stores/store'
</script>

<template>
  <TransitionGroup name="list" tag="ul" mode="out-in">
    <li
      v-for="(message, index) in chatNotificationStore().$state.notifications"
      :key="index"
      class="noti bg-yellow-200 rounded-2xl p-2 pl-3 m-2 border border-yellow-300"
    >
      <span v-html="message.split(',', 2)[1].split(':').join(':<br/>')"></span>
    </li>
  </TransitionGroup>
</template>

<style scoped>
.list-enter-active {
  animation: slide-in 0.5s forwards;
}
.list-leave-active {
  position: absolute;
}
@keyframes slide-in {
  0% {
    opacity: 0;
    transform: translateY(100px);
  }
  100% {
    opacity: 1;
    transform: translateY(0px);
  }
}
</style>
