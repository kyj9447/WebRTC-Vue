import { defineStore } from 'pinia'

// 현재 뷰를 저장하는 store (ChatLogin, VideoChat, ChatInfo)
export const currentViewStore = defineStore('currentView', {
  state: () => {
    return { 
      currentView: 'ChatLogin'
     }
  }
})

export const myStreamStore = defineStore('myStream', {
  state: () => {
    return {
      myStream: null as MediaStream | null,
      myVideoTrack: [] as MediaStreamTrack[]
    }
  }
})

export const remoteStreamStore = defineStore('remoteStream', {
  state: () => {
    return {
      remoteStream: [] as HTMLVideoElement[]
    }
  }
})

export const myInfoStore = defineStore('myInfo', {
  state: () => {
    return {
      mySessionId: '' as string | null,
      myRoomrequest: '' as string | null,
      myUsername: '' as string | null
    }
  }
})

export const layoutStore = defineStore('layout', {
  state: () => {
    return {
      isDesktop: true
    }
  }
})

export const chatStore = defineStore('chat', {
  state: () => {
    return{
      chatList: [] as String[]
    }
  }
})

export const chatNotificationStore = defineStore('chatNotification', {
  state: () => ({
    notifications: [] as String[],
  }),
  actions: {
    addNotification(message: String) {
      this.notifications.push(message);
      setTimeout(() => {
        // this.notifications = this.notifications.filter(noti => noti !== message); // 똑같은 메세지를 연속으로 보내면 한번에 삭제됨
        this.notifications.shift(); // 맨 앞에 있는 메세지 삭제하는식으로 변경
      }, 3000);
    },
  },
})