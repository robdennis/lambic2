import Dexie from 'dexie';

const card_db = new Dexie('Cards');
const pool_db = new Dexie('pool');

card_db.version(1).stores({ cards: 'id,name' });
pool_db.version(1).stores({ cards: '++pool_id,name' });

export {
    card_db,
    pool_db
};