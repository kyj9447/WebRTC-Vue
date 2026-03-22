const mysql = require('mysql2/promise');

let pool;

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

function getPool() {
    if (!pool) {
        pool = mysql.createPool({
            host: getRequiredEnv('MYSQL_HOST'),
            port: getRequiredIntegerEnv('MYSQL_PORT'),
            user: getRequiredEnv('MYSQL_USER'),
            password: getRequiredEnv('MYSQL_PASSWORD'),
            database: getRequiredEnv('MYSQL_DATABASE')
        });
    }

    return pool;
}

async function query(sql, params) {
    const [rows] = await getPool().execute(sql, params);
    return rows;
}

module.exports = {
    getPool,
    query
};
