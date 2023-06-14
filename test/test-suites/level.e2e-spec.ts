import { API_TOKEN, expectError, signin, User } from "@common";
import { HttpStatus, INestApplication } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Test } from "@nestjs/testing";
import { AppModule } from "app.module";
import * as request from "supertest";
import { API_CONTENT_PREFIX } from "../test.contants";

describe("Level E2E test", () => {
  let app: INestApplication;
  let adminToken = "";
  const apiToken = API_TOKEN;
  let agent: request.SuperAgentTest;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, SequelizeModule.forFeature([User])],
    }).compile();
    app = moduleRef.createNestApplication();
    app.enableVersioning();
    app.setGlobalPrefix("api");
    await app.init();

    agent = request.agent(app.getHttpServer());
    agent.set("api-token", apiToken);
    const { accessToken } = await signin();
    adminToken = accessToken;
    agent.set("authorization", `Bearer ${adminToken}`);
  });

  afterAll(async () => {
    app && (await app.close());
  });

  describe("Find all level (Get)api/levels", () => {
    it("should succeed due to user was authorized", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/levels`)
        .expect((res) => {
          const data = res.body.data;
          expect(data).toHaveProperty("count");
          expect(data).toHaveProperty("rows");
        })
        .expect(HttpStatus.OK);
    });

    it("should return pagination result correctly", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/levels/?page=1&pageSize=10`)
        .expect((res) => {
          const data = res.body.data;
          expect(data).toHaveProperty("count");
          expect(data).toHaveProperty("rows");
          expect(data.count).toBeGreaterThanOrEqual(0);
          expect(data.rows.length).toBeLessThanOrEqual(10);
        })
        .expect(HttpStatus.OK);
    });
  });

  describe("Find suggestion (Get)api/level-suggestion", () => {
    it("should return fail due to the null query passed", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/level-suggestion`)
        .expect((res) => expectError(res.body))
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should return fail due to the invalid query passed", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/level-suggestion?fromAge=a&toAge=b`)
        .expect((res) => expectError(res.body))
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should return English Pre A1 due to age between 6 - 8", () => {
      return agent.get(`${API_CONTENT_PREFIX}/level-suggestion?fromAge=6&toAge=8`).expect((res) => {
        expect(res.body.data).toEqual({ id: "eng-preA1", name: "English Pre A1" });
      });
    });

    it("should return English A1 due to age between 9 - 11", () => {
      return agent.get(`${API_CONTENT_PREFIX}/level-suggestion?fromAge=9&toAge=11`).expect((res) => {
        expect(res.body.data).toEqual({ id: "eng-A1", name: "English A1" });
      });
    });

    it("should return English A1 due to age greater 11", () => {
      return agent.get(`${API_CONTENT_PREFIX}/level-suggestion?fromAge=11`).expect((res) => {
        expect(res.body.data).toEqual({ id: "eng-A2", name: "English A2" });
      });
    });
  });
});
