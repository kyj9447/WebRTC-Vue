<script setup lang="ts">
import { chatNotificationStore } from '../stores/store'
</script>

<template>
  <TransitionGroup name="list" tag="ul" mode="in-out">
    <li
      v-for="(message, index) in chatNotificationStore().$state.notifications"
      :key="index"
      class="noti bg-yellow-200 rounded-2xl p-2 pl-3 m-2 border border-yellow-300"
      v-html="message.split(',', 2)[1].split(':').join(':<br/>')"
    ></li>
  </TransitionGroup>
</template>

<style scoped>
.list-enter-active {
  animation: slide-in 0.5s;
}
.list-leave-active {
  position: absolute;
  animation: slide-out 0.5s;
}
@keyframes slide-in {
  0% {
    opacity: 0;
    transform: translateX(100px);
  }
  100% {
    opacity: 1;
    transform: translateX(0px);
  }
}
@keyframes slide-out {
  0% {
    opacity: 1;
    transform: translateX(0px);
  }
  100% {
    opacity: 0;
    transform: translateX(100px);
  }
}
</style>
