# Web RTC Chat
### WebRTC 기술을 이용한 P2P방식의 화상채팅 웹 앱 ( PWA : Progessive Web App 표준 적용 )

ICE ( Interactive Connectivity Establishment ) 프레임워크로 STUN, TURN 서버를 통해 상대 Peer에 유동적으로 연결

프론트엔드 프레임워크 : Vue 사용

데스크탑, 모바일별 별도 레이아웃 제공

#### 1. 로그인 화면 ( 데스크탑, 모바일 공통 )
방 번호 입력부분 랜덤 버튼 클릭시 랜덤 UUID 생성 후 자동으로 서버에 중복확인 요청 ( randomCheck 메세지 송신 )

<img src="https://github.com/kyj9447/WebRTC-Vue/assets/122734245/cbc86639-2881-4a1c-9f36-94bc73ff86b4" width=200px>

#### 2. 화상 채팅 화면 ( 모바일 )

<img src="https://github.com/kyj9447/WebRTC-Vue/assets/122734245/579faa46-ff39-46ef-84b8-e1e8275b9b39" width=200px>

#### 3. 텍스트 채팅 화면 ( 모바일 )
WebRTC DataChannel을 통해 텍스트 기반 통신 활용

우측 상단 버튼을 통해 해당 화면 진입시 PIP모드가 가능한 환경일경우 PIP 모드 실행

<img src="https://github.com/kyj9447/WebRTC-Vue/assets/122734245/93110e84-c0a9-4e9b-b819-12f0442b50fb" width=200px>

#### 4. 화상, 텍스트 채팅 화면 ( 데스크탑 )

<img src="https://github.com/kyj9447/WebRTC-Vue/assets/122734245/6b4bf0fe-e94d-467f-b710-4ae3a4786087" width=600px><br>

#### Vue 프로젝트 빌드

```sh
npm install
npm run build
```
<br>

---

<br>

# Web RTC Chat Server

### HTTPS, WSS, TURN, STUN 서버를 제공하는 Node.js express 통합 서버

#### 1. HTTPS ( 웹 페이지 제공 / 443번 포트 사용)

    1-1. HTML, JS, CSS 파일 요청 처리

    1-2. PWA ( Progessive Web App ) 적용을 위한 manifest.json 파일 요청 처리

    1-3. 추가 PWA asset ( 앱 아이콘, 스크린샷 등 ) 파일 요청 처리

    1-4. .well-known 내부 파일 요청 처리

#### 2. WSS ( 방 생성 및 참가, 해당 방의 Web RTC Peer간 사전정보 및 기타 정보 교환 제공 / 443번 포트 사용)

    2-1. Room 사용자들의 WebRTC SDP ( Session Description Protocol : offer / answer / candidate ) 교환

    2-2. 기타 정보 ( login, logout, randomCheck ) 교환

    {type, from, to, data} 형태로 메세지를 보내고 받음
    
    예시)
    offer) => to 방의 모든 사용자
    { type: 'offer',     from: 'my-sessionId', to: '',                 data: 'WebRTC offer' }
    
    answer) => to 방의 특정 사용자
    { type: 'answer',    from: 'my-sessionId', to: 'target-sessionId', data: 'WebRTC answer' }
    
    candidate) => to 방의 특정 사용자
    { type: 'candidate', from: 'my-sessionId', to: 'target-sessionId', data: 'WebRTC candidate' }


#### 3. STUN ( P2P방식 연결을 위한 클라이언트의 공인IP 확인을 제공하는 서버 / 3478번 포트 사용)

#### 4. TURN ( P2P방식 연결이 불가능할경우 WebRTC 패킷 데이터를 직접 중계하는 서버 / 3478번 포트 사용 )

<sup>※STUN 서버는 클라이언트 측에서 Google의 STUN 서버를 우선 사용</sup>


#### Server 실행

<sup>( /SSL 폴더에 cert1.pem, privkey1.pem, chain1.pem 파일이 필요합니다. - HTTPS 서버용 키 / 별도 발급 필요 )</sup>

```sh
npm install
node app.js
```
