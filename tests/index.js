import test from 'ava';
import request from 'request-promise';
import { incomingUpdateFixtures } from 'botmaster-test-fixtures';
import Botmaster from 'botmaster';
import { MockBot } from 'botmaster/tests';
import SessionWare from 'botmaster-session-ware';
import RedisStore from '../lib';

test.beforeEach((t) => {
  return new Promise((resolve) => {
    t.context.botmaster = new Botmaster();
    t.context.bot = new MockBot({
      requiresWebhook: true,
      webhookEndpoint: 'webhook',
      type: 'express',
    });
    t.context.botmaster.addBot(t.context.bot);
    t.context.baseRequestOptions = {
      method: 'POST',
      uri: 'http://localhost:3000/express/webhook',
      body: {},
      json: true,
      resolveWithFullResponse: true,
    };
    t.context.botmaster.on('listening', resolve);
  });
});

test.afterEach((t) => {
  return new Promise((resolve) => {
    t.context.botmaster.server.close(resolve);
  });
});

test('Works as expected when settings are correctly setup', (t) => {
  t.plan(2);

  let pass = 0;
  return new Promise((resolve) => {
    // custom middleware that "uses" watson stuff,
    t.context.botmaster.use({
      type: 'incoming',
      controller: async (bot, update) => {
        const object = {
          some: 'object',
          that: {
            shouldBe: 'same',
          },
        };
        if (pass === 0) {
          t.falsy(update.session.object);
          update.session.object = object;
          pass += 1;
          bot.reply(update, 'hi there');
        } else if (pass === 1) {
          t.deepEqual(update.session.object, object);
          resolve();
        }
      },
    });

    // add necessary wrapped middleware.
    const { incoming, outgoing } = SessionWare({ adapter: new RedisStore() });
    t.context.botmaster.useWrapped(incoming, outgoing);

    // just making another request after the first has been fully processed by botmaster
    t.context.botmaster.useWrapped({
      type: 'incoming',
      controller: async () => {},
    }, {
      type: 'outgoing',
      controller: async () => {
        request(t.context.baseRequestOptions);
      },
    });

    // make request that will start it all
    t.context.baseRequestOptions.body = incomingUpdateFixtures.textUpdate();
    request(t.context.baseRequestOptions);
  });
});

