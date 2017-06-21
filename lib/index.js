const Redis = require('ioredis');

/**
 * Using this adapter along with the botmaster-session-ware middleware will
 * store sessions in redis rather than use the default in memory store which
 * should not be used in production
 * @param {object} settings just a valid ioredis settings object as per:
 * https://github.com/luin/ioredis which is used under the hood. By default,
 * will connect to 127.0.0.1:6379
 * *
 * @example

 * const Botmaster = require('botmaster');
 * // Using this socket.io bot class for the sake of the example
 * const SocketioBot = require('botmaster-socket.io');
 * const SessionWare = require('botmaster-session-ware');
 * const SessionWareRedisStore = require('botmaster-session-ware-redis-store);
 *
 * const botmaster = new Botmaster();
 * botmaster.addBot(new SocketioBot({
 *   id: 'botId',
 *   server: botmaster.server,
 * }));
 *
 * // declaring middleware
 *
 * botmaster.use({
 *   type: 'incoming',
 *   name: 'my-awesome-middleware',
 *   controller: async (bot, update) => {
 *     // this will be {} on the first call from a certain user
 *     // and will contain the last message upon all the next iterations
 *     console.log(update.session);
 *
 *     update.session.lastMessage = update.message;
 *   }
 * })
 *
 * // This will make our context persist throughout different messages from the
 * // same user
 * const sessionWare = new SessionWare({ adapter: new RedisStore() });
 * botmaster.useWrapped(sessionWare.incoming, sessionWare.outgoing);
 *
 */
class RedisStore {
  constructor(redisSettings) {
    // will default to connecting to 127.0.0.1:6379
    this.redis = new Redis(redisSettings);
  }

  /**
   *  Get or create a session with the id.
   * @param {String} id a unique id for the session
   * @returns {Promise} evaluates to an object that is the  session
   */
  get(id) {
    return this.redis.get(id)
    .then((result) => {
      if (result === null) {
        return {};
      }
      return JSON.parse(result);
    });
  }

  /**
   *  Update a session in the storage.
   *  @param {String} id a unique id for the session
   *  @param {Object} value the new value for the session
   *  @return {Promise} resolves when the session has been saved
   */
  set(id, value) {
    const stringifiedValue = JSON.stringify(value);
    return this.redis.set(id, stringifiedValue);
  }
}

module.exports = RedisStore;
