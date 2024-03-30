<script setup lang="ts"></script>

<template>
  <div>
    <p>!!!LoginForm.vue!!!</p>
    <div id="loginPanel">
      <div>
        <form onsubmit="startChat(event)" id="form">
          <div>
            <input
              type="text"
              id="roomrequest"
              name="roomrequest"
              placeholder="방 번호"
              class="input-field"
            />
            <button type="button" id="randomButton" onclick="randomRoom()" class="button-field">
              R
            </button>
          </div>
          <br />
          <div>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="사용자 이름"
              class="input-field"
            />
            <button type="submit" id="loginButton" value="LogIn" class="button-field">Login</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-field {
  width: 87.5%;
  max-width: 87.5%;
}

.button-field {
  width: 10.5%;
  max-width: 10.5%;
}
</style>
