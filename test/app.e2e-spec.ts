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
    await app.close();
  });

  afterEach(async () => {
    const db = app.get<Model<Account>>(
      getModelToken(accountModelDefinition.name)
    );
    await db.remove({});
  });

  describe("User signup with username and password", () => {
    const user = { username: "jack", password: "jack" };

    it("Creates a new account if the username is unique", async () => {
      const r = await request(app.getHttpServer())
        .post("/account")
        .send(user);

      expect(r.status).toEqual(HttpStatus.CREATED);
    });

    it("Rejects the request if the username is not unique", async () => {
      await request(app.getHttpServer())
        .post("/account")
        .send(user);

      const r = await request(app.getHttpServer())
        .post("/account")
        .send(user);

      expect(r.status).toEqual(HttpStatus.CONFLICT);
      expect(r.body.error.code).toEqual("account/duplicate");
    });

    it("Rejects the request if the password is empty", async () => {
      const r = await request(app.getHttpServer())
        .post("/account")
        .send({ username: "joe" });

      expect(r.status).toEqual(HttpStatus.BAD_REQUEST);
      expect(r.body.error.code).toEqual("account/password_required");
    });
  });

  describe("User signin using JWT", () => {
    const account = { username: "jack", password: "jack" };

    beforeAll(async () => {
      console.log("beforeAll");
      await request(app.getHttpServer())
        .post("/account")
        .send(account);
    });

    it("On success, returns a JWT token", async () => {
      const r = await request(app.getHttpServer())
        .post("/auth/login")
        .send(account);
      const decodedToken: any = decode(r.body.data.token, { complete: true });

      expect(decodedToken.payload.sub).toEqual("jack");
    });
  });
});
