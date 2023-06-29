import { API_TOKEN, ERROR_CODE, KidDetail, User, signin } from "@common";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "app.module";
import { COST_COIN, ENERGY_BUY_WITH_COIN, KidData } from "entities/kid-data.entity";
import * as request from "supertest";
import { API_CONTENT_PREFIX } from "../test.contants";

describe("Kid Data E2E", () => {
  let app: INestApplication;
  let adminToken = "";
  const apiToken = API_TOKEN;
  let agent: request.SuperAgentTest;
  let kidDataModel: typeof KidData;
  let userModel: typeof User;
  let kidDetailModel: typeof KidDetail;
  let result: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    userModel = moduleRef.get("UserRepository");
    kidDataModel = moduleRef.get("KidDataRepository");
    kidDetailModel = moduleRef.get("KidDetailRepository");
    app = moduleRef.createNestApplication();
    app.enableVersioning();
    app.setGlobalPrefix("api");
    await app.init();

    agent = request.agent(app.getHttpServer());
    const { accessToken } = await signin();
    adminToken = accessToken;
    agent.set("api-token", apiToken);
    agent.set("authorization", `Bearer ${adminToken}`);
  });

  afterAll(async () => {
    await userModel.destroy({ where: { id: result.kidId } });
    await kidDetailModel.destroy({ where: { kidId: result.kidId } });
    await kidDataModel.destroy({ where: { kidId: result.kidId } });
    app && (await app.close());
  });

  describe("Create kid-data (Post)api/kid-data", () => {
    let data: any;

    beforeAll(() => {
      data = {
        currentLevelId: "PreA1",
        buddyId: "1",
        parentId: 1,
        character: "test-character",
        kidName: "test-kid-name",
      };
    });

    it("should failed due to empty data", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-data`)
        .send({})
        .expect((res) => {
          const errors = res.body.errors;
          expect(errors).toEqual([
            { code: "isIn", message: expect.any(String) }, //currentLevelId
            { code: "isNotEmpty", message: expect.any(String) }, //buddyId
            { code: "isNotEmpty", message: expect.any(String) }, //parentId
            { code: "isNotEmpty", message: expect.any(String) }, //character
            { code: "isNotEmpty", message: expect.any(String) }, //kidName
          ]);
        });
    });

    it("should failed due to invalid currentLevelId", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-data`)
        .send({ ...data, currentLevelId: "test" })
        .expect((res) => {
          const errors = res.body.errors;
          expect(errors).toEqual([{ code: "isIn", message: expect.any(String) }]);
        });
    });

    it("should failed due to invalid parentId", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-data`)
        .send({ ...data, parentId: "-1" })
        .expect((res) => {
          const errors = res.body.errors;
          expect(errors).toEqual([{ code: ERROR_CODE.USER_NOT_FOUND, message: expect.any(String) }]);
        });
    });

    it("should succeed create kid-data", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-data`)
        .send(data)
        .expect((res) => {
          const rs = res.body.data;
          expect(rs.currentLevelId).toBe(data.currentLevelId);
          expect(rs.buddyId).toBe(data.buddyId);
          result = rs;
        });
    });
  });

  describe("Get kid-data energy (Get)api/kid-data/:kidId/energy", () => {
    it("it should fail due to invalid kidId", () => {
      return agent.get(`${API_CONTENT_PREFIX}/kid-data/-1/energy`).expect((res) => {
        const errors = res.body.errors;
        expect(errors).toEqual([{ code: ERROR_CODE.USER_NOT_FOUND, message: expect.any(String) }]);
      });
    });

    it("it should success return energy", () => {
      return agent.get(`${API_CONTENT_PREFIX}/kid-data/${result.kidId}/energy`).expect((res) => {
        const rs = res.body.data;
        expect(rs.energy).not.toBeNull();
      });
    });
  });

  describe("Buy kid-data energy (Post)api/kid-data/:kidId/energy", () => {
    it("it should fail due to invalid kidId", () => {
      return agent.get(`${API_CONTENT_PREFIX}/kid-data/-1/energy`).expect((res) => {
        const errors = res.body.errors;
        expect(errors).toEqual([{ code: ERROR_CODE.USER_NOT_FOUND, message: expect.any(String) }]);
      });
    });

    it("it should fail due to not enough coin", () => {
      return agent.post(`${API_CONTENT_PREFIX}/kid-data/${result.kidId}/energy`).expect((res) => {
        const errors = res.body.errors;
        expect(errors).toEqual([{ code: ERROR_CODE.NOT_ENOUGH_COIN, message: expect.any(String) }]);
      });
    });

    it("it should buy kid-data energy success first time", async () => {
      await kidDataModel.update({ energy: 0, coin: 1000 }, { where: { kidId: result.kidId } });
      return agent.post(`${API_CONTENT_PREFIX}/kid-data/${result.kidId}/energy`).expect((res) => {
        const rs = res.body.data;
        expect(rs.energy).toBe(ENERGY_BUY_WITH_COIN);
        expect(rs.coin).toBe(1000 - COST_COIN.FIRST_TIME);
      });
    });

    it("it should buy kid-data energy success second time", async () => {
      return agent.post(`${API_CONTENT_PREFIX}/kid-data/${result.kidId}/energy`).expect((res) => {
        const rs = res.body.data;
        expect(rs.energy).toBe(ENERGY_BUY_WITH_COIN * 2);
        expect(rs.coin).toBe(1000 - COST_COIN.FIRST_TIME - COST_COIN.SECOND_TIME);
      });
    });

    it("it should buy kid-data energy success thirth time", async () => {
      return agent.post(`${API_CONTENT_PREFIX}/kid-data/${result.kidId}/energy`).expect((res) => {
        const rs = res.body.data;
        expect(rs.energy).toBe(ENERGY_BUY_WITH_COIN * 2);
        expect(rs.coin).toBe(1000 - COST_COIN.FIRST_TIME - COST_COIN.SECOND_TIME - COST_COIN.THIRTH_TIME);
      });
    });
  });

  describe("Get kid-data star (Get)api/kid-data/:kidId/star", () => {
    it("it should fail due to invalid kidId", () => {
      return agent.get(`${API_CONTENT_PREFIX}/kid-data/-1/star`).expect((res) => {
        const errors = res.body.errors;
        expect(errors).toEqual([{ code: ERROR_CODE.USER_NOT_FOUND, message: expect.any(String) }]);
      });
    });

    it("it should success return star", () => {
      return agent.get(`${API_CONTENT_PREFIX}/kid-data/${result.kidId}/star`).expect((res) => {
        const rs = res.body.data;
        expect(rs.star).not.toBeNull();
      });
    });
  });
});
