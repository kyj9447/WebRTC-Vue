require('dotenv').config();

const express = require('express');
const { createServer } = require('https');
const { WebSocketServer } = require('ws');
const { readFileSync } = require('fs');
const { format, createLogger, transports } = require('winston');
const { randomUUID, randomBytes, createHash } = require('crypto');
const path = require('path');
const compression = require('compression');
const Turn = require('node-turn');
const { OAuth2Client } = require('google-auth-library');
const { generateRegistrationOptions, verifyRegistrationResponse } = require('@simplewebauthn/server');
const { query } = require('./db');

const projectRoot = path.resolve(__dirname, '..');
const app = express();

const httpsPort = 9443;
const turnPort = 3478;
const oauthStateTtlMs = 10 * 60 * 1000;
const webAuthnChallengeTtlMs = 10 * 60 * 1000;
const oauthStates = new Map();
const webAuthnRegistrationChallenges = new Map();

//-------------------- winston 로그 설정 --------------------
// winston 출력 글자 수 제한
const maxLogLength = 100;

// N자 이상은 줄임표로 바꾸는 winston format
const myFormat = format.printf(({ level, message, timestamp }) => {
    if (message.length > 100) {
        message = message.substring(0, maxLogLength) + '...';
    }
    return `[${timestamp}]${level}: ${message}`;
});

// winston logger 설정
const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.colorize(),
        format.timestamp({
            format: 'HH:mm'
        }),
        myFormat
    ),
    //defaultMeta: { service: 'app' },
    transports: [
        new transports.Console(),
        //new winston.transports.File({ filename: 'app.log' })
    ]
});
//-------------------- winston 로그 설정 끝 ------------------

// 압축 사용 !!!다른 라우터들보다 먼저 나와야함!!!
app.use(compression({ level: 6 }));
app.use(express.json());

app.get('/auth/google/start', (req, res) => {
    purgeExpiredEntries(oauthStates);

    const state = randomUUID();
    oauthStates.set(state, Date.now() + oauthStateTtlMs);

    const authUrl = createGoogleOAuthClient().generateAuthUrl({
        response_type: 'code',
        scope: ['openid', 'email', 'profile'],
        access_type: 'offline',
        prompt: 'consent',
        state
    });

    res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
    purgeExpiredEntries(oauthStates);

    const { code, state } = req.query;

    if (typeof code !== 'string' || typeof state !== 'string') {
        return res.status(400).json({ error: 'code와 state가 필요합니다.' });
    }

    const expiresAt = oauthStates.get(state);

    if (!expiresAt || expiresAt < Date.now()) {
        oauthStates.delete(state);
        return res.status(400).json({ error: '유효하지 않은 OAuth state입니다.' });
    }

    oauthStates.delete(state);

    const oauthClient = createGoogleOAuthClient();
    const tokenResponse = await oauthClient.getToken(code);
    const idToken = tokenResponse.tokens.id_token;

    if (!idToken) {
        return res.status(400).json({ error: 'Google ID token이 없습니다.' });
    }

    const ticket = await oauthClient.verifyIdToken({
        idToken,
        audience: getRequiredEnv('GOOGLE_CLIENT_ID')
    });
    const payload = ticket.getPayload();

    if (!payload) {
        throw new Error('Google token payload is empty');
    }
    if (typeof payload.sub !== 'string') {
        throw new Error('Google token payload is missing sub');
    }
    if (typeof payload.email !== 'string') {
        throw new Error('Google token payload is missing email');
    }
    if (typeof payload.email_verified !== 'boolean') {
        throw new Error('Google token payload is missing email_verified');
    }
    if (typeof payload.name !== 'string') {
        throw new Error('Google token payload is missing name');
    }

    const user = await upsertGoogleUser({
        googleSub: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified,
        displayName: payload.name,
        pictureUrl: typeof payload.picture === 'string' ? payload.picture : null
    });
    const session = await issueSession(user);
    setSessionCookie(res, session.sessionToken, session.expiresAt);

    res.json({
        user: serializeUser(user)
    });
});

app.get('/auth/me', authenticateRequest, async (req, res) => {
    res.json({
        user: serializeUser(req.user)
    });
});

app.post('/auth/logout', async (req, res) => {
    const sessionToken = getSessionTokenFromCookieHeader(req.headers.cookie);

    if (sessionToken) {
        const sessionRow = await getSessionRow(sessionToken);

        if (sessionRow) {
            await revokeSessionById(sessionRow.id);
        }
    }

    clearSessionCookie(res);
    res.status(204).end();
});

app.post('/auth/webauthn/register/options', authenticateRequest, async (req, res) => {
    purgeExpiredEntries(webAuthnRegistrationChallenges);

    const credentials = await listUserWebAuthnCredentials(req.user.id);
    const options = await generateRegistrationOptions({
        rpName: getRequiredEnv('WEBAUTHN_RP_NAME'),
        rpID: getRequiredEnv('WEBAUTHN_RP_ID'),
        userName: req.user.email,
        userID: Buffer.from(String(req.user.id), 'utf8'),
        userDisplayName: req.user.display_name,
        excludeCredentials: credentials.map((credential) => {
            if (credential.transports_json === null) {
                return { id: credential.credential_id };
            }

            return {
                id: credential.credential_id,
                transports: JSON.parse(credential.transports_json)
            };
        })
    });

    webAuthnRegistrationChallenges.set(String(req.user.id), {
        challenge: options.challenge,
        expiresAt: Date.now() + webAuthnChallengeTtlMs
    });

    res.json(options);
});

app.post('/auth/webauthn/register/verify', authenticateRequest, async (req, res) => {
    purgeExpiredEntries(webAuthnRegistrationChallenges);

    const challengeKey = String(req.user.id);
    const challengeRecord = webAuthnRegistrationChallenges.get(challengeKey);

    if (!challengeRecord || challengeRecord.expiresAt < Date.now()) {
        webAuthnRegistrationChallenges.delete(challengeKey);
        return res.status(400).json({ error: '만료되었거나 없는 등록 challenge입니다.' });
    }

    const verification = await verifyRegistrationResponse({
        response: req.body,
        expectedChallenge: challengeRecord.challenge,
        expectedOrigin: getRequiredEnv('WEBAUTHN_ORIGIN'),
        expectedRPID: getRequiredEnv('WEBAUTHN_RP_ID')
    });

    webAuthnRegistrationChallenges.delete(challengeKey);

    if (!verification.verified || !verification.registrationInfo) {
        return res.status(400).json({ error: '지문 등록 검증에 실패했습니다.' });
    }

    await saveWebAuthnCredential(req.user.id, verification.registrationInfo);

    res.json({
        verified: true,
        credentialId: verification.registrationInfo.credential.id
    });
});

// script,views,asset 폴더 안의 모든 파일에 대한 응답
app.use(express.static(path.join(projectRoot, 'client', 'dist')));
app.get('/.well-known/assetlinks.json', (req, res) => {
    res.sendFile(path.join(projectRoot, '.well-known', 'assetlinks.json'));
});

// HTTPS 서버 옵션
const options = {
    cert: readFileSync(path.join(projectRoot, 'SSL', 'cert.pem'), 'utf8'),
    key: readFileSync(path.join(projectRoot, 'SSL', 'privkey.pem'), 'utf8')
};

// HTTPS 서버 생성
const httpsServer = createServer(options, app);

// 서버 리스닝 (443)
httpsServer.listen(httpsPort, () => {
    logger.info('https server is listening on port '+httpsPort);
});

// 웹소켓 서버 생성
const wss = new WebSocketServer({ server: httpsServer });

// TURN 서버 옵션
const TURNserver = new Turn({
    // set options
    authMech: 'long-term',
    credentials: {
        kyj9447: 'kyj0407',
    },
    listeningPort: turnPort
    ,debugLevel: 'ERROR'
});

// TURN 서버 시작
TURNserver.start();
logger.info('TURN server is listening on port '+turnPort);

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
wss.on('connection', (ws, req) => {
    logger.info('!NEW! (not logged in)');

    // sessionId 생성
    ws.sessionId = generateSessionId();
    // 해당 ws 연결의 room과 user값을 선언
    ws.room;
    ws.username;
    ws.memberId;
    ws.sessionToken = getSessionTokenFromCookieHeader(req.headers.cookie);

    if (ws.sessionToken) {
        ws.memberPromise = getAuthenticatedUserFromSessionToken(ws.sessionToken)
            .then((member) => {
                ws.memberId = member.id;
            })
            .catch((error) => {
                logger.error(error);
            });
    }

    ws.on('message', async (message) => {
        try {
            logger.info(`MESG : ${message}`);
            // {type, from, to, data} 형태로 메세지를 보내고 받음
            // ex1 login)       { type: 'login',      from: '', to:'',      data: { roomrequest: '1234',   username: 'John'} } => to All
            // ex2 joined)      { type: 'joined',     from: '', to:'',      data: 'ws.sessionId' } => to me (서버 -> 클라이언트만 발생)
            // ex3 err)         { type: 'error',      from: '', to:'',      data: 'error message' } => to me (서버 -> 클라이언트만 발생)
            // ex4 offer)       { type: 'offer',      from: sessionId,      to: '',              data: 'WebRTC offer' } => to All
            // ex5 answer)      { type: 'answer',     from: sessionId,      to: 'ws.sessionId',  data: 'WebRTC answer' } => to sessionId (from offer)
            // ex6 candidate)   { type: 'candidate',  from: sessionId,      to: 'ws.sessionId',  data: 'WebRTC candidate' } => to sessionId (from answer)

            const parsedMessage = JSON.parse(message.toString());
            parsedMessage.from = ws.sessionId;

            if (parsedMessage.type === 'login') {
                if (!parsedMessage.data || typeof parsedMessage.data.roomrequest !== 'string' || typeof parsedMessage.data.username !== 'string') {
                    sendWsStructuredError(ws, 'invalid', '잘못된 로그인 요청입니다.');
                    return;
                }

                if (ws.memberPromise) {
                    await ws.memberPromise;
                }

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
                        sendWsStructuredError(ws, 'full', '요청하신 방이 가득 찼습니다.');
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
                logger.error('Unknown message type : ' + parsedMessage.type);
            }
        } catch (error) {
            logger.error(error);
            sendWsStructuredError(ws, 'invalid', '메시지 처리에 실패했습니다.');
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

function getRequiredEnv(name) {
    const value = process.env[name];

    if (!value) {
        throw new Error(`${name} environment variable is required`);
    }

    return value;
}

function getRequiredIntegerEnv(name) {
    const value = Number.parseInt(getRequiredEnv(name), 10);

    if (!Number.isInteger(value)) {
        throw new Error(`${name} environment variable must be an integer`);
    }

    return value;
}

function createGoogleOAuthClient() {
    return new OAuth2Client(
        getRequiredEnv('GOOGLE_CLIENT_ID'),
        getRequiredEnv('GOOGLE_CLIENT_SECRET'),
        getRequiredEnv('GOOGLE_REDIRECT_URI')
    );
}

function hashToken(token) {
    return createHash('sha256').update(token).digest('hex');
}

function purgeExpiredEntries(store) {
    const now = Date.now();

    for (const [key, value] of store.entries()) {
        if (typeof value === 'number' && value < now) {
            store.delete(key);
        }

        if (typeof value === 'object' && value !== null && typeof value.expiresAt === 'number' && value.expiresAt < now) {
            store.delete(key);
        }
    }
}

async function issueSession(user) {
    const sessionToken = randomBytes(48).toString('hex');
    const sessionTtlDays = getRequiredIntegerEnv('SESSION_TTL_DAYS');
    const expiresAt = new Date(Date.now() + sessionTtlDays * 24 * 60 * 60 * 1000);

    await query(
        'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
        [user.id, hashToken(sessionToken), expiresAt]
    );

    return {
        sessionToken,
        expiresAt
    };
}

function serializeUser(user) {
    return {
        id: user.id,
        email: user.email,
        emailVerified: user.email_verified === 1,
        displayName: user.display_name,
        pictureUrl: user.picture_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at
    };
}

async function upsertGoogleUser(profile) {
    const existingUsers = await query(
        'SELECT id FROM users WHERE google_sub = ?',
        [profile.googleSub]
    );

    if (existingUsers.length === 0) {
        await query(
            'INSERT INTO users (google_sub, email, email_verified, display_name, picture_url) VALUES (?, ?, ?, ?, ?)',
            [profile.googleSub, profile.email, Number(profile.emailVerified), profile.displayName, profile.pictureUrl]
        );
    } else {
        await query(
            'UPDATE users SET email = ?, email_verified = ?, display_name = ?, picture_url = ? WHERE id = ?',
            [profile.email, Number(profile.emailVerified), profile.displayName, profile.pictureUrl, existingUsers[0].id]
        );
    }

    return getUserByGoogleSub(profile.googleSub);
}

async function getUserByGoogleSub(googleSub) {
    const users = await query(
        'SELECT id, google_sub, email, email_verified, display_name, picture_url, created_at, updated_at FROM users WHERE google_sub = ?',
        [googleSub]
    );

    return users[0] || null;
}

async function getUserById(userId) {
    const users = await query(
        'SELECT id, google_sub, email, email_verified, display_name, picture_url, created_at, updated_at FROM users WHERE id = ?',
        [userId]
    );

    return users[0] || null;
}

async function authenticateRequest(req, res, next) {
    try {
        const sessionToken = getSessionTokenFromCookieHeader(req.headers.cookie);

        if (!sessionToken) {
            return res.status(401).json({ error: 'session cookie가 필요합니다.' });
        }

        req.user = await getAuthenticatedUserFromSessionToken(sessionToken);
        next();
    } catch (error) {
        if (error.message === 'Invalid session' || error.message === 'Session user not found') {
            return res.status(401).json({ error: '유효하지 않은 session cookie입니다.' });
        }

        next(error);
    }
}

async function getSessionRow(sessionToken) {
    const sessionRows = await query(
        'SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = ?',
        [hashToken(sessionToken)]
    );

    return sessionRows[0] || null;
}

async function revokeSessionById(sessionId) {
    await query(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?',
        [sessionId]
    );
}

async function listUserWebAuthnCredentials(userId) {
    return query(
        'SELECT credential_id, transports_json FROM webauthn_credentials WHERE user_id = ?',
        [userId]
    );
}

async function saveWebAuthnCredential(userId, registrationInfo) {
    await query(
        'INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter, transports_json, device_type, backed_up) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
            userId,
            registrationInfo.credential.id,
            registrationInfo.credential.publicKey,
            registrationInfo.credential.counter,
            registrationInfo.credential.transports ? JSON.stringify(registrationInfo.credential.transports) : null,
            registrationInfo.credentialDeviceType,
            Number(registrationInfo.credentialBackedUp)
        ]
    );
}

async function getAuthenticatedUserFromSessionToken(sessionToken) {
    const sessionRow = await getSessionRow(sessionToken);

    if (!sessionRow || sessionRow.revoked_at !== null) {
        throw new Error('Invalid session');
    }

    if (new Date(sessionRow.expires_at).getTime() <= Date.now()) {
        throw new Error('Invalid session');
    }

    const user = await getUserById(sessionRow.user_id);

    if (!user) {
        throw new Error('Session user not found');
    }

    return user;
}

function parseCookies(cookieHeader) {
    const cookies = {};

    if (!cookieHeader) {
        return cookies;
    }

    cookieHeader.split(';').forEach((cookiePart) => {
        const separatorIndex = cookiePart.indexOf('=');

        if (separatorIndex === -1) {
            return;
        }

        const name = cookiePart.slice(0, separatorIndex).trim();
        const value = cookiePart.slice(separatorIndex + 1).trim();
        cookies[name] = decodeURIComponent(value);
    });

    return cookies;
}

function getSessionTokenFromCookieHeader(cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    return cookies[getRequiredEnv('SESSION_COOKIE_NAME')] || null;
}

function setSessionCookie(res, sessionToken, expiresAt) {
    res.cookie(getRequiredEnv('SESSION_COOKIE_NAME'), sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresAt,
        path: '/'
    });
}

function clearSessionCookie(res) {
    res.clearCookie(getRequiredEnv('SESSION_COOKIE_NAME'), {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/'
    });
}

function sendWsStructuredError(ws, errorType, errorText) {
    ws.send(JSON.stringify({
        type: 'error',
        message: {
            errorType,
            errorText
        }
    }));
}

app.use((error, req, res, next) => {
    logger.error(error.stack || error.message || String(error));

    if (res.headersSent) {
        return next(error);
    }

    res.status(500).json({
        error: error.message
    });
});
