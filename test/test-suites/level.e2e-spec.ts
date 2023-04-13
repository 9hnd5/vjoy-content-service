import { API_TOKEN, createUser, expectError, ROLE_CODE, signin, User } from "@common";
import { HttpStatus, INestApplication } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Test } from "@nestjs/testing";
import { AppModule } from "app.module";
import * as crypto from "crypto";
import * as request from "supertest";
import { API_CONTENT_PREFIX } from "../test.contants";

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

    it("should succeed due to user was authorized", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/levels`)
        .set("Authorization", `Bearer ${userToken}`)
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
        .set("Authorization", `Bearer ${userToken}`)
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
        .set("Authorization", `Bearer ${adminToken}`)
        .expect((res) => expectError(res.body))
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should return fail due to the invalid query passed", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/level-suggestion?filter[dob]=abc`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect((res) => expectError(res.body))
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should return English Pre A1 due to dob in 2015", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/level-suggestion?filter[dob]=02-09-2015`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect((res) => {
          expect(res.body.data).toEqual({ id: "eng-preA1", name: "English Pre A1" });
        });
    });

    it("should return English Pre A1 due to dob onwards 2015(bellow 8 years old)", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/level-suggestion?filter[dob]=02-09-2016`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect((res) => {
          expect(res.body.data).toEqual({ id: "eng-preA1", name: "English Pre A1" });
        });
    });

    it("should return English A1 due to dob in 2012", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/level-suggestion?filter[dob]=02-09-2012`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect((res) => {
          expect(res.body.data).toEqual({ id: "eng-A1", name: "English A1" });
        });
    });

    it("should return English A1 due to dob from 2012-2014", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/level-suggestion?filter[dob]=02-09-2013`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect((res) => {
          expect(res.body.data).toEqual({ id: "eng-A1", name: "English A1" });
        });
    });

    it("should return English A1 due to dob in 2014", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/level-suggestion?filter[dob]=02-09-2014`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect((res) => {
          expect(res.body.data).toEqual({ id: "eng-A1", name: "English A1" });
        });
    });

    it("should return English A2 due to dob in 2011", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/level-suggestion?filter[dob]=02-09-2011`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect((res) => {
          expect(res.body.data).toEqual({ id: "eng-A2", name: "English A2" });
        });
    });

    it("should return English A2 due to dob before 2011", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/level-suggestion?filter[dob]=02-09-2010`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect((res) => {
          expect(res.body.data).toEqual({ id: "eng-A2", name: "English A2" });
        });
    });
  });
});
