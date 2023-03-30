import { API_TOKEN, createUser, deleteUser, generateNumber, ROLE_CODE, signin, User } from "@common";
import { HttpStatus, INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "app.module";
import { Unit, UNIT_STATUS } from "entities/unit.entity";
import { CreateUnitDto } from "modules/unit/dto/create-unit.dto";
import { UpdateUnitDto } from "modules/unit/dto/update-unit.dto";
import * as request from "supertest";
import { API_CONTENT_PREFIX } from "../test.contants";

describe("Units E2E Test", () => {
  let app: INestApplication;
  let userToken = "";
  let adminToken = "";
  let contentToken = "";
  let parent: User["dataValues"];
  let content: User["dataValues"];
  const unit: {
    createdByAdmin: Unit["dataValues"];
    createdByContent: Unit["dataValues"];
  } = {} as any;
  let unitModel: typeof Unit;
  const apiToken = API_TOKEN;
  let agent: request.SuperAgentTest;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    unitModel = moduleRef.get("UnitRepository");
    app = moduleRef.createNestApplication();
    app.enableVersioning();
    app.setGlobalPrefix("api");
    await app.init();

    agent = request.agent(app.getHttpServer());
    agent.set("api-token", apiToken);
    const { accessToken: adToken } = await signin();
    adminToken = adToken;

    let name = `test-user-${generateNumber(10)}`;
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

    name = `test-content-${generateNumber(10)}`;
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
  });

  describe("Create unit (POST)api/units", () => {
    let createDto: CreateUnitDto;
    beforeAll(() => {
      createDto = {
        levelId: "eng-A2",
      };
    });

    it("Should fail due to user unauthorized", () => {
      return agent.post(`${API_CONTENT_PREFIX}/units`).expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should fail due to user is not admin or content editor", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/units`)
        .send(createDto)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it("Should fail due to invalid field", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/units`)
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
        .post(`${API_CONTENT_PREFIX}/units`)
        .send(createDto)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect((res) => {
          const result = res.body.data;
          expect(result.levelId).toBe(createDto.levelId);
          expect(result.status).toBe(UNIT_STATUS.NEW);
          unit["createdByAdmin"] = result;
        })
        .expect(HttpStatus.CREATED);
    });

    it("Should succeed due to user is content editor", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/units`)
        .send(createDto)
        .set("Authorization", `Bearer ${contentToken}`)
        .expect((res) => {
          const result = res.body.data;
          expect(result.levelId).toBe(createDto.levelId);
          expect(result.status).toBe(UNIT_STATUS.NEW);
          unit["createdByContent"] = result;
        })
        .expect(HttpStatus.CREATED);
    });
  });

  describe("Get all (GET)api/units", () => {
    it("Should fail due to user unauthorized", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/units?page=1&pageSize=10&sort=[["id","ASC"]]`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should fail due to invalid query params(page & pageSize & status) value", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/units?page=a&pageSize=a&sort=[["id","ASC"]]&filter={"status":"a"}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("Should succeed due to user having sufficient privileges", () => {
      return agent
        .get(
          `${API_CONTENT_PREFIX}/units?page=1&pageSize=10&sort=[["id","ASC"]]&filter={"levelId":"${unit["createdByAdmin"].levelId}"}`
        )
        .set("Authorization", `Bearer ${userToken}`)
        .expect((response) => {
          const { data } = response.body;
          expect(data.rows.length).toBeGreaterThan(0);
        })
        .expect(HttpStatus.OK);
    });
  });

  describe("Update unit (PATCH)api/units/:id", () => {
    let updateDto: UpdateUnitDto;
    beforeAll(() => {
      updateDto = { name: `test-unit-${generateNumber(10)}`, status: UNIT_STATUS.APPROVED };
    });

    it("Should fail due to user unauthorized", () => {
      return agent.patch(`${API_CONTENT_PREFIX}/units/${unit["createdByAdmin"].id}`).expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should fail due to invalid params(id)", () => {
      return agent
        .patch(`${API_CONTENT_PREFIX}/units/undefined`)
        .send(updateDto)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("Should fail due to user is not admin or content editor", () => {
      return agent
        .patch(`${API_CONTENT_PREFIX}/units/${unit["createdByAdmin"].id}`)
        .send(updateDto)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it("Should fail due to level code does not exist", () => {
      return agent
        .patch(`${API_CONTENT_PREFIX}/units/${unit["createdByAdmin"].id}`)
        .send({ ...updateDto, levelId: `levelId-${generateNumber(6)}` })
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it("Should succeed due to user is admin", async () => {
      return agent
        .patch(`${API_CONTENT_PREFIX}/units/${unit["createdByAdmin"].id}`)
        .send(updateDto)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect((res) => {
          const updated = res.body.data;
          expect(updated.name).toBe(updateDto.name);
          expect(updated.status).toBe(updateDto.status);
        });
    });

    it("Should succeed due to user is content editor", async () => {
      return agent
        .patch(`${API_CONTENT_PREFIX}/units/${unit["createdByContent"].id}`)
        .send(updateDto)
        .set("Authorization", `Bearer ${contentToken}`)
        .expect((res) => {
          const updated = res.body.data;
          expect(updated.name).toBe(updateDto.name);
          expect(updated.status).toBe(updateDto.status);
        })
        .expect(HttpStatus.OK);
    });
  });

  describe("Get one (GET)api/units/:id", () => {
    it("Should fail due to user unauthorized", () => {
      return agent.get(`${API_CONTENT_PREFIX}/units/${unit["createdByAdmin"].id}/`).expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should fail due to invalid params(id)", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/units/undefined`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("Should succeed due to user having sufficient privileges", () => {
      const id = unit["createdByAdmin"].id;
      return agent
        .get(`${API_CONTENT_PREFIX}/units/${id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect((res) => {
          const responseData = res.body.data;
          expect(responseData.id).toEqual(id);
        })
        .expect(HttpStatus.OK);
    });
  });

  describe("Delete unit (DELETE)api/units/:id", () => {
    it("Should fail due to user unauthorized", () => {
      return agent.delete(`${API_CONTENT_PREFIX}/units/${unit["createdByAdmin"].id}`).expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should fail due to invalid params(id)", () => {
      return agent
        .delete(`${API_CONTENT_PREFIX}/units/undefined`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("Should fail due to user is not admin or content editor", () => {
      return agent
        .delete(`${API_CONTENT_PREFIX}/units/${unit["createdByAdmin"].id}/`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it("Should fail due to user only Soft Delete", async () => {
      return agent
        .delete(`${API_CONTENT_PREFIX}/units/${unit["createdByContent"].id}?hardDelete=true`)
        .set("Authorization", `Bearer ${contentToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should succeed due to user having sufficient privileges (Soft Delete)", async () => {
      return agent
        .delete(`${API_CONTENT_PREFIX}/units/${unit["createdByContent"].id}`)
        .set("Authorization", `Bearer ${contentToken}`)
        .expect(async () => {
          const deleted = await unitModel.findOne({ where: { id: unit["createdByContent"].id } });
          expect(deleted).not.toBeNull();
          expect(deleted?.status).toEqual(UNIT_STATUS.HIDE);
        })
        .expect(HttpStatus.OK);
    });

    it("Should succeed due to user is admin (Hard delete)", async () => {
      return agent
        .delete(`${API_CONTENT_PREFIX}/units/${unit["createdByAdmin"].id}?hardDelete=true`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(async () => {
          const deleted = await unitModel.findOne({ where: { id: unit["createdByAdmin"].id } });
          expect(deleted).toBeNull();
        })
        .expect(HttpStatus.OK);
    });

    it("Should succeed due to user is admin (Hard delete)", async () => {
      return agent
        .delete(`${API_CONTENT_PREFIX}/units/${unit["createdByContent"].id}?hardDelete=true`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(async () => {
          const deleted = await unitModel.findOne({ where: { id: unit["createdByContent"].id } });
          expect(deleted).toBeNull();
        })
        .expect(HttpStatus.OK);
    });
  });

  afterAll(async () => {
    await deleteUser({ id: content.id, accessToken: adminToken });
    await deleteUser({ id: parent.id, accessToken: adminToken });

    await app.close();
  });
});
