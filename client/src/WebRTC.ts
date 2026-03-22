import { buildShareUrl, getRequestedRoomNumber } from './app/router.js'
import {
    addChat,
    addNotification,
    addRemoteStream,
    getState,
    removeRemoteStream,
    setCurrentView,
    setMediaAccessError,
    setMyMedia,
    setRoomRequest,
    setSessionId,
    setUsername
} from './app/state.js'

const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302'
    },
    {
      urls: 'turn:'+import.meta.env.VITE_DOMAIN+':3478',
      username: 'kyj9447',
      credential: 'kyj0407'
    }
  ]
}

let socket = null
let isInitialized = false

// 상대 Peer객체들
const remotePeers = []

// 상대 dataChannel 객체들
const remoteDataChannels = []

// remotePeer 객체 생성자
class RemotePeer {
  constructor(sessionId, username) {
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

function ensureSocket() {
  if (socket && socket.readyState !== WebSocket.CLOSED) {
    return socket
  }

  socket = new WebSocket('wss://' + import.meta.env.VITE_DOMAIN + ':9443')
  socket.onmessage = onmessageHandler

  return socket
}

function requestUserMedia() {
  navigator.mediaDevices
    .getUserMedia({
      video: {
        width: 320,
        height: 240,
        frameRate: 30
      },
      audio: true
    })
    .then((stream) => {
      setMyMedia(stream)
      setMediaAccessError(false)
    })
    .catch((err) => {
      console.log('An error occurred: ' + err)
      alert('카메라, 혹은 마이크 연결에 실패했습니다! \n 확인 후 재접속 해주세요')
      setMediaAccessError(true)
    })
}

export function initializeWebRTC() {
  ensureSocket()

  if (isInitialized) {
    return
  }

  isInitialized = true
  requestUserMedia()
}

export function applyRequestedRoomNumber() {
  const roomrequest = getRequestedRoomNumber()

  if (roomrequest !== null) {
    setRoomRequest(roomrequest, true)
    return
  }

  setRoomRequest('', false)
}

// 연결 내용 변경 감지시
const onnegotiationneededHandler = (remotePeer) => {
  //console.log('!!!onnegotiationneeded!!!');
  if (remotePeer.RTCPeer) {
    remotePeer.RTCPeer.createOffer()
      .then((offer) => {
        remotePeer.RTCPeer.setLocalDescription(new RTCSessionDescription(offer))
        return offer
      })
      .then((myOffer) => {
        const currentState = getState()
        const mySessionId = currentState.mySessionId
        const myUsername = currentState.myUsername
        sendMessage('offer', mySessionId, remotePeer.sessionId, myOffer, myUsername)
      })
  }
}

// 연결 상태 변경 감지시
const oniceconnectionstatechangeHandler = (remotePeer) => {
  console.log('!!!oniceconnectionstatechange!!!')
  if (remotePeer.RTCPeer) {
    console.log(remotePeer.RTCPeer.iceConnectionState)
  }

  if (remotePeer.RTCPeer.iceConnectionState === 'disconnected') {
    const logoutmessage = 'false,' + remotePeer.username + '님이 로그아웃하였습니다 (disconnected)'
    addChat(logoutmessage)
    addNotification(logoutmessage)

    // 해당 사용자의 sessionId를 id로 하는 video 태그 삭제
    removeRemoteStream(remotePeer.sessionId)

    // 해당 사용자의 remotePeer 객체 삭제
    const index = remotePeers.findIndex((peer) => peer.sessionId === remotePeer.sessionId)
    if (index !== -1) {
      const remotePeerToDelete = remotePeers.splice(index, 1)[0]
      deleteRemotePeer(remotePeerToDelete)
      //console.log("remote Deleted / current : "+JSON.stringify(remotePeers));
    }
  }
}

// ontrack 이벤트 핸들러
const ontrackHandler = (event, remotePeer) => {
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
const onicecandidateHandler = (event, remotePeer) => {
  //console.log("!!! onicecandidateHandler !!!" + JSON.stringify(event.candidate));
  if (event.candidate !== null) {
    // candidate 전송
    const mySessionId = getState().mySessionId
    sendMessage('candidate', mySessionId, remotePeer.sessionId, event.candidate)
  } else {
    //console.log('!!!candidate 생성 완료!!!');
  }
}

// Submit 버튼 클릭 시
export function startChat(event) {
  // 기본 이벤트 제거 (없으면 페이지 새로고침됨)
  event.preventDefault()
  ensureSocket()

  // onopen핸들러 그냥 실행 (ws 전역으로 이미 연결되어있음)
  // 입력값 가져오기
  const roomrequestElement = document.getElementById('roomrequest')
  const usernameElement = document.getElementById('username')

  const myRoomrequest = roomrequestElement ? roomrequestElement.value : ''
  const myUsername = usernameElement ? usernameElement.value : ''

  // store에 저장
  setRoomRequest(myRoomrequest, getState().lockedRoomrequest)
  setUsername(myUsername)

  // JSON으로 메시지 생성
  const data = {
    roomrequest: myRoomrequest,
    username: myUsername
  }

  // 로그인 메세지 전송
  sendMessage('login', '', '', data)
}

// 소켓이 메시지를 받았을 때 핸들러 ---------------------------------------------------------
function onmessageHandler(event) {
  //console.log("[받음] " + JSON.stringify(parsedMessage));

  // 받은 메세지를 JSON으로 파싱
  const parsedMessage = JSON.parse(event.data)

  // 1.offer를 받았을 때
  if (parsedMessage.type === 'offer') {
    // remotePeer객체 생성
    const newPeer = new RemotePeer(parsedMessage.from, parsedMessage.username)
    remotePeers.push(newPeer)
    //console.log("current remotes : "+JSON.stringify(remotePeers));
    console.log('offer 받음 : ' + JSON.stringify(parsedMessage.data))

    const currentState = getState()
    const myTracks = currentState.myTracks
    const myStream = currentState.myStream
    const mySessionId = currentState.mySessionId

    for (const track of myTracks) {
      if (myStream && newPeer.RTCPeer) {
        newPeer.RTCPeer.addTrack(track, myStream)
      }
    }

    // offer 처리, answer 전송
    newPeer.RTCPeer.setRemoteDescription(new RTCSessionDescription(parsedMessage.data))
      .then(() => {
        return newPeer.RTCPeer.createAnswer()
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
    addChat(loginmessage)
    addNotification(loginmessage)

    // 해당 login의 사용자에 대한 RTCPeer 객체 생성
    const newPeer = new RemotePeer(parsedMessage.from, parsedMessage.data.username)

    const currentState = getState()
    const myTracks = currentState.myTracks
    const myStream = currentState.myStream

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
    const logoutmessage =
      'false,' + parsedMessage.data.username + '님이 로그아웃하였습니다 (logout)'
    addChat(logoutmessage)
    addNotification(logoutmessage)
    removeRemoteStream(parsedMessage.data.sessionId)

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
    setSessionId(parsedMessage.data)

    // 입력 폼 삭제
    //document.getElementById('form').remove();

    // 상태 변경
    setCurrentView('ChatRoom')

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
      setRoomRequest(parsedMessage.data.roomrequest, true)
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
function sendMessage(type, from, to, data, username) {
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
  const activeSocket = ensureSocket()

  if (activeSocket.readyState === WebSocket.OPEN) {
    activeSocket.send(JSON.stringify(messageToSend))
    return
  }

  activeSocket.addEventListener(
    'open',
    () => {
      activeSocket.send(JSON.stringify(messageToSend))
    },
    { once: true }
  )
}

// 4. 새 스트림 추가
function newVideo(sessionId, newStream, username) {
  addRemoteStream({
    id: sessionId,
    stream: newStream,
    username: username
  })
}

// 5. RemotePeer 객체 삭제
function deleteRemotePeer(remotePeer) {
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

  sendMessage('randomCheck', '', '', uuidValue)
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
  const myRoomrequest = getState().myRoomrequest
  if (myRoomrequest !== '') {
    navigator.share({
      title: 'WebRTC 방 번호 공유하기',
      url: buildShareUrl(myRoomrequest)
    })
  }
}

export function sendChat(event) {
  event.preventDefault()

  const myUsername = getState().myUsername

  const chatInputField = document.getElementById('chatInput')
  const chatInput = chatInputField.value

  if (chatInput !== '') {
    // 입력값이 있을 때만 전송
    const sender = myUsername
    const chatMessage = {
      sender: sender,
      chatInput: chatInput
    }

    const text = 'true,' + sender + ' : ' + chatInput

    // 입력칸 초기화
    chatInputField.value = ''

    addChat(text)

    remoteDataChannels.forEach((dataChannel) => {
      if (dataChannel.readyState === 'open') {
        //console.log('Data channel is open!');
      } else {
        //console.log('Data channel is not open!');
      }
      //console.log(JSON.stringify(chatMessage));
      dataChannel.send(JSON.stringify(chatMessage))
    })
  }
}

function onChatHandler(event) {
  const chatMessage = JSON.parse(event.data)
  console.log(chatMessage)
  const sender = chatMessage.sender
  const chatInput = chatMessage.chatInput

  const text = 'false,' + sender + ' : ' + chatInput
  addChat(text)
  addNotification(text)
}
