import { API_TOKEN, createUser, deleteUser, generateNumber, ROLE_CODE, signin, User } from "@common";
import { HttpStatus, INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "app.module";
import { Lesson, LESSON_STATUS } from "entities/lesson.entity";
import { Unit } from "entities/unit.entity";
import { CreateLessonDto } from "modules/lesson/dto/create-lesson.dto";
import { UpdateLessonDto } from "modules/lesson/dto/update-lesson.dto";
import * as request from "supertest";
import { API_CONTENT_PREFIX } from "../test.contants";

describe("Lessons E2E Test", () => {
  let app: INestApplication;
  let userToken = "";
  let adminToken = "";
  let contentToken = "";
  let parent: User["dataValues"];
  let content: User["dataValues"];
  const lesson: {
    createdByAdmin: Lesson["dataValues"];
    createdByContent: Lesson["dataValues"];
  } = {} as any;
  let unit: Unit["dataValues"];
  let lessonModel: typeof Lesson;
  let unitModel: typeof Unit;
  const apiToken = API_TOKEN;
  let agent: request.SuperAgentTest;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    lessonModel = moduleRef.get("LessonRepository");
    unitModel = moduleRef.get("UnitRepository");
    app = moduleRef.createNestApplication();
    app.enableVersioning();
    app.setGlobalPrefix("api");
    await app.init();

    agent = request.agent(app.getHttpServer());
    agent.set("api-token", apiToken);
    const { accessToken: adToken } = await signin();
    adminToken = adToken;

    let name = `test-lesson-${generateNumber(10)}`;
    parent = await createUser({
      newUser: {
        firstname: name,
        lastname: name,
        email: `${name}@gmail.com`,
        password: "123456",
        roleCode: ROLE_CODE.PARENT,
      },
      accessToken: adminToken,
    });

    name = `test-lesson-${generateNumber(10)}`;
    content = await createUser({
      newUser: {
        firstname: name,
        lastname: name,
        email: `${name}@gmail.com`,
        password: "123456",
        roleCode: ROLE_CODE.CONTENT_EDITOR,
      },
      accessToken: adminToken,
    });

    const { accessToken: ctToken } = await signin({ email: content.email!, password: "123456" });
    contentToken = ctToken;
    const { accessToken: parentToken } = await signin({ email: parent.email!, password: "123456" });
    userToken = parentToken;

    unit = await await unitModel.create({
      name: `test-lesson-${generateNumber(10)}`,
      levelCode: "eng-A2",
    });
  });

  describe("Create Lesson (POST)api/lessons", () => {
    let createDto: CreateLessonDto;
    beforeAll(() => {
      createDto = {
        unitId: unit.id,
      };
    });

    it("Should fail due to user unauthorized", () => {
      return agent.post(`${API_CONTENT_PREFIX}/lessons`).expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should fail due to user is not admin or content editor", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/lessons`)
        .send(createDto)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it("Should fail due to invalid field", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/lessons`)
        .send({ ...createDto, status: generateNumber(2) })
        .set("Authorization", `Bearer ${adminToken}`)
        .expect((res) => {
          const { error } = res.body;
          expect(error).not.toBeNull();
          expect(error[0].code).toBe("status");
          expect(error[0].message).not.toBeNull();
        });
    });

    it("Should succeed due to user is admin", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/lessons`)
        .send(createDto)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          const result = res.body.data;
          expect(result.unitId).toBe(createDto.unitId);
          expect(result.status).toBe(LESSON_STATUS.NEW);
          lesson["createdByAdmin"] = result;
        });
    });

    it("Should succeed due to user is content editor", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/lessons`)
        .send(createDto)
        .set("Authorization", `Bearer ${contentToken}`)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          const result = res.body.data;
          expect(result.unitId).toBe(createDto.unitId);
          expect(result.status).toBe(LESSON_STATUS.NEW);
          lesson["createdByContent"] = result;
        });
    });
  });

  describe("Get all (GET)api/lessons", () => {
    it("Should fail due to user unauthorized", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/lessons?page=1&pageSize=10&sort=[["id","ASC"]]`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should fail due to invalid query params(page & pageSize & status) value", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/lessons?page=a&pageSize=a&sort=[["id","ASC"]]&status=a`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("Should fail due to user is not admin or content editor", () => {
      return agent
        .get(
          `${API_CONTENT_PREFIX}/lessons?page=1&pageSize=10&sort=[["id","ASC"]]&status=${lesson["createdByAdmin"].status}`
        )
        .set("Authorization", `Bearer ${userToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should succeed due to user is admin or content editor", () => {
      return agent
        .get(
          `${API_CONTENT_PREFIX}/lessons?page=1&pageSize=10&sort=[["id","ASC"]]&status=${lesson["createdByAdmin"].status}`
        )
        .set("Authorization", `Bearer ${contentToken}`)
        .expect(HttpStatus.OK)
        .expect((response) => {
          const { data } = response.body;
          expect(data.rows.length).toBeGreaterThan(0);
        });
    });
  });

  describe("Get all by unitId (GET)api/units/:unitId/lessons", () => {
    it("Should fail due to user unauthorized", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/units/${unit.id}/lessons?page=1&pageSize=10&sort=[["id","ASC"]]`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should fail due to invalid params(unitId)", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/units/undefined/lessons`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("Should fail due to invalid query params(page & pageSize & status) value", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/units/${unit.id}/lessons?page=a&pageSize=a&sort=[["id","ASC"]]&status=a`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("Should succeed due to user having sufficient privileges", () => {
      return agent
        .get(
          `${API_CONTENT_PREFIX}/units/${unit.id}/lessons?page=1&pageSize=10&sort=[["id","ASC"]]&status=${lesson["createdByAdmin"].status}`
        )
        .set("Authorization", `Bearer ${userToken}`)
        .expect(HttpStatus.OK)
        .expect((response) => {
          const { data } = response.body;
          expect(data.rows.length).toBeGreaterThan(0);
        });
    });
  });

  describe("Update Lesson (PATCH)api/lessons/:id", () => {
    let updateDto: UpdateLessonDto;
    beforeAll(() => {
      updateDto = { name: `test-lesson-${generateNumber(10)}`, status: LESSON_STATUS.APPROVED };
    });

    it("Should fail due to user unauthorized", () => {
      return agent
        .patch(`${API_CONTENT_PREFIX}/lessons/${lesson["createdByAdmin"].id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should fail due to invalid params(id)", () => {
      return agent
        .patch(`${API_CONTENT_PREFIX}/lessons/undefined`)
        .send(updateDto)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("Should fail due to user is not admin or content editor", () => {
      return agent
        .patch(`${API_CONTENT_PREFIX}/lessons/${lesson["createdByAdmin"].id}`)
        .send(updateDto)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it("Should fail due to unit does not exist", () => {
      return agent
        .patch(`${API_CONTENT_PREFIX}/lessons/${lesson["createdByAdmin"].id}`)
        .send({ ...updateDto, unitId: generateNumber(6) })
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it("Should succeed due to user is admin", async () => {
      return agent
        .patch(`${API_CONTENT_PREFIX}/lessons/${lesson["createdByAdmin"].id}`)
        .send(updateDto)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.OK)
        .then((res) => {
          const updated = res.body.data;
          expect(updated.name).toBe(updateDto.name);
          expect(updated.status).toBe(updateDto.status);
        });
    });

    it("Should succeed due to user is content editor", async () => {
      return agent
        .patch(`${API_CONTENT_PREFIX}/lessons/${lesson["createdByContent"].id}`)
        .send(updateDto)
        .set("Authorization", `Bearer ${contentToken}`)
        .expect(HttpStatus.OK)
        .then((res) => {
          const updated = res.body.data;
          expect(updated.name).toBe(updateDto.name);
          expect(updated.status).toBe(updateDto.status);
        });
    });
  });

  describe("Get one (GET)api/lessons/:id", () => {
    it("Should fail due to user unauthorized", () => {
      return agent.get(`${API_CONTENT_PREFIX}/lessons/${lesson["createdByAdmin"].id}`).expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should fail due to invalid params(id)", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/lessons/undefined`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("Should succeed due to user having sufficient privileges", () => {
      const id = lesson["createdByAdmin"].id;
      return agent
        .get(`${API_CONTENT_PREFIX}/lessons/${id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          const responseData = res.body.data;
          expect(responseData.id).toEqual(id);
        });
    });
  });

  describe("Delete Lesson (DELETE)api/lessons/:id", () => {
    it("Should fail due to user unauthorized", () => {
      return agent
        .delete(`${API_CONTENT_PREFIX}/lessons/${lesson["createdByAdmin"].id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should fail due to invalid params(id)", () => {
      return agent
        .delete(`${API_CONTENT_PREFIX}/lessons/undefined`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("Should fail due to user is not admin or content editor", () => {
      return agent
        .delete(`${API_CONTENT_PREFIX}/lessons/${lesson["createdByAdmin"].id}/`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it("Should fail due to user only Soft Delete", async () => {
      return agent
        .delete(`${API_CONTENT_PREFIX}/lessons/${lesson["createdByContent"].id}?hardDelete=true`)
        .set("Authorization", `Bearer ${contentToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should succeed due to user having sufficient privileges (Soft Delete)", async () => {
      return agent
        .delete(`${API_CONTENT_PREFIX}/lessons/${lesson["createdByContent"].id}`)
        .set("Authorization", `Bearer ${contentToken}`)
        .expect(HttpStatus.OK)
        .then(async () => {
          const deleted = await lessonModel.findOne({ where: { id: lesson["createdByContent"].id } });
          expect(deleted).not.toBeNull();
          expect(deleted?.status).toEqual(LESSON_STATUS.HIDE);
        });
    });

    it("Should succeed due to user is admin (Hard delete)", async () => {
      return agent
        .delete(`${API_CONTENT_PREFIX}/lessons/${lesson["createdByAdmin"].id}?hardDelete=true`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.OK)
        .then(async () => {
          const deleted = await lessonModel.findOne({ where: { id: lesson["createdByAdmin"].id } });
          expect(deleted).toBeNull();
        });
    });

    it("Should succeed due to user is admin (Hard delete)", async () => {
      return agent
        .delete(`${API_CONTENT_PREFIX}/lessons/${lesson["createdByContent"].id}?hardDelete=true`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.OK)
        .then(async () => {
          const deleted = await lessonModel.findOne({ where: { id: lesson["createdByContent"].id } });
          expect(deleted).toBeNull();
        });
    });
  });

  afterAll(async () => {
    await deleteUser({ id: content.id, accessToken: adminToken });
    await deleteUser({ id: parent.id, accessToken: adminToken });

    await unitModel.destroy({ where: { id: unit.id } });

    await app.close();
  });
});
