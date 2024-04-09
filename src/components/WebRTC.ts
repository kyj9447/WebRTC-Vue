import {
  currentViewStore,
  myStreamStore,
  myInfoStore,
  remoteStreamStore,
  chatStore,
  chatNotificationStore
} from '../stores/store.js'

const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302'
    },
    {
      urls: 'turn:kyj9447.iptime.org:3478',
      username: 'kyj9447',
      credential: 'kyj0407'
    }
  ]
}

//export let socket = null;
//export var socket = new WebSocket("wss://kyj9447.iptime.org:3000")
const socket = new WebSocket('wss://www.kyj9447.kr:443')
// 이벤트 핸들러 설정
socket.onmessage = onmessageHandler

// 내 media track
//var myTracks = [];

// 내 MediaStream
//var myStream;

// 내 sessionId
//var mySessionId = '';

// 내 roomrequest
//var myRoomrequest = '';

// 내 사용자 이름
//var myUsername = '';

// 미디어 스트림 가져오기
navigator.mediaDevices
  .getUserMedia({
    video: { width: 320, height: 240 },
    audio: false
  })
  .then((stream) => {
    // 스토어에 저장
    myStreamStore().$state.myStream = stream
    myStreamStore().$state.myTracks = stream.getTracks()
    // 비디오 태그에 스트림 추가
    const video = document.getElementById('myVideo') as HTMLVideoElement
    video.srcObject = myStreamStore().$state.myStream

    // 전역변수 대신 store에 저장
    // myTracks = myStreamStore().$state.myStream.getTracks();
    // myStream = myStreamStore().$state.myStream;
  })
  .catch((err) => {
    console.log('An error occurred: ' + err)
    alert('카메라, 혹은 마이크 연결에 실패했습니다! \n 확인 후 재접속 해주세요') // 사용자에게 alert
    // loginButton에 disabled 속성 적용
    const loginButton = document.getElementById('loginButton') as HTMLButtonElement
    loginButton.disabled = true
    // randomButton에 disabled 속성 적용
    const randomButton = document.getElementById('randomButton') as HTMLButtonElement
    randomButton.disabled = true
  })

// 상대 Peer객체들
const remotePeers = [] as RemotePeer[]

// 상대 dataChannel 객체들
const remoteDataChannels = [] as RTCDataChannel[]

// remotePeer 객체 생성자
class RemotePeer {
  sessionId: string
  username: string
  RTCPeer: RTCPeerConnection
  dataChannel: RTCDataChannel
  inboundStream: MediaStream | null // 생성 초기엔 없을 수 있음

  constructor(sessionId: string, username: string) {
    this.sessionId = sessionId
    this.username = username
    this.RTCPeer = new RTCPeerConnection(configuration)
    this.dataChannel = this.RTCPeer.createDataChannel('chat')
    this.dataChannel.onopen = () => console.log('Data channel is open!')
    this.dataChannel.onclose = () => console.log('Data channel is closed!')
    this.dataChannel.onmessage = (event) => onChatHandler(event)
    this.inboundStream = null

    this.RTCPeer.onnegotiationneeded = () => onnegotiationneededHandler(this)
    this.RTCPeer.oniceconnectionstatechange = () => oniceconnectionstatechangeHandler(this)
    this.RTCPeer.ontrack = (event) => ontrackHandler(event, this)
    this.RTCPeer.onicecandidate = (event) => onicecandidateHandler(event, this)
    this.RTCPeer.ondatachannel = (event) => {
      console.log('Data channel is created!')
      remoteDataChannels.push(event.channel)
    }
  }
}

// 연결 내용 변경 감지시
const onnegotiationneededHandler = (remotePeer: RemotePeer) => {
  //console.log('!!!onnegotiationneeded!!!');
  if (remotePeer.RTCPeer) {
    remotePeer.RTCPeer.createOffer()
      .then((offer) => {
        remotePeer.RTCPeer.setLocalDescription(new RTCSessionDescription(offer))
        return offer
      })
      .then((myOffer) => {
        const mySessionId = myInfoStore().$state.mySessionId
        const myUsername = myInfoStore().$state.myUsername
        sendMessage('offer', mySessionId, remotePeer.sessionId, myOffer, myUsername)
      })
  }
}

// 연결 상태 변경 감지시
const oniceconnectionstatechangeHandler = (remotePeer: RemotePeer) => {
  //console.log('!!!oniceconnectionstatechange!!!');
  if (remotePeer.RTCPeer) {
    console.log(remotePeer.RTCPeer.iceConnectionState)
  }
}

// ontrack 이벤트 핸들러
const ontrackHandler = (event: RTCTrackEvent, remotePeer: RemotePeer) => {
  //console.log('!!!ontrack!!!');
  //console.log("ontrack 트리거 : " + event);
  //console.log("[ontrack] Added track: " + event.track.kind + ", " + event.track.id);
  if (event.streams && event.streams[0]) {
    //console.log("stream 시작 : " + event.streams[0]);
    // 비디오 태그에 스트림 추가
    newVideo(remotePeer.sessionId, event.streams[0], remotePeer.username)
  } else {
    if (remotePeer.inboundStream === null) {
      remotePeer.inboundStream = new MediaStream()
    }
    //console.log("not stream: " + event);
    //console.log("새 stream track 추가 : " + event);
    remotePeer.inboundStream.addTrack(event.track)

    newVideo(remotePeer.sessionId, remotePeer.inboundStream, remotePeer.username)
  }
}

// candidate 생성
const onicecandidateHandler = (event: RTCPeerConnectionIceEvent, remotePeer: RemotePeer) => {
  //console.log("!!! onicecandidateHandler !!!" + JSON.stringify(event.candidate));
  if (event.candidate !== null) {
    // candidate 전송
    const mySessionId = myInfoStore().$state.mySessionId
    sendMessage('candidate', mySessionId, remotePeer.sessionId, event.candidate)
  } else {
    //console.log('!!!candidate 생성 완료!!!');
  }
}

// Submit 버튼 클릭 시
export function startChat(event: { preventDefault: () => void }) {
  // 기본 이벤트 제거 (없으면 페이지 새로고침됨)
  event.preventDefault()

  // onopen핸들러 그냥 실행 (ws 전역으로 이미 연결되어있음)
  // 입력값 가져오기
  const roomrequestElement = document.getElementById('roomrequest') as HTMLInputElement
  const usernameElement = document.getElementById('username') as HTMLInputElement

  const myRoomrequest = roomrequestElement ? roomrequestElement.value : ''
  const myUsername = usernameElement ? usernameElement.value : ''

  // store에 저장
  myInfoStore().$state.myRoomrequest = myRoomrequest
  myInfoStore().$state.myUsername = myUsername

  // JSON으로 메시지 생성
  const data = {
    roomrequest: myRoomrequest,
    username: myUsername
  }

  // 로그인 메세지 전송
  sendMessage('login', '', '', data)
}

// 소켓이 메시지를 받았을 때 핸들러 ---------------------------------------------------------
function onmessageHandler(event: { data: string }) {
  //console.log("[받음] " + JSON.stringify(parsedMessage));

  // 받은 메세지를 JSON으로 파싱
  const parsedMessage = JSON.parse(event.data)

  // 1.offer를 받았을 때
  if (parsedMessage.type === 'offer') {
    // remotePeer객체 생성
    const newPeer = new RemotePeer(parsedMessage.from, parsedMessage.username)
    remotePeers.push(newPeer)
    //console.log("current remotes : "+JSON.stringify(remotePeers));

    const myTracks = myStreamStore().$state.myTracks
    const myStream = myStreamStore().$state.myStream
    const mySessionId = myInfoStore().$state.mySessionId

    for (const track of myTracks) {
      if (myStream && newPeer.RTCPeer) {
        newPeer.RTCPeer.addTrack(track, myStream)
      }
    }

    // offer 처리, answer 전송
    newPeer.RTCPeer.setRemoteDescription(new RTCSessionDescription(parsedMessage.data))
      .then(() => {
        return newPeer.RTCPeer.createAnswer() as Promise<RTCSessionDescriptionInit>
      })
      .then((answer) => {
        //console.log('answer 생성 by offer');
        newPeer.RTCPeer.setLocalDescription(new RTCSessionDescription(answer))
        return answer
      })
      .then((myAnswer) => {
        // answer 전송
        sendMessage('answer', mySessionId, parsedMessage.from, myAnswer)
      })
  }

  // 2.answer를 받았을 때
  else if (parsedMessage.type === 'answer') {
    // remotePeer 객체 가져오기
    const newPeer = remotePeers.find((peer) => peer.sessionId === parsedMessage.from)

    if (newPeer) {
      //console.log(newPeer.sessionId + "에 answer 추가");
      newPeer.RTCPeer.setRemoteDescription(new RTCSessionDescription(parsedMessage.data))
    }
  }

  // 3.candidate를 받았을 때
  else if (parsedMessage.type === 'candidate') {
    // remotePeer 객체 가져오기
    const newPeer = remotePeers.find((peer) => peer.sessionId === parsedMessage.from)
    if (newPeer) {
      //console.log("add candidate " + JSON.stringify(parsedMessage));
      newPeer.RTCPeer.addIceCandidate(new RTCIceCandidate(parsedMessage.data))
    }
  }

  // 4.login을 받았을 때
  else if (parsedMessage.type === 'login') {
    // html태그 추가
    const loginmessage = 'false,' + parsedMessage.data.username + '님이 로그인하였습니다'
    //let paragraph = document.createElement("li");
    //let text = document.createTextNode(loginmessage);

    //paragraph.appendChild(text);

    // ChatList 태그에 추가
    // let chatList = document.getElementById('ChatList');
    // chatList.appendChild(paragraph);
    chatStore().$state.chatList.push(loginmessage)

    // 알림용 store에 추가
    const store = chatNotificationStore()
    store.addNotification(loginmessage)

    // 해당 login의 사용자에 대한 RTCPeer 객체 생성
    const newPeer = new RemotePeer(parsedMessage.from, parsedMessage.data.username)

    const myTracks = myStreamStore().$state.myTracks
    const myStream = myStreamStore().$state.myStream

    for (const track of myTracks) {
      if (myStream) {
        newPeer.RTCPeer.addTrack(track, myStream)
      }
    }

    remotePeers.push(newPeer)
    //console.log("current remotes : "+JSON.stringify(remotePeers));
  }

  // 5.logout을 받았을 때
  else if (parsedMessage.type === 'logout') {
    const logoutmessage = 'false,' + parsedMessage.data.username + '님이 로그아웃하였습니다'
    // let paragraph = document.createElement("p");
    // let text = document.createTextNode(logoutmessage);
    // paragraph.appendChild(text);
    // document.body.appendChild(paragraph);
    chatStore().$state.chatList.push(logoutmessage)

    // 알림용 store에 추가
    const store = chatNotificationStore()
    store.addNotification(logoutmessage)

    // 해당 사용자의 sessionId를 id로 하는 video 태그 삭제
    const videoElement = document.getElementById(parsedMessage.data.sessionId)
    if (videoElement) {
      videoElement.remove()
    }

    // 로그아웃한 사용자를 remoteStreamStore에서 삭제
    remoteStreamStore().$state.remoteStream = remoteStreamStore().$state.remoteStream.filter(
      (user) => user.id !== parsedMessage.data.id
    )

    // 해당 사용자의 remotePeer 객체 삭제
    const index = remotePeers.findIndex((peer) => peer.sessionId === parsedMessage.data.sessionId)
    if (index !== -1) {
      const remotePeerToDelete = remotePeers.splice(index, 1)[0]
      deleteRemotePeer(remotePeerToDelete)
      //console.log("remote Deleted / current : "+JSON.stringify(remotePeers));
    }
  }

  // 6.joined를 받았을때
  else if (parsedMessage.type === 'joined') {
    // 내 sessionId 저장
    //console.log("mySessionId? : " + parsedMessage.data);
    myInfoStore().$state.mySessionId = parsedMessage.data

    // 입력 폼 삭제
    //document.getElementById('form').remove();

    // 상태 변경
    currentViewStore().currentView = 'ChatRoom'

    // 화면에 html태그 방 번호, 사용자 이름 추가
    // let paragraph = document.getElementById("roomNumber")
    // //console.log("roomNumber : " + myRoomrequest);
    // let text = document.createTextNode("방 번호 : " + myRoomrequest);
    // paragraph.appendChild(text);
  }

  // 7.randomCheck를 받았을 때
  // {type: "randomCheckResult", data: {result: "ok", roomrequest: "1234"}}
  else if (parsedMessage.type === 'randomCheckResult') {
    if (parsedMessage.data.result === 'ok') {
      // 결과가 ok이면
      // html태그에 해당 방 번호 자동입력
      const randomButton = document.getElementById('randomButton') as HTMLButtonElement
      const roomrequestInput = document.getElementById('roomrequest') as HTMLInputElement
      if (randomButton && roomrequestInput) {
        randomButton.disabled = true
        roomrequestInput.value = parsedMessage.data.roomrequest
      }
    } else {
      // 결과가 ok이 아니면 (=fail)
      // ok가 올때까지 재전송
      randomRoom()
    }
  }

  // etc.error를 받았을 때
  else if (parsedMessage.type === 'error') {
    //console.log("error: " + JSON.stringify(parsedMessage));
  }
}
// 소켓이 메시지를 받았을 때 끝---------------------------------------------------------

// 3. sendMessage 함수
function sendMessage(
  type: string,
  from: string | null,
  to: string,
  data: any,
  username?: string | null | undefined
) {
  // JSON으로 메시지 생성
  const messageToSend = {
    type: type,
    from: from,
    to: to,
    data: data,
    username: username
  }

  //console.log("[보냄] type: " + type + " /from: " + from + " /to: " + to);
  //console.log("[보냄] " + JSON.stringify(messageToSend));
  // 메세지 전송
  socket.send(JSON.stringify(messageToSend))
}

// 4. 새 스트림 추가
function newVideo(sessionId: string, newStream: MediaStream, username: string | undefined) {
  const videoElementNumber = sessionId
  let videoElement = document.getElementById(videoElementNumber) as HTMLVideoElement
  if (!videoElement) {
    videoElement = document.createElement('video') as HTMLVideoElement
    videoElement.id = videoElementNumber
    // videoElement.className = 'video';
    videoElement.autoplay = true // Added autoplay option
    videoElement.width = 320 // Set width to 320 pixels
    videoElement.height = 240 // Set height to 240 pixels
    videoElement.srcObject = newStream
    videoElement.dataset.username = username

    // remoteStreamStore에 추가
    const remoteStreams = remoteStreamStore().$state.remoteStream
    remoteStreams.push(videoElement)
    // // html 태그에 추가
    // const remoteVideos = document.querySelector('#remoteVideos');
    // remoteVideos.appendChild(videoElement); // Add videoElement to remoteVideos
  }
}

// 5. RemotePeer 객체 삭제
function deleteRemotePeer(remotePeer: RemotePeer | null) {
  if (remotePeer) {
    // RTCPeerConnection 객체 닫기
    if (remotePeer.RTCPeer) {
      // 이벤트 핸들러 제거
      remotePeer.RTCPeer.onnegotiationneeded = null
      remotePeer.RTCPeer.oniceconnectionstatechange = null
      remotePeer.RTCPeer.ontrack = null
      remotePeer.RTCPeer.onicecandidate = null

      // RTCPeerConnection 연결 닫기
      remotePeer.RTCPeer.close()
    }

    // 다른 속성도 null로 설정
    remotePeer.inboundStream = null

    // remotePeer 객체 삭제
    remotePeer = null
  }
}

//================================================================================================
// UserInterface.js
// html에서 접근할 수 있도록 전역변수로 선언
export function randomRoom() {
  // UUID 생성
  const uuidValue = crypto.randomUUID()

  // 메세지 작성 후 서버로 전송
  const message = {
    type: 'randomCheck',
    data: uuidValue
  }

  socket.send(JSON.stringify(message))
}

// // 방 번호 표시, 숨기기 버튼
// window.displayRoomNumber = displayRoomNumber
// function displayRoomNumber() {
//   const displayButton = document.getElementById('displayButton')
//   displayButton.innerText = displayButton.innerText === '표시' ? '숨기기' : '표시'

//   const roomNumber = document.getElementById('roomNumber')
//   roomNumber.style.display = roomNumber.style.display === 'block' ? 'none' : 'block'

//   const shareButton = document.getElementById('shareButton')
//   shareButton.style.display = shareButton.style.display === 'block' ? 'none' : 'block'
// }

// 방 번호 공유하기 버튼
export function shareRoomNumber() {
  const myRoomrequest = myInfoStore().$state.myRoomrequest
  if (myRoomrequest !== '') {
    navigator.share({
      title: 'WebRTC 방 번호 공유하기',
      url: 'https://www.kyj9447.kr:443?roomrequest=' + myRoomrequest
    })
  }
}

// 공유받은 방 번호로 접속시 방 번호 자동 입력
window.onload = function () {
  // URL의 쿼리 파라미터 파싱
  const params = new URLSearchParams(window.location.search)

  // 'roomrequest' 파라미터 가져오기
  const roomrequest = params.get('roomrequest')

  // 'roomrequest' 파라미터가 존재하면
  if (roomrequest !== null) {
    // 방 번호 입력칸에 입력 후 비활성화 설정
    const inputElement = document.getElementById('roomrequest') as HTMLInputElement
    inputElement.value = roomrequest
    inputElement.disabled = true

    // 랜덤 방 번호 버튼 비활성화
    const randomButton = document.getElementById('randomButton') as HTMLButtonElement
    randomButton.disabled = true
  }
}

export function sendChat(event: { preventDefault: () => void }) {
  event.preventDefault()

  const myUsername = myInfoStore().$state.myUsername

  const chatInputField = document.getElementById('chatInput') as HTMLInputElement
  const chatInput = chatInputField.value

  if (chatInput !== '') {
    // 입력값이 있을 때만 전송
    const sender = myUsername
    const chatMessage = {
      sender: sender,
      chatInput: chatInput
    }

    //let paragraph = document.createElement("li");
    //paragraph.style.color = "blue"; // 내가 보낸 chat
    const text = 'true,' + sender + ' : ' + chatInput
    //paragraph.appendChild(text);

    // ChatList 태그에 추가
    // let chatList = document.getElementById('ChatList');
    // chatList.appendChild(paragraph);
    chatStore().$state.chatList.push(text)

    remoteDataChannels.forEach((dataChannel) => {
      if (dataChannel.readyState === 'open') {
        //console.log('Data channel is open!');
      } else {
        //console.log('Data channel is not open!');
      }
      //console.log(JSON.stringify(chatMessage));
      dataChannel.send(JSON.stringify(chatMessage))
    })

    // 입력칸 초기화
    chatInputField.value = ''
  }
}

function onChatHandler(event: MessageEvent<any>) {
  const chatMessage = JSON.parse(event.data)
  console.log(chatMessage)
  const sender = chatMessage.sender
  const chatInput = chatMessage.chatInput

  // let paragraph = document.createElement("li");
  const text = 'false,' + sender + ' : ' + chatInput
  // paragraph.appendChild(text);

  // ChatList에 추가
  // let chatList = document.getElementById('ChatList');
  // chatList.appendChild(paragraph);
  chatStore().$state.chatList.push(text)

  // 알림용 store에 추가
  const store = chatNotificationStore()
  store.addNotification(text)
}
