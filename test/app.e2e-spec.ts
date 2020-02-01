import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, HttpStatus } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "./../src/app.module";
import { getModelToken } from "@nestjs/mongoose";
import { accountModelDefinition, Account } from "../src/account";
import { Model } from "mongoose";
import { decode } from "jsonwebtoken";

describe("AppController (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    const db = app.get<Model<Account>>(
      getModelToken(accountModelDefinition.name)
    );
    await db.remove({});
    await app.close();
  });

  describe("User signup with username and password", () => {
    const user = { username: "jack", password: "jack" };

    it("Creates a new account if the username is unique", async () => {
      const r = await createAccount(app, user);

      expect(r.status).toEqual(HttpStatus.CREATED);
    });

    it("Rejects the request if the username is not unique", async () => {
      await createAccount(app, user);

      const r = await createAccount(app, user);

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
});

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
