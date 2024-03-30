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