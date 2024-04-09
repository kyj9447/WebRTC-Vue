import express from 'express';
import { createServer } from 'https';
import { WebSocketServer } from 'ws';
import { readFileSync } from 'fs';
import { format as _format, createLogger, transports as _transports } from 'winston';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import compression from 'compression';
import Turn from 'node-turn';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// 압축 사용 !!!다른 라우터들보다 먼저 나와야함!!!
app.use(compression({ level: 6 }));

// script,views,asset 폴더 안의 모든 파일에 대한 응답
app.use(express.static(path.join(__dirname, 'dist')));
app.get('/.well-known/assetlinks.json', (req, res) => {
    res.sendFile(path.join(__dirname, '/.well-known/assetlinks.json'));
});

// HTTPS 서버 옵션
const options = {
    cert: readFileSync('SSL/cert1.pem', 'utf8'),
    key: readFileSync('SSL/privkey1.pem', 'utf8'),
    ca: readFileSync('SSL/chain1.pem', 'utf8')
};

// HTTPS 서버 생성
const httpsServer = createServer(options, app);

// TURN 서버 옵션
const TURNserver = new Turn({
    // set options
    authMech: 'long-term',
    credentials: {
        kyj9447: 'kyj0407',
    },
    listeningPort: 3478
    //,debugLevel: 'ALL'
});

// TURN 서버 시작
TURNserver.start();

// 웹소켓 서버 생성
const wss = new WebSocketServer({ server: httpsServer });

// 서버 리스닝 (443)
httpsServer.listen(443, () => {
    logger.info('https server is listening on port 443');
});

// winston 출력 글자 수 제한
const maxLogLength = 100;

// N자 이상은 줄임표로 바꾸는 winston format
const myFormat = _format.printf(({ level, message, timestamp }) => {
    if (message.length > 100) {
        message = message.substring(0, maxLogLength) + '...';
    }
    return `[${timestamp}]${level}: ${message}`;
});

// winston logger 설정
const logger = createLogger({
    level: 'info',
    format: _format.combine(
        _format.colorize(),
        _format.timestamp({
            format: 'HH:mm'
        }),
        myFormat
    ),
    //defaultMeta: { service: 'app' },
    transports: [
        new _transports.Console(),
        //new winston.transports.File({ filename: 'app.log' })
    ]
});

// rooms 리스트
const rooms = [];
const roomMax = 10; // 방 1개당 최대 유저 수
// rooms 리스트 요소 예시
// {
//     roomnumber: 'sdfgkgjd1',
//     users: [
//         ws, // ws.sessionId로 sessionId 사용 가능
//         ws, // ws.username로 username 사용 가능
//         ws, // ws.room으로 roomnumber 사용 가능
//         ws,
//         ...
//     ]
// },
// {
//     roomnumber: '4asdasd',
//     users: [
//         ws,
//         ws,
//         ws,
//         ...
//     ]
// }

// 웹소켓 연결
wss.on('connection', (ws) => {
    logger.info('!NEW! (not logged in)');

    // sessionId 생성
    ws.sessionId = generateSessionId();
    // 해당 ws 연결의 room과 user값을 선언
    ws.room;
    ws.username;

    ws.on('message', (message) => {

        logger.info(`MESG : ${message}`);
        // {type, from, to, data} 형태로 메세지를 보내고 받음
        // ex1 login)       { type: 'login',      from: '', to:'',      data: { roomrequest: '1234',   username: 'John'} } => to All
        // ex2 joined)      { type: 'joined',     from: '', to:'',      data: 'ws.sessionId' } => to me (서버 -> 클라이언트만 발생)
        // ex3 err)         { type: 'error',      from: '', to:'',      data: 'error message' } => to me (서버 -> 클라이언트만 발생)
        // ex4 offer)       { type: 'offer',      from: sessionId,      to: '',              data: 'WebRTC offer' } => to All
        // ex5 answer)      { type: 'answer',     from: sessionId,      to: 'ws.sessionId',  data: 'WebRTC answer' } => to sessionId (from offer)
        // ex6 candidate)   { type: 'candidate',  from: sessionId,      to: 'ws.sessionId',  data: 'WebRTC candidate' } => to sessionId (from answer)

        // 메세지 파싱
        const parsedMessage = JSON.parse(message);

        // message의 from(보낸사람)에 sessionId 저장
        parsedMessage.from = ws.sessionId;

        // 1. login 메세지인 경우
        if (parsedMessage.type === 'login') {
            // ws에 username 정보 저장
            ws.username = parsedMessage.data.username;
            logger.info("!NEW USER! username : " + ws.username + " sessionId: " + ws.sessionId);

            // rooms 리스트에서 roomnumber==roomrequest인 room을 찾음
            // 없으면 undefined, 있으면 해당 room을 반환
            const existingRoom = rooms.find((room) => room.roomnumber === parsedMessage.data.roomrequest);

            // room이 존재하는 경우
            if (existingRoom) {
                logger.info("Room 찾음 : " + existingRoom.roomnumber);
                // 해당 room의 user수가 가득 찬 경우
                if (existingRoom.users.length >= roomMax) {
                    logger.info("Room 가득 참 : " + existingRoom.roomnumber);
                    // 에러 메세지 전송
                    const errorMessage = {
                        type: 'error',
                        message: {
                            errorType: 'full',
                            errorText: '요청하신 방이 가득 찼습니다.'
                        }
                    };

                    ws.send(JSON.stringify(errorMessage));
                    return; // ws.on('message') 핸들러 종료 (이후 함수 실행 안함)
                }
                // 해당 ws객체에 찾은 room 참조
                ws.room = existingRoom;

                // 해당 room의 users에 user(ws)를 추가
                existingRoom.users.push(ws);
            }

            // room이 존재하지 않는 경우
            else {
                logger.info("Room 생성 : " + parsedMessage.data.roomrequest);

                // 해당 room을 생성하고 해당 room의 users에 user를 추가
                const newRoom = {
                    roomnumber: parsedMessage.data.roomrequest,
                    users: []
                };
                newRoom.users.push(ws);
                rooms.push(newRoom);

                // 해당 ws객체에 새로 만든 room 참조
                ws.room = newRoom;
            }

            // 사용자에게 접속 성공 메세지 전송 (자신의 세션id 전송)
            const joinedMessage = {
                type: 'joined',
                data: ws.sessionId
            };

            logger.info("SEND : " + JSON.stringify(joinedMessage));

            // 본인에게 전송
            ws.send(JSON.stringify(joinedMessage));
            //해당 room에 존재하는 본인 제외 모든 user에게 login 메세지 전송
            sendMessageToAll(ws, parsedMessage);
        }
        // 2. offer, answer, candidate 메세지인 경우
        else if (parsedMessage.type === 'offer' || parsedMessage.type === 'answer' || parsedMessage.type === 'candidate') { // 특정 user에게만 전송
            sendMessageToOne(ws, parsedMessage);
        }
        // 3. 방 번호 중복 체크 메세지인 경우
        else if (parsedMessage.type === 'randomCheck') {
            const randomroom = rooms.find(room => room.roomnumber === parsedMessage.data)

            const randomCheckMessage = {
                type: 'randomCheckResult',
                data: {
                    // randomroom이 이미 존재하면 fail, 존재하지 않으면 ok
                    result: randomroom ? 'fail' : 'ok', // 3항연산자
                    roomrequest: parsedMessage.data
                }
            }

            // 해당 ws객체는 room,username이 존재하지 않으므로 send 사용
            logger.info("SEND : " + JSON.stringify(randomCheckMessage));
            ws.send(JSON.stringify(randomCheckMessage));

        }
        // type이 잘못된 경우
        else {
            logger.error('Unknown message type : ' + parsedMessage);
        }
    });

    ws.on('close', () => {
        // ex6 logout)  { type: 'logout',  data: {username: ws.username, sessionId: ws.sessionId} } => to All

        try { // 정상 종료시 (ws에 sessionId, room, username이 존재)
            logger.info('!CLOSE : ' + ws.sessionId);

            const logoutMessage = { type: 'logout', data: { username: ws.username, sessionId: ws.sessionId } };
            sendMessageToAll(ws, logoutMessage);

            // 방 정리
            if (ws.room) {
                let exitedUser;
                // 연결 종료된 사용자의 room에서 index를 찾음
                const exitedUserIndex = ws.room.users.findIndex((user) => user.sessionId === ws.sessionId);
                // 해당 room의 users에서 해당 user를 삭제
                if (exitedUserIndex > -1) {
                    exitedUser = ws.room.users.splice(exitedUserIndex, 1)[0];
                }
                // 사용이 끝난 세션 Id 제거
                expireSessionId(exitedUser.sessionId)
            }

            // 모든 rooms 확인 후 해당 room의 user수가 0명인 경우 해당 room을 삭제 
            rooms.forEach((room, index) => {
                if (room.users.length === 0) {
                    logger.info('Removing room : ' + room.roomnumber);
                    rooms.splice(index, 1);
                }
            });

        } catch (error) { // 비정상 종료시 (ws연결했으나 방이 가득 찼거나, room 생성에 실패하여 종료하는 등)
            logger.error('미등록 사용자 연결 종료됨 : ' + error);
        }
    });

    ws.on('error', (error) => {
        logger.error(error);
        const errorMessage = { type: 'error', data: error };
        ws.send(JSON.stringify(errorMessage));
    });

});

// 세션 Id 저장 객체
const UUID = [];

// 랜덤한 세션 Id 생성 함수
function generateSessionId() {
    // crypto 라이브러리를 사용하여 랜덤한 세션 Id 생성
    const sessionId = randomUUID();
    if (UUID.includes(sessionId)) { // UUID에 중복된 세션 Id가 존재하는 경우 재귀호출
        return generateSessionId();
    }
    UUID.push(sessionId); // UUID에 중복된 세션 Id가 없는 경우 UUID에 추가
    return sessionId; // 세션 Id 반환
}

// 사용이 끝난 세션 Id 제거 함수
function expireSessionId(SessionId) {
    const index = UUID.indexOf(SessionId); // UUID에서 삭제할 세션 Id의 index를 찾음
    if (index !== -1) { // UUID에서 삭제할 세션 Id가 존재하는 경우
        UUID.splice(index, 1); // UUID에서 삭제할 세션 Id를 삭제
        logger.info('expireSessionId: ' + SessionId + ' is expired')
    } else {
        logger.warn('expireSessionId: SessionId not found'); // 삭제할 UUID가 존재하지 않는 경우 경고
    }
}

// 특정 room에 존재하는 모든 user에게 메세지 전송
// !sender는 room 확인용으로만 사용!
function sendMessageToAll(sender, message) {
    logger.info('sendMessageToAll : ' + JSON.stringify(message));
    const targetRoom = sender.room;
    if (targetRoom) {
        targetRoom.users.forEach(user => { // 모든 user중
            if (user.sessionId !== sender.sessionId) { // 보내는 사람 제외
                // 메세지 전송
                user.send(JSON.stringify(message));
            }
        });
    }
    else {
        logger.warn('sendMessageToAll : Room not found');
    }
}

// 특정 room에 존재하는 특정 user에게 메세지 전송
// !sender는 room 확인용으로만 사용!
function sendMessageToOne(sender, message) {
    logger.info('sendMessageToOne : ' + JSON.stringify(message));
    const targetRoom = sender.room;
    if (targetRoom) {
        targetRoom.users.forEach(user => { // 모든 user중
            if (user.sessionId === message.to) { // 특정 대상에게만 전송
                // 메세지 전송
                user.send(JSON.stringify(message));
            }
        });
    }
    else {
        logger.warn('sendMessageToOne : Room not found');
    }
}
