<script setup lang="ts">
import { startChat, randomRoom } from '../components/WebRTC'
// Rest of the code...
</script>

<template>
  <form @submit.prevent="startChat">
    <div class="flex-col">
      <input
        class="w-3/4 h-10 p-2 bg-transparent border-2 border-gray-500 mb-5 border-r-0"
        type="text"
        id="roomrequest"
        name="roomrequest"
        placeholder="방 번호"
      />
      <button
        class="w-1/4 h-10 bg-teal-500 text-white rounded disabled:bg-gray-400"
        type="button"
        id="randomButton"
        @click.prevent="randomRoom"
      >
        <i class="fas fa-random"></i>
      </button>
      <input
        class="w-3/4 h-10 p-2 bg-transparent border-2 border-gray-500 border-r-0"
        type="text"
        id="username"
        name="username"
        placeholder="사용자 이름"
      />
      <button
        class="w-1/4 h-10 bg-teal-500 text-white rounded"
        type="submit"
        id="loginButton"
        value="LogIn"
      >
        Login
      </button>
    </div>
  </form>
</template>

<style scoped></style>
