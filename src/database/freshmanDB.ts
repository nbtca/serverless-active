export function createFreshmanTable(db: D1Database) {
    db.exec("CREATE TABLE IF NOT EXISTS freshman (name TEXT, number TEXT, email TEXT, phone TEXT, qq TEXT)");
}