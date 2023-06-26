import { API_TOKEN, expectError, expectErrors, generateNumber, signin } from "@common";
import { HttpStatus, INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "app.module";
import { GameRule } from "entities/game-rule.entity";
import { KidLearningData } from "entities/kid-learning-data.entity";
import { KID_LESSON_PROGRESS_STAR, KidLessonProgress } from "entities/kid-lesson-progress.entity";
import {
  COST_COIN,
  ENERGY_BUY_WITH_COIN,
  ENERGY_PER_MINUTE,
  MAX_ENERGY,
} from "modules/kid-learning-data/kid-learning-data.constants";
import * as request from "supertest";
import { API_CONTENT_PREFIX } from "../test.contants";

describe("Kid Learning Data E2E", () => {
  let app: INestApplication;
  let adminToken = "";
  const apiToken = API_TOKEN;
  let agent: request.SuperAgentTest;
  let kidLearningDataModel: typeof KidLearningData;
  let kidLessonProgresses: typeof KidLessonProgress;
  let gameRuleModel: typeof GameRule;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    kidLearningDataModel = moduleRef.get("KidLearningDataRepository");
    kidLessonProgresses = moduleRef.get("KidLessonProgressRepository");
    gameRuleModel = moduleRef.get("GameRuleRepository");
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

  describe("Create kid-learning-data (Post)api/kid-learning-data", () => {
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

    it("should failed due to invalid data", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-learning-data`)
        .send({})
        .expect((res) => expectErrors(res.body));
    });

    it("should failed due to invalid currentLevelId", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-learning-data`)
        .send({ ...data, currentLevelId: "test" })
        .expect((res) => expectErrors(res.body));
    });

    it("should failed due to invalid parentId", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-learning-data`)
        .send({ ...data, parentId: "-1" })
        .expect((res) => expectErrors(res.body));
    });

    it("should succeed create kid-learning-datat", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-learning-data`)
        .send(data)
        .expect((res) => {
          const result = res.body.data;
          expect(result.currentLevelId).toBe(data.currentLevelId);
          expect(result.buddyId).toBe(data.buddyId);
        });
    });
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
        lastBoughtEnergy: new Date(),
        lastUpdatedEnergy: new Date(),
      });
      data = result.dataValues;
    });

    afterAll(async () => {
      await kidLearningDataModel.destroy({ where: { kidId: data.kidId }, force: true });
    });

    it("should succeed buy the first time in a day", () => {
      return agent.post(`${API_CONTENT_PREFIX}/kid-learning-data/${data.kidId}/energy`).expect((res) => {
        const result = res.body.data;
        expect(result.energy).toBe(data.energy + ENERGY_BUY_WITH_COIN);
        expect(result.coin).toBe(data.coin - COST_COIN.FIRST_TIME);
        expect(result.countBuyEnergy).toBe(1);
        data = result;
      });
    });

    it("should succeed buy the second time in a day", () => {
      return agent.post(`${API_CONTENT_PREFIX}/kid-learning-data/${data.kidId}/energy`).expect((res) => {
        const result = res.body.data;
        expect(result.energy).toBe(data.energy + ENERGY_BUY_WITH_COIN);
        expect(result.coin).toBe(data.coin - COST_COIN.SECOND_TIME);
        expect(result.countBuyEnergy).toBe(2);
        data = result;
      });
    });

    it("should succeed buy the thirth time in a day", () => {
      return agent.post(`${API_CONTENT_PREFIX}/kid-learning-data/${data.kidId}/energy`).expect((res) => {
        const result = res.body.data;
        expect(result.energy).toBe(data.energy + ENERGY_BUY_WITH_COIN);
        expect(result.coin).toBe(data.coin - COST_COIN.THIRTH_TIME);
        expect(result.countBuyEnergy).toBe(3);
        data = result;
      });
    });

    it("should succeed buy the fourth time in a day", () => {
      return agent.post(`${API_CONTENT_PREFIX}/kid-learning-data/${data.kidId}/energy`).expect((res) => {
        const result = res.body.data;
        expect(result.energy).toBe(data.energy + ENERGY_BUY_WITH_COIN);
        expect(result.coin).toBe(data.coin - COST_COIN.THIRTH_TIME);
        expect(result.countBuyEnergy).toBe(4);
        data = result;
      });
    });

    it("should succeed buy the first time in previous day", async () => {
      const now = new Date();
      const previous = new Date(now.getTime());
      previous.setDate(now.getDate() - 1);
      await kidLearningDataModel.update({ lastBoughtEnergy: previous }, { where: { kidId: data.kidId } });

      return agent.post(`${API_CONTENT_PREFIX}/kid-learning-data/${data.kidId}/energy`).expect((res) => {
        const result = res.body.data;
        expect(result.energy).toBe(data.energy + ENERGY_BUY_WITH_COIN);
        expect(result.coin).toBe(data.coin - COST_COIN.FIRST_TIME);
        expect(result.countBuyEnergy).toBe(1);
        data = result;
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

  describe("Update energy(Post) api/kid-learning-data/:kidId/energy", () => {
    let data: KidLearningData["dataValues"];

    beforeAll(async () => {
      const previous5Minute = new Date(Date.now() - 5 * 60 * 1000);
      const result = await kidLearningDataModel.create({
        kidId: -generateNumber(4),
        gem: 1000,
        coin: 1000,
        energy: 119,
        countBuyEnergy: 0,
        lastBoughtEnergy: new Date(),
        lastUpdatedEnergy: previous5Minute,
      });
      data = result.dataValues;
    });

    afterAll(async () => {
      await kidLearningDataModel.destroy({ where: { kidId: data.kidId }, force: true });
    });

    it("should succeed update energy auto after 5 minutes", () => {
      return agent.patch(`${API_CONTENT_PREFIX}/kid-learning-data/${data.kidId}/energy`).expect((res) => {
        const result = res.body.data;
        expect(result.energy).toBe(data.energy + 5 * ENERGY_PER_MINUTE);
        data = result;
      });
    });

    it("should succeed update energy auto less than 5 minutes", async () => {
      const previous4Minute = new Date(Date.now() - 4 * 60 * 1000);
      await kidLearningDataModel.update({ lastUpdatedEnergy: previous4Minute }, { where: { kidId: data.kidId } });

      return agent.patch(`${API_CONTENT_PREFIX}/kid-learning-data/${data.kidId}/energy`).expect((res) => {
        const result = res.body.data;
        expect(result.energy).toBe(data.energy);
        data = result;
      });
    });

    it("should succeed update energy auto after 5 minutes but maximum 120", () => {
      return agent.patch(`${API_CONTENT_PREFIX}/kid-learning-data/${data.kidId}/energy`).expect((res) => {
        const result = res.body.data;
        expect(result.energy).toBe(MAX_ENERGY);
        data = result;
      });
    });

    it("should succeed update energy manual", () => {
      return agent
        .patch(`${API_CONTENT_PREFIX}/kid-learning-data/${data.kidId}/energy`)
        .send({ energy: -25 })
        .expect((res) => {
          const result = res.body.data;
          expect(result.energy).toBe(data.energy - 25);
          data = result;
        });
    });

    it("should fail due to invalid data", () => {
      return agent
        .patch(`${API_CONTENT_PREFIX}/kid-learning-data/${data.kidId}/energy`)
        .send({ energy: 25 })
        .expect((res) => expectError(res.body));
    });

    it("should fail due to invalid kidId", () => {
      return agent
        .patch(`${API_CONTENT_PREFIX}/kid-learning-data/${-11}/energy`)
        .expect((res) => expectError(res.body));
    });

    it("should fail due to invalid data(energy = -1000)", () => {
      return agent
        .patch(`${API_CONTENT_PREFIX}/kid-learning-data/${data.kidId}/energy`)
        .send({ energy: -1000 })
        .expect((res) => expectError(res.body));
    });
  });

  ["lesson", "challenge"].forEach((item) => {
    describe("Create or Update kid-lesson-progress (Post)api/kid-learning-data/:id/kid-lesson-progresses", () => {
      let learningData: KidLearningData["dataValues"];
      let gameRule: GameRule["dataValues"];
      const data = {
        levelId: "PreA1",
        unitId: "PreA1_U1",
        lessonId: "test-lesson",
        star: KID_LESSON_PROGRESS_STAR.EASY,
        type: item,
        isWin: true,
      };

      beforeAll(async () => {
        const learningDataResult = await kidLearningDataModel.create({
          kidId: -generateNumber(4),
          gem: 0,
          coin: 0,
          energy: 1000,
          countBuyEnergy: 0,
          lastBoughtEnergy: new Date(),
          lastUpdatedEnergy: new Date(),
        });
        learningData = learningDataResult.dataValues;

        const gamRuleResult = await gameRuleModel.create({
          levelId: data.levelId,
          unitId: data.unitId,
          type: item as any,
          firstPlayReward: 5,
          replayFailureReward: 1,
          replaySuccessReward: 3,
          energyCost: 6,
        });
        gameRule = gamRuleResult["dataValues"];
      });

      afterAll(async () => {
        await kidLearningDataModel.destroy({ where: { kidId: learningData.kidId }, force: true });

        await kidLessonProgresses.destroy({ where: { learningDataId: learningData.kidId }, force: true });

        await gameRuleModel.destroy({
          where: { levelId: gameRule.levelId, unitId: gameRule.unitId, type: gameRule.type },
          force: true,
        });
      });

      it(`should fail due to invalid data ${item.toUpperCase()}`, () => {
        return agent
          .post(`${API_CONTENT_PREFIX}/kid-learning-data/${learningData.kidId}/kid-lesson-progresses`)
          .send({})
          .expect((res) => {
            expectError(res.body);
            const error = res.body.errors;
            expect(error).toEqual([
              {
                code: "isString",
                message: expect.any(String),
              },
              {
                code: "isIn",
                message: expect.any(String),
              },
              {
                code: "matches",
                message: expect.any(String),
              },
              {
                code: "isBoolean",
                message: expect.any(String),
              },
            ]);
          });
      });

      it(`should fail due to invalid star = HARD at the first time ${item.toUpperCase()}`, () => {
        return agent
          .post(`${API_CONTENT_PREFIX}/kid-learning-data/${learningData.kidId}/kid-lesson-progresses`)
          .send({ ...data, star: KID_LESSON_PROGRESS_STAR.HARD })
          .expect((res) => {
            expectError(res.body);
          });
      });

      it(`should succeed due to first play and win ${item.toUpperCase()}`, () => {
        return agent
          .post(`${API_CONTENT_PREFIX}/kid-learning-data/${learningData.kidId}/kid-lesson-progresses`)
          .send(data)
          .expect((res) => {
            const result = res.body.data as KidLearningData["dataValues"] & {
              kidLessonProgresses: KidLessonProgress["dataValues"][];
            };
            expect(result.energy).toBe(learningData.energy - gameRule.energyCost);
            expect(result.coin).toBe(learningData.coin + gameRule.firstPlayReward);

            const lessonProgress = result.kidLessonProgresses.find((x) => x.learningDataId === result.kidId)!;
            expect(lessonProgress.star).toBe(1);
            learningData = result;
          });
      });

      it(`should succeed due to replay and win with same star = EASY ${item.toUpperCase()}`, () => {
        return agent
          .post(`${API_CONTENT_PREFIX}/kid-learning-data/${learningData.kidId}/kid-lesson-progresses`)
          .send(data)
          .expect((res) => {
            const result = res.body.data as KidLearningData["dataValues"] & {
              kidLessonProgresses: KidLessonProgress["dataValues"][];
            };
            expect(result.energy).toBe(learningData.energy - gameRule.energyCost);
            expect(result.coin).toBe(learningData.coin + gameRule.replaySuccessReward);

            const lessonProgress = result.kidLessonProgresses.find((x) => x.learningDataId === result.kidId)!;
            expect(lessonProgress.star).toBe(1);
            learningData = result;
          });
      });

      it(`should succeed due to replay and fail with same star = EASY ${item.toUpperCase()}`, () => {
        return agent
          .post(`${API_CONTENT_PREFIX}/kid-learning-data/${learningData.kidId}/kid-lesson-progresses`)
          .send({ ...data, isWin: false })
          .expect((res) => {
            const result = res.body.data as KidLearningData["dataValues"] & {
              kidLessonProgresses: KidLessonProgress["dataValues"][];
            };
            expect(result.energy).toBe(learningData.energy - gameRule.energyCost);
            expect(result.coin).toBe(learningData.coin + gameRule.replayFailureReward);

            const lessonProgress = result.kidLessonProgresses.find((x) => x.learningDataId === result.kidId)!;
            expect(lessonProgress.star).toBe(1);
            learningData = result;
          });
      });

      it(`should fail due to replay with invalid star = HARD ${item.toUpperCase()}`, () => {
        return agent
          .post(`${API_CONTENT_PREFIX}/kid-learning-data/${learningData.kidId}/kid-lesson-progresses`)
          .send({ ...data, star: KID_LESSON_PROGRESS_STAR.HARD })
          .expect((res) => expectError(res.body));
      });

      it(`should succeed due to replay and win with different star = MEDIUM ${item.toUpperCase()}`, () => {
        return agent
          .post(`${API_CONTENT_PREFIX}/kid-learning-data/${learningData.kidId}/kid-lesson-progresses`)
          .send({ ...data, star: KID_LESSON_PROGRESS_STAR.MEDIUM })
          .expect((res) => {
            const result = res.body.data as KidLearningData["dataValues"] & {
              kidLessonProgresses: KidLessonProgress["dataValues"][];
            };
            expect(result.energy).toBe(learningData.energy - gameRule.energyCost);
            expect(result.coin).toBe(learningData.coin + gameRule.firstPlayReward);

            const lessonProgress = result.kidLessonProgresses.find((x) => x.learningDataId === result.kidId)!;
            expect(lessonProgress.star).toBe(2);
            learningData = result;
          });
      });

      it(`should succeed due to replay and win with different star = MEDIUM ${item.toUpperCase()}`, () => {
        return agent
          .post(`${API_CONTENT_PREFIX}/kid-learning-data/${learningData.kidId}/kid-lesson-progresses`)
          .send({ ...data, star: KID_LESSON_PROGRESS_STAR.MEDIUM })
          .expect((res) => {
            const result = res.body.data as KidLearningData["dataValues"] & {
              kidLessonProgresses: KidLessonProgress["dataValues"][];
            };
            expect(result.energy).toBe(learningData.energy - gameRule.energyCost);
            expect(result.coin).toBe(learningData.coin + gameRule.replaySuccessReward);

            const lessonProgress = result.kidLessonProgresses.find((x) => x.learningDataId === result.kidId)!;
            expect(lessonProgress.star).toBe(2);
            learningData = result;
          });
      });

      it(`should succeed due to replay and win with different star = HARD ${item.toUpperCase()}`, () => {
        return agent
          .post(`${API_CONTENT_PREFIX}/kid-learning-data/${learningData.kidId}/kid-lesson-progresses`)
          .send({ ...data, star: KID_LESSON_PROGRESS_STAR.HARD })
          .expect((res) => {
            const result = res.body.data as KidLearningData["dataValues"] & {
              kidLessonProgresses: KidLessonProgress["dataValues"][];
            };
            expect(result.energy).toBe(learningData.energy - gameRule.energyCost);
            expect(result.coin).toBe(learningData.coin + gameRule.firstPlayReward);
            expect(result.gem).toBe(0);

            const lessonProgress = result.kidLessonProgresses.find((x) => x.learningDataId === result.kidId)!;
            expect(lessonProgress.star).toBe(3);
            learningData = result;
          });
      });

      it(`should succeed due to replay and win with same star = HARD ${item.toUpperCase()}`, () => {
        return agent
          .post(`${API_CONTENT_PREFIX}/kid-learning-data/${learningData.kidId}/kid-lesson-progresses`)
          .send({ ...data, star: KID_LESSON_PROGRESS_STAR.HARD })
          .expect((res) => {
            const result = res.body.data as KidLearningData["dataValues"] & {
              kidLessonProgresses: KidLessonProgress["dataValues"][];
            };
            expect(result.energy).toBe(learningData.energy - gameRule.energyCost);
            expect(result.coin).toBe(learningData.coin + gameRule.replaySuccessReward);
            expect(result.gem).toBe(1);

            const lessonProgress = result.kidLessonProgresses.find((x) => x.learningDataId === result.kidId)!;
            expect(lessonProgress.star).toBe(3);
            learningData = result;
          });
      });

      it(`should succeed due to replay and win with different star = MEDIUM ${item.toUpperCase()}`, () => {
        return agent
          .post(`${API_CONTENT_PREFIX}/kid-learning-data/${learningData.kidId}/kid-lesson-progresses`)
          .send({ ...data, star: KID_LESSON_PROGRESS_STAR.MEDIUM })
          .expect((res) => {
            const result = res.body.data as KidLearningData["dataValues"] & {
              kidLessonProgresses: KidLessonProgress["dataValues"][];
            };
            expect(result.energy).toBe(learningData.energy - gameRule.energyCost);
            expect(result.coin).toBe(learningData.coin + gameRule.replaySuccessReward);
            expect(result.gem).toBe(1);

            const lessonProgress = result.kidLessonProgresses.find((x) => x.learningDataId === result.kidId)!;
            expect(lessonProgress.star).toBe(3);
            learningData = result;
          });
      });

      it(`should succeed due to replay and fail with different star = HARD ${item.toUpperCase()}`, () => {
        return agent
          .post(`${API_CONTENT_PREFIX}/kid-learning-data/${learningData.kidId}/kid-lesson-progresses`)
          .send({ ...data, isWin: false, star: KID_LESSON_PROGRESS_STAR.HARD })
          .expect((res) => {
            const result = res.body.data as KidLearningData["dataValues"] & {
              kidLessonProgresses: KidLessonProgress["dataValues"][];
            };
            expect(result.energy).toBe(learningData.energy - gameRule.energyCost);
            expect(result.coin).toBe(learningData.coin + gameRule.replayFailureReward);
            expect(result.gem).toBe(1);

            const lessonProgress = result.kidLessonProgresses.find((x) => x.learningDataId === result.kidId)!;
            expect(lessonProgress.star).toBe(3);
            learningData = result;
          });
      });
    });
  });
});
