export interface Database { exec(sql:string|{sql:string;bind?:any[];rowMode?:string;returnValue?:string}):any; selectValue(sql:string,bind?:any[]):any; selectObjects(sql:string,bind?:any[]):any[] }
export const SCHEMA_VERSION=3;
export function migrate(db:Database) {
 const version=Number(db.selectValue('PRAGMA user_version'));
 if(version>SCHEMA_VERSION) throw Error('База создана более новой версией приложения. Обновите приложение.');
 db.exec('PRAGMA foreign_keys=ON');
 db.exec('BEGIN IMMEDIATE');
 try {
 if(version<1) db.exec(`CREATE TABLE atoms(id TEXT PRIMARY KEY,type TEXT NOT NULL,title TEXT NOT NULL,content TEXT NOT NULL,state TEXT NOT NULL CHECK(state IN ('normal','now','paused','archived')),importance INTEGER NOT NULL CHECK(importance BETWEEN 0 AND 2),created_at TEXT NOT NULL,updated_at TEXT NOT NULL,properties TEXT NOT NULL,appearance TEXT NOT NULL,x REAL NOT NULL,y REAL NOT NULL,revision INTEGER NOT NULL);
 CREATE TABLE aliases(atom_id TEXT NOT NULL REFERENCES atoms(id) ON DELETE CASCADE,alias TEXT NOT NULL,PRIMARY KEY(atom_id,alias));
 CREATE TABLE links(id TEXT PRIMARY KEY,"from" TEXT NOT NULL REFERENCES atoms(id) ON DELETE CASCADE,"to" TEXT NOT NULL REFERENCES atoms(id) ON DELETE CASCADE,relation TEXT NOT NULL,source TEXT NOT NULL,created_at TEXT NOT NULL,CHECK("from"<>"to"),UNIQUE("from","to",relation));
 CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
 CREATE TABLE plugin_data(plugin_id TEXT NOT NULL,key TEXT NOT NULL,value TEXT NOT NULL,PRIMARY KEY(plugin_id,key));
 CREATE TABLE schema_metadata(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL);
 INSERT INTO schema_metadata VALUES(1,datetime('now'));`);
 if(version<2) db.exec(`CREATE INDEX IF NOT EXISTS links_from ON links("from"); CREATE INDEX IF NOT EXISTS links_to ON links("to"); CREATE INDEX IF NOT EXISTS atoms_state ON atoms(state); CREATE INDEX IF NOT EXISTS aliases_text ON aliases(alias); CREATE INDEX IF NOT EXISTS atoms_updated ON atoms(updated_at); INSERT INTO schema_metadata VALUES(2,datetime('now'));`);
 if(version<3) db.exec(`ALTER TABLE atoms ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0 CHECK(pinned IN (0,1)); ALTER TABLE atoms ADD COLUMN spatial TEXT NOT NULL DEFAULT '{"resistance":0}'; CREATE INDEX atoms_position ON atoms(x,y); INSERT INTO schema_metadata VALUES(3,datetime('now'));`);
 if(db.selectObjects('PRAGMA foreign_key_check').length) throw Error('Нарушена целостность связей.');
 db.exec('PRAGMA user_version=3'); db.exec('COMMIT');
 } catch(e) { db.exec('ROLLBACK'); throw e; }
 if(db.selectValue('PRAGMA quick_check')!=='ok') throw Error('Проверка целостности базы не пройдена. Запись остановлена.');
}
