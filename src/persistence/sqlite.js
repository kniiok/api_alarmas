const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const location = process.env.SQLITE_DB_LOCATION || '/tmp/alarmas.db';

let db, dbAll, dbRun;

function init() {
    const dirName = require('path').dirname(location);
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }

    return new Promise((acc, rej) => {
        db = new sqlite3.Database(location, err => {
            if (err) return rej(err);

            if (process.env.NODE_ENV !== 'test')
                console.log(`Using sqlite database at ${location}`);

            db.run(
                'CREATE TABLE IF NOT EXISTS alarmas (id INT NOT NULL, topic varchar(255), data TEXT)',
                (err, result) => {
                    if (err) return rej(err);
                    acc();
                },
            );
        });
    });
}

async function teardown() {
    return new Promise((acc, rej) => {
        db.close(err => {
            if (err) rej(err);
            else acc();
        });
    });
}

async function getItems() {
    return new Promise((acc, rej) => {
        db.all('SELECT * FROM alarmas', (err, rows) => {
            if (err) return rej(err);
            acc(
                rows.map(item => ({
                    id: item.id,
                    topic: item.topic,
                    data: JSON.parse(item.data),
                })),
            );
        });
    });
}

async function getItem(id) {
    return new Promise((acc, rej) => {
        db.all('SELECT * FROM alarmas WHERE id=?', [id], (err, rows) => {
            if (err) return rej(err);
            acc(
                rows.map(item =>
                    Object.assign({}, item, {
                        completed: item.completed === 1,
                    }),
                )[0],
            );
        });
    });
}

async function storeItem(item) {
    return new Promise((acc, rej) => {
        db.run(
            'INSERT INTO alarmas (id, topic, data) VALUES (?, ?, ?)',
            [item.id, item.topic, JSON.stringify(item.data)],
            err => {
                if (err) return rej(err);
                acc();
            },
        );
    });
}

async function updateItem(id, item) {
    return new Promise((acc, rej) => {
        db.run(
            'UPDATE alarmas SET name=?, value=? WHERE id = ?',
            [item.name, item.value, id],
            err => {
                if (err) return rej(err);
                acc();
            },
        );
    });
} 

async function removeItem(id) {
    return new Promise((acc, rej) => {
        db.run('DELETE FROM alarmas WHERE id = ?', [id], err => {
            if (err) return rej(err);
            acc();
        });
    });
}

module.exports = {
    init,
    teardown,
    getItems,
    getItem,
    storeItem,
    updateItem,
    removeItem,
};
