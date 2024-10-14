export class indexDB {

    db = null;
    dbName = "MyRecorderDatabase";
    dbVersion = 1;
    constructor() {
        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onerror = (event) => {
            console.error("Database error: " + event.target.error);
        };

        request.onsuccess = (event) => {
            this.db = event.target.result;
            console.log("Database opened successfully");
        };

        request.onupgradeneeded = (event) => {
            this.db = event.target.result;
            const objectStore = this.db.createObjectStore("users", { keyPath: "id" });
            objectStore.createIndex("name", "name", { unique: false });
            console.log("Object store created");
        };
    }
}