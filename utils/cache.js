const util = require("node:util");
const Memcached = require("memcached");

const memcached = new Memcached(process.env.MEM_CACHE_ADDRESS);
memcached.on("failure", (details) => {
    console.log("Memcached server failure: ", details);
});
memcached.aGet = util.promisify(memcached.get);
memcached.aSet = util.promisify(memcached.set);
module.exports = memcached;