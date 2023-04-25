import { API_TOKEN, expectError, generateNumber, signin, User } from "@common";
import { HttpStatus, INestApplication } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Test } from "@nestjs/testing";
import { AppModule } from "app.module";
import * as request from "supertest";
import { API_CONTENT_PREFIX } from "../test.contants";
import { KidLearningData } from "entities/kid-learning-data.entity";
import { COST_COIN, ENERGY_BUY_WITH_COIN } from "modules/kid-learning-data/kid-learning-data.constants";
import { GameRule } from "entities/game-rule.entity";
import { KID_LESSON_PROGRESS_STAR, KidLessonProgress } from "entities/kid-lesson-progress.entity";

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
      imports: [AppModule, SequelizeModule.forFeature([KidLearningData])],
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

  ["lesson", "challenge"].forEach((item) => {
    describe("Create or Update kid-lesson-progress (Post)api/kid-learning-data/:id/kid-lesson-progresses", () => {
      let learningData: KidLearningData["dataValues"];
      let gameRule: GameRule["dataValues"];
      const data = {
        levelId: -generateNumber(4),
        unitId: -generateNumber(4),
        lessonId: 1,
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
        });
        learningData = learningDataResult.dataValues;

        const gamRuleResult = await gameRuleModel.bulkCreate([
          {
            levelId: data.levelId,
            unitId: data.unitId,
            type: "lesson",
            firstPlayReward: 5,
            replayFailureReward: 1,
            replaySuccessReward: 3,
            energyCost: 6,
          },
          {
            levelId: data.levelId,
            unitId: data.unitId,
            type: "challenge",
            firstPlayReward: 5,
            replayFailureReward: 1,
            replaySuccessReward: 3,
            energyCost: 6,
          },
        ]);
        gameRule = gamRuleResult.find((x) => x.type === data.type)!;
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
            const error = res.body.error;
            expect(error).toEqual([
              {
                code: "lessonId",
                message: expect.any(String),
              },
              {
                code: "star",
                message: expect.any(String),
              },
              {
                code: "type",
                message: expect.any(String),
              },
              {
                code: "isWin",
                message: expect.any(String),
              },
            ]);
          });
      });

      it(`should first play and win succeed ${item.toUpperCase()}`, () => {
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

      it(`should replay and win with same difficulty = EASY succeed ${item.toUpperCase()}`, () => {
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

      it(`should replay and fail with same difficulty = EASY succeed ${item.toUpperCase()}`, () => {
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

      it(`should replay and win with different difficulty = MEDIUM succeed ${item.toUpperCase()}`, () => {
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

      it(`should replay and win with different difficulty = MEDIUM succeed ${item.toUpperCase()}`, () => {
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

      it(`should replay and win with different difficulty = HARD succeed ${item.toUpperCase()}`, () => {
        return agent
          .post(`${API_CONTENT_PREFIX}/kid-learning-data/${learningData.kidId}/kid-lesson-progresses`)
          .send({ ...data, star: KID_LESSON_PROGRESS_STAR.HARD })
          .expect((res) => {
            const result = res.body.data as KidLearningData["dataValues"] & {
              kidLessonProgresses: KidLessonProgress["dataValues"][];
            };
            expect(result.energy).toBe(learningData.energy - gameRule.energyCost);
            expect(result.coin).toBe(learningData.coin + gameRule.firstPlayReward);
            expect(result.gem).toBe(1);

            const lessonProgress = result.kidLessonProgresses.find((x) => x.learningDataId === result.kidId)!;
            expect(lessonProgress.star).toBe(3);
            learningData = result;
          });
      });

      it(`should replay and win with different difficulty = MEDIUM succeed ${item.toUpperCase()}`, () => {
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

      it(`should replay and fail with different difficulty = HARD succeed ${item.toUpperCase()}`, () => {
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
