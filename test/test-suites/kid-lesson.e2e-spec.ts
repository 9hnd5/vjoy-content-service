import { API_TOKEN, ERROR_CODE, KidDetail, User, generateNumber, signin } from "@common";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "app.module";
import { KidData } from "entities/kid-data.entity";
import * as request from "supertest";
import { API_CONTENT_PREFIX } from "../test.contants";
import crypto from "crypto";
import { KidLesson } from "entities/kid-lesson.entity";

describe("Kid Lesson E2E", () => {
  let app: INestApplication;
  let adminToken = "";
  const apiToken = API_TOKEN;
  let agent: request.SuperAgentTest;
  let kidDataModel: typeof KidData;
  let kidLessonModel: typeof KidLesson;
  let userModel: typeof User;
  let kidDetailModel: typeof KidDetail;
  let result: any;
  let result2: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    userModel = moduleRef.get("UserRepository");
    kidDataModel = moduleRef.get("KidDataRepository");
    kidLessonModel = moduleRef.get("KidLessonRepository");
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

  beforeAll(() => {});

  afterAll(async () => {
    await userModel.destroy({ where: { id: result.kidId } });
    await kidDetailModel.destroy({ where: { kidId: result.kidId } });
    await kidDataModel.destroy({ where: { kidId: result.kidId } });
    await kidLessonModel.destroy({ where: { id: result.kidId } });
    app && (await app.close());
  });

  it("should succeed create kid-data", () => {
    const data = {
      currentLevelId: "PreA1",
      buddyId: "1",
      parentId: 1,
      character: "test-character",
      kidName: "test-kid-name",
    };
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

  describe("Create kid-lesson (Post)api/kid-lesson/:kidId", () => {
    let data: any;
    beforeAll(() => {
      data = { lessonId: "A1_U1_Act1", type: "lesson", difficulty: 1 };
    });

    it("should fail due to pass empty data", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-lessons/${result.kidId}`)
        .send({})
        .expect((res) => {
          const errors = res.body.errors;
          expect(errors).toEqual([
            { code: "isNotEmpty", message: expect.any(String) },
            { code: "isIn", message: expect.any(String) },
            { code: "isIn", message: expect.any(String) },
          ]);
        });
    });

    it("should fail due to pass lessonId length exceed 255 character", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-lessons/${result.kidId}`)
        .send({ ...data, lessonId: crypto.randomBytes(256).toString("hex") })
        .expect((res) => {
          const errors = res.body.errors;
          expect(errors).toEqual([{ code: "maxLength", message: expect.any(String) }]);
        });
    });

    it("should fail due to pass lessonId does not exists", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-lessons/${result.kidId}`)
        .send({ ...data, lessonId: -1 })
        .expect((res) => {
          const errors = res.body.errors;
          expect(errors).toEqual([{ code: ERROR_CODE.LESSON_NOT_FOUND, message: expect.any(String) }]);
        });
    });

    it("should fail due to pass invalid difficulty", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-lessons/${result.kidId}`)
        .send({ ...data, difficulty: -1 })
        .expect((res) => {
          const errors = res.body.errors;
          expect(errors).toEqual([{ code: "isIn", message: expect.any(String) }]);
        });
    });

    it("should fail create kid-lesson with difficulty = 2 due to not exists any record with difficulty = 1 before", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-lessons/${result.kidId}`)
        .send({ ...data, difficulty: 2 })
        .expect((res) => {
          const errors = res.body.errors;
          expect(errors).toEqual([{ code: ERROR_CODE.INVALID_DIFFICULTY, message: expect.any(String) }]);
        });
    });

    it("should success create kid-lesson with difficulty = 1 ", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-lessons/${result.kidId}`)
        .send({ ...data })
        .expect((res) => {
          const rs = res.body.data;

          expect(rs.id).not.toBeNull();
          expect(rs.unitId).not.toBeNull();
          expect(rs.star).not.toBeNull();

          result2 = rs;
        });
    });

    it("should fail create kid-lesson due to difficulty = 3 instead of 2", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-lessons/${result.kidId}`)
        .send({ ...data, difficulty: 3 })
        .expect((res) => {
          const errors = res.body.errors;
          expect(errors).toEqual([{ code: ERROR_CODE.INVALID_DIFFICULTY, message: expect.any(String) }]);
        });
    });

    it("should success create kid-lesson with difficulty = 2 ", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-lessons/${result.kidId}`)
        .send({ ...data, difficulty: 2 })
        .expect((res) => {
          const rs = res.body.data;

          expect(rs.id).not.toBeNull();
          expect(rs.unitId).not.toBeNull();
          expect(rs.star).not.toBeNull();

          result2 = rs;
        });
    });

    it("should success create kid-lesson with difficulty = 3 ", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-lessons/${result.kidId}`)
        .send({ ...data, difficulty: 3 })
        .expect((res) => {
          const rs = res.body.data;

          expect(rs.id).not.toBeNull();
          expect(rs.unitId).not.toBeNull();
          expect(rs.star).not.toBeNull();

          result2 = rs;
        });
    });

    it("should success create kid-lesson with the lastest difficulty = 3 ", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-lessons/${result.kidId}`)
        .send({ ...data, difficulty: 3 })
        .expect((res) => {
          const rs = res.body.data;

          expect(rs.id).not.toBeNull();
          expect(rs.unitId).not.toBeNull();
          expect(rs.star).not.toBeNull();

          result2 = rs;
        });
    });

    it("should fail create kid-lesson due to try to created with exists difficulty = 1 ", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-lessons/${result.kidId}`)
        .send({ ...data, difficulty: 1 })
        .expect((res) => {
          const errors = res.body.errors;
          expect(errors).toEqual([{ code: ERROR_CODE.INVALID_DIFFICULTY, message: expect.any(String) }]);
        });
    });
  });

  describe("Start kid-lesson (Post)api/kid-lesson/:kidId/start", () => {
    let data: any;
    beforeAll(() => {
      data = { lessonId: "A1_U1_Act1", type: "lesson" };
    });
    it("should fail due to pass empty data", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-lessons/${result.kidId}/start`)
        .send({})
        .expect((res) => {
          const errors = res.body.errors;
          expect(errors).toEqual([
            { code: "isNotEmpty", message: expect.any(String) },
            { code: "isIn", message: expect.any(String) },
          ]);
        });
    });

    it("should fail due to pass lessonId length exceed 255 character", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-lessons/${result.kidId}/start`)
        .send({ ...data, lessonId: crypto.randomBytes(256).toString("hex") })
        .expect((res) => {
          const errors = res.body.errors;
          expect(errors).toEqual([{ code: "maxLength", message: expect.any(String) }]);
        });
    });

    it("should fail due to pass lessonId does not exists", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-lessons/${result.kidId}/start`)
        .send({ ...data, lessonId: -1 })
        .expect((res) => {
          const errors = res.body.errors;
          expect(errors).toEqual([{ code: ERROR_CODE.LESSON_NOT_FOUND, message: expect.any(String) }]);
        });
    });

    it("should fail due to kidId does not exists", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-lessons/${-1}/start`)
        .send({ ...data })
        .expect((res) => {
          const errors = res.body.errors;
          expect(errors).toEqual([{ code: ERROR_CODE.USER_NOT_FOUND, message: expect.any(String) }]);
        });
    });

    it("should success start kid-lesson", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-lessons/${result.kidId}/start`)
        .send({ ...data })
        .expect((res) => {
          const rs = res.body.data;
          expect(rs.energy).not.toBeNull();
          expect(rs.star).not.toBeNull();
          expect(rs.levelId).not.toBeNull();
          expect(rs.unitId).not.toBeNull();
          expect(rs.lessonId).toBe(data.lessonId);
        });
    });

    it("should fail due to not enough energy", async () => {
      await kidDataModel.update({ energy: 0 }, { where: { kidId: result.kidId } });
      return agent
        .post(`${API_CONTENT_PREFIX}/kid-lessons/${result.kidId}/start`)
        .send({ ...data })
        .expect((res) => {
          const errors = res.body.errors;
          expect(errors).toEqual([{ code: ERROR_CODE.NOT_ENOUGH_ENERGY, message: expect.any(String) }]);
        });
    });
  });
});
