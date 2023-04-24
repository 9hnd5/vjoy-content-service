import { API_TOKEN, expectError, generateNumber, signin, User } from "@common";
import { HttpStatus, INestApplication } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Test } from "@nestjs/testing";
import { AppModule } from "app.module";
import * as request from "supertest";
import { API_CONTENT_PREFIX } from "../test.contants";
import { KidLearningData } from "entities/kid-learning-data.entity";

describe("Kid Learning Data E2E", () => {
  let app: INestApplication;
  let adminToken = "";
  const apiToken = API_TOKEN;
  let agent: request.SuperAgentTest;
  let kidLearningDataModel: typeof KidLearningData;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, SequelizeModule.forFeature([KidLearningData])],
    }).compile();
    kidLearningDataModel = moduleRef.get("KidLearningDataRepository");
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
    app && (await app.close());
  });

  describe("Buy Energy (Post)api/kid-learning-data/:kidId/energy", () => {
    let data: KidLearningData["dataValues"];

    beforeAll(async () => {
      const result = await kidLearningDataModel.create({
        kidId: -generateNumber(4),
        gem: 1000,
        coin: 1000,
        energy: 0,
        countBuyEnergy: 0,
        lastBuyEnergy: new Date(),
      });
      data = result.dataValues;
    });

    afterAll(async () => {
      await kidLearningDataModel.destroy({ where: { kidId: data.kidId }, force: true });
    });

    it("should succeed buy the first time in a day", () => {
      return agent.post(`${API_CONTENT_PREFIX}/kid-learning-data/${data.kidId}/energy`).expect((res) => {
        const result = res.body.data;
        expect(result.energy).toBe(60);
        expect(result.coin).toBe(970);
        expect(result.countBuyEnergy).toBe(1);
      });
    });

    it("should succeed buy the second time in a day", () => {
      return agent.post(`${API_CONTENT_PREFIX}/kid-learning-data/${data.kidId}/energy`).expect((res) => {
        const result = res.body.data;
        expect(result.energy).toBe(120);
        expect(result.coin).toBe(920);
        expect(result.countBuyEnergy).toBe(2);
      });
    });

    it("should succeed buy the thirth time in a day", () => {
      return agent.post(`${API_CONTENT_PREFIX}/kid-learning-data/${data.kidId}/energy`).expect((res) => {
        const result = res.body.data;
        expect(result.energy).toBe(180);
        expect(result.coin).toBe(820);
        expect(result.countBuyEnergy).toBe(3);
      });
    });

    it("should succeed buy the fourth time in a day", () => {
      return agent.post(`${API_CONTENT_PREFIX}/kid-learning-data/${data.kidId}/energy`).expect((res) => {
        const result = res.body.data;
        expect(result.energy).toBe(240);
        expect(result.coin).toBe(720);
        expect(result.countBuyEnergy).toBe(4);
      });
    });

    it("should succeed buy the first time in previous day", async () => {
      const now = new Date();
      const previous = new Date(now.getTime());
      previous.setDate(now.getDate() - 1);
      await kidLearningDataModel.update({ lastBuyEnergy: previous }, { where: { kidId: data.kidId } });

      return agent.post(`${API_CONTENT_PREFIX}/kid-learning-data/${data.kidId}/energy`).expect((res) => {
        const result = res.body.data;
        expect(result.energy).toBe(300);
        expect(result.coin).toBe(690);
        expect(result.countBuyEnergy).toBe(1);
      });
    });

    it("should fail due to not enough coin", async () => {
      await kidLearningDataModel.update({ coin: 0 }, { where: { kidId: data.kidId } });

      return agent
        .post(`${API_CONTENT_PREFIX}/kid-learning-data/${data.kidId}/energy`)
        .expect((res) => expectError(res.body))
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should fail due to kid-learning-data not found", async () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-learning-data/-1/energy`)
        .expect((res) => expectError(res.body))
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
