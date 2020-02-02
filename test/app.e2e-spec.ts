import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, HttpStatus } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "./../src/app.module";
import { getModelToken } from "@nestjs/mongoose";
import { Account } from "../src/account";
import { Model, connections, disconnect } from "mongoose";
import { decode } from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Tweet } from "../src/tweets/tweet";
import { tweetModelDefinition, TweetModel } from "../src/tweets/tweet.model";
import { range } from "ramda";

const mongod = new MongoMemoryServer({
  instance: { port: 27017, dbName: "twclone" },
  autoStart: true
});

describe("AppController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    await mongod.ensureInstance();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    connections.forEach(async c => await c.close());
    await disconnect();
    await mongod.stop();
    await app.close();
  });

  describe("User signup with username and password", () => {
    it("Creates a new account if the username is unique", async () => {
      const userJack = { username: "jack", password: "jack" };

      const r = await createAccount(app, userJack);

      expect(r.status).toEqual(HttpStatus.CREATED);
    });

    it("Rejects the request if the username is not unique", async () => {
      const newUser = { username: "bailey", password: "bailey" };
      await createAccount(app, newUser);

      // If the previous request succeeded, this request should fail.
      const r = await createAccount(app, newUser);

      expect(r.status).toEqual(HttpStatus.CONFLICT);
      expect(r.body.error.code).toEqual("account/duplicate");
    });

    it("Rejects the request if the password is empty", async () => {
      const r = await createAccount(app, { username: "joe", password: "" });

      expect(r.status).toEqual(HttpStatus.BAD_REQUEST);
      expect(r.body.error.code).toEqual("account/password_required");
    });
  });

  describe("User signin using JWT", () => {
    const account = { username: "jack", password: "jack" };

    it("On success, returns a JWT token", async () => {
      await createAccount(app, account);
      const r = await login(app, account);
      const decodedToken: any = decode(r.body.data.token, { complete: true });

      expect(decodedToken.payload.sub).toEqual("jack");
    });
  });

  describe("Account A following account B", () => {
    const accountA = { username: "jack", password: "jack" };
    const accountB = { username: "jane", password: "jane" };

    beforeAll(async () => {
      await createAccount(app, accountA);
      await createAccount(app, accountB);
    });

    it("On success, adds A's username to B's followers list.", async () => {
      const loginResponse = await login(app, accountA);
      const token = loginResponse.body.data.token;
      const r = await followAccount(app, token, accountB.username);

      const accountAUpdated: Account = r.body.data;
      expect(r.ok).toBeTruthy();
      expect(accountAUpdated.following).toContain(accountB.username);
    });

    it("Returns an error if account B does not exist.", async () => {
      const loginResponse = await login(app, accountA);
      const token = loginResponse.body.data.token;
      const r = await followAccount(app, token, "fake_account");

      expect(r.badRequest).toBeTruthy();
      expect(r.body.error.code).toEqual("account/unknown_account");
    });
  });

  describe("Tweet, replies, and timelines", () => {
    let tweetsDb: Model<TweetModel>;
    let token: string;

    beforeAll(async () => {
      await createAccount(app, { username: "me", password: "me" });
      const loginResponse = await login(app, {
        username: "me",
        password: "me"
      });
      token = loginResponse.body.data.token;
    });

    beforeEach(async () => {
      tweetsDb = app.get(getModelToken(tweetModelDefinition.name));
      return tweetsDb.remove({});
    });

    describe("Posting a tweet", () => {
      const tweetMessage = "The quick brown fox jumps over the lazy dog.";

      it("Requires an authenticated account", async () => {
        const r = await postTweet(app, { message: tweetMessage }, "");

        expect(r.unauthorized).toBeTruthy();
        expect(r.body.error.code).toEqual("auth/token_required");
      });

      it("Given an authenticated account, creates the tweet for that account", async () => {
        const r = await postTweet(app, { message: tweetMessage }, token);

        expect(r.status).toEqual(HttpStatus.CREATED);
        expect(r.body.data.message).toEqual(tweetMessage);
      });
    });

    describe("Replying to a tweet", () => {
      const tweetMessage = "The quick brown fox jumps over the lazy dog.";

      it("Requires an authenticated account", async () => {
        const r = await postTweet(app, { message: tweetMessage }, "");

        expect(r.unauthorized).toBeTruthy();
        expect(r.body.error.code).toEqual("auth/token_required");
      });

      it("Given an existing tweet, it associates the reply with the first tweet.", async () => {
        const firstTweet = await postTweet(
          app,
          { message: tweetMessage },
          token
        );
        const firstTweetId = firstTweet.body.data.id;

        const {
          body: { data },
          status
        } = await postTweet(
          app,
          { message: "Yea, that fox was quick.", inReplyTo: firstTweetId },
          token
        );

        expect(status).toEqual(HttpStatus.CREATED);
        expect(data.inReplyTo).toEqual(firstTweetId);
      });

      it("Requires an existing tweet in order to post a reply", async () => {
        const firstTweet = "non-existent-id";

        const r = await postTweet(
          app,
          { message: "This should fail.", inReplyTo: firstTweet },
          token
        );

        expect(r.notFound).toBeTruthy();
        expect(r.body.error.code).toEqual("tweets/not_found");
      });
    });

    describe("Viewing own timeline", () => {
      it("Returns a list of tweets posted by an account", async () => {
        const tweetMessages = await seedTweetsDb(app, "me", tweetsDb);

        const r = await request(app.getHttpServer())
          .get("/tweets")
          .auth(token, { type: "bearer" })
          .query({ author: "me" });

        const tweets: Tweet[] = r.body.data;
        expect(r.ok).toBeTruthy();
        expect(tweets.length).toEqual(tweetMessages.length);
        tweets.forEach(t => expect(t.author).toBe("me"));
      });
    });

    describe("Searching for tweets and users", () => {
      it("Without a 'q' query, returns nothing", async () => {
        const r = await request(app.getHttpServer())
          .get("/search")
          .query({});

        expect(r.ok).toBeTruthy();
        expect(r.body.data.accounts).toHaveLength(0);
        expect(r.body.data.tweets).toHaveLength(0);
      });

      it("Without a 'type' query, searches both accounts and tweets", async () => {
        await seedTweetsDb(
          app,
          "jack",
          tweetsDb,
          "The quick brown fox jumps over the lazy dog."
        );
        const r = await request(app.getHttpServer())
          .get("/search")
          .query({ q: "jack is a lazy fox" });

        expect(r.ok).toBeTruthy();
        expect(r.body.data.accounts).toMatchObject([{ username: "jack" }]);
        expect(r.body.data.tweets).toMatchObject([
          {
            message: "The quick brown fox jumps over the lazy dog."
          }
        ]);
      });

      it("Given a 'type' query, searches only that resource", async () => {
        const r = await request(app.getHttpServer())
          .get("/search")
          .query({ q: "jack is a lazy fox", type: "account" });

        expect(r.ok).toBeTruthy();
        expect(r.body.data.accounts).toMatchObject([{ username: "jack" }]);
        expect(r.body.data.tweets).toHaveLength(0);
      });
    });
  });
});

async function seedTweetsDb(
  app: INestApplication,
  author: string,
  db: Model<TweetModel>,
  ...messages: string[]
) {
  const tweetMessages = messages.map(message => ({ message, author }));
  if (tweetMessages.length === 0) {
    const randomMessages = range(0, 100).map((_v, idx) => {
      const message = Math.pow(idx, 10).toString();
      return { message, author };
    });
    tweetMessages.push(...randomMessages);
  }
  const tweets = await db.insertMany(tweetMessages);
  return tweets;
}

function postTweet(
  app: INestApplication,
  data: { message: string; inReplyTo?: string },
  authToken: string
) {
  return request(app.getHttpServer())
    .post("/tweets")
    .auth(authToken, { type: "bearer" })
    .send(data);
}

function followAccount(app: INestApplication, token: string, username: string) {
  return request(app.getHttpServer())
    .put("/account/following")
    .auth(token, { type: "bearer" })
    .send({ username });
}

async function login(
  app: INestApplication,
  account: { username: string; password: string }
) {
  return request(app.getHttpServer())
    .post("/auth/login")
    .send(account);
}

async function createAccount(
  app: INestApplication,
  account: { username: string; password: string }
) {
  return request(app.getHttpServer())
    .post("/account")
    .send(account);
}
