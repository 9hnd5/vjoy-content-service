import { API_TOKEN, createUser, expectError, ROLE_CODE, signin, User } from "@common";
import { HttpStatus, INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "app.module";
import * as request from "supertest";
import * as crypto from "crypto";
import { API_CONTENT_PREFIX } from "../test.contants";
import { SequelizeModule } from "@nestjs/sequelize";

describe("Level E2E test", () => {
  let app: INestApplication;
  let adminToken = "";
  let userToken = "";
  let user: any;
  let userModel: typeof User;
  const apiToken = API_TOKEN;
  let agent: request.SuperAgentTest;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, SequelizeModule.forFeature([User])],
    }).compile();
    userModel = moduleRef.get("UserRepository");
    app = moduleRef.createNestApplication();
    app.enableVersioning();
    app.setGlobalPrefix("api");
    await app.init();

    agent = request.agent(app.getHttpServer());
    agent.set("api-token", apiToken);
    const { accessToken: adToken } = await signin();
    adminToken = adToken;

    user = await createUser({
      newUser: {
        firstname: "APITEST-firstname",
        lastname: "APITEST-lastname",
        email: `APITEST-${crypto.randomUUID()}@gmail.com`,
        roleCode: ROLE_CODE.PARENT,
        password: "123456",
      },
      accessToken: adminToken,
    });
    const { accessToken } = await signin({ email: user.email!, password: "123456" });
    userToken = accessToken;
  });

  afterAll(async () => {
    user && (await userModel.destroy({ where: { id: user.id }, force: true }));
    app && (await app.close());
  });

  describe("Find all level (Get)api/levels", () => {
    it("should fail due to user was unauthorized", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/levels`)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect((res) => expectError(res.body));
    });

    it("should fail due to user not enough permission", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/levels`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) => expectError(res.body));
    });

    it("should succeed due to user was authorized", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/levels`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          const data = res.body.data;
          expect(data).toHaveProperty("count");
          expect(data).toHaveProperty("rows");
        });
    });

    it("should return pagination result correctly", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/levels/?page=1&pageSize=10`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          const data = res.body.data;
          expect(data).toHaveProperty("count");
          expect(data).toHaveProperty("rows");
          expect(data.count).toBeGreaterThanOrEqual(0);
          expect(data.rows.length).toBeLessThanOrEqual(10);
        });
    });
  });
});
