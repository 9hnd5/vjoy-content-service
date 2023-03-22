import { API_TOKEN, createUser, deleteUser, generateNumber, ROLE_CODE, signin, User } from "@common";
import { HttpStatus, INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "app.module";
import { Buddy, BUDDY_STATUS } from "entities/buddy.entity";
import { CreateBuddyDto } from "modules/buddy/dto/create-buddy.dto";
import { UpdateBuddyDto } from "modules/buddy/dto/update-buddy.dto";
import * as request from "supertest";
import { API_CONTENT_PREFIX } from "../test.contants";

describe("Buddies E2E Test", () => {
  let app: INestApplication;
  let userToken = "";
  let adminToken = "";
  let contentToken = "";
  let parent: User["dataValues"];
  let content: User["dataValues"];
  const buddy: {
    createdByAdmin: Buddy["dataValues"];
    createdByContent: Buddy["dataValues"];
  } = {} as any;
  let buddyModel: typeof Buddy;
  const apiToken = API_TOKEN;
  let agent: request.SuperAgentTest;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    buddyModel = moduleRef.get("BuddyRepository");
    app = moduleRef.createNestApplication();
    app.enableVersioning();
    app.setGlobalPrefix("api");
    await app.init();

    agent = request.agent(app.getHttpServer());
    agent.set("api-token", apiToken);
    const { accessToken: adToken } = await signin();
    adminToken = adToken;

    let name = `test-buddy-${generateNumber(10)}`;
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

    name = `test-buddy-${generateNumber(10)}`;
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

  describe("Create buddy (POST)api/buddies", () => {
    let createDto: CreateBuddyDto;
    const name = `test-buddy-${generateNumber(10)}`;
    beforeAll(() => {
      createDto = {
        name,
        code: name,
      };
    });

    it("Should fail due to user unauthorized", () => {
      return agent.post(`${API_CONTENT_PREFIX}/buddies`).expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should fail due to user is not admin or content editor", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/buddies`)
        .send(createDto)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it("Should fail due to invalid field", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/buddies`)
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
        .post(`${API_CONTENT_PREFIX}/buddies`)
        .send(createDto)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          const result = res.body.data;
          expect(result.name).toBe(createDto.name);
          expect(result.code).toBe(createDto.code);
          expect(result.status).toBe(BUDDY_STATUS.NEW);
          buddy["createdByAdmin"] = result;
        });
    });

    it("Should succeed due to user is content editor", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/buddies`)
        .send(createDto)
        .set("Authorization", `Bearer ${contentToken}`)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          const result = res.body.data;
          expect(result.name).toBe(createDto.name);
          expect(result.code).toBe(createDto.code);
          expect(result.status).toBe(BUDDY_STATUS.NEW);
          buddy["createdByContent"] = result;
        });
    });
  });

  describe("Get all (GET)api/buddies", () => {
    it("Should fail due to user unauthorized", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/buddies?page=1&pageSize=10&sort=[["id","ASC"]]`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should fail due to invalid query params(page & pageSize & status) value", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/buddies?page=a&pageSize=a&sort=[["id","ASC"]]&filter={"status":"a"}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("Should succeed due to user having sufficient privileges", () => {
      return agent
        .get(
          `${API_CONTENT_PREFIX}/buddies?page=1&pageSize=10&sort=[["id","ASC"]]&filter={"status":${buddy["createdByAdmin"].status}}`
        )
        .set("Authorization", `Bearer ${userToken}`)
        .expect(HttpStatus.OK)
        .expect((response) => {
          const { data } = response.body;
          expect(data.rows.length).toBeGreaterThan(0);
        });
    });
  });

  describe("Update buddy (PATCH)api/buddies/:id", () => {
    let updateDto: UpdateBuddyDto;
    beforeAll(() => {
      updateDto = { name: `test-updateBuddy-${generateNumber(10)}`, status: BUDDY_STATUS.APPROVED };
    });

    it("Should fail due to user unauthorized", () => {
      return agent.patch(`${API_CONTENT_PREFIX}/buddies/${buddy["createdByAdmin"].id}`).expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should fail due to invalid params(id)", () => {
      return agent
        .patch(`${API_CONTENT_PREFIX}/buddies/undefined`)
        .send(updateDto)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("Should fail due to user is not admin or content editor", () => {
      return agent
        .patch(`${API_CONTENT_PREFIX}/buddies/${buddy["createdByAdmin"].id}`)
        .send(updateDto)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it("Should succeed due to user is admin", async () => {
      return agent
        .patch(`${API_CONTENT_PREFIX}/buddies/${buddy["createdByAdmin"].id}`)
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
        .patch(`${API_CONTENT_PREFIX}/buddies/${buddy["createdByContent"].id}`)
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

  describe("Get one (GET)api/buddies/:id", () => {
    it("Should fail due to user unauthorized", () => {
      return agent.get(`${API_CONTENT_PREFIX}/buddies/${buddy["createdByAdmin"].id}/`).expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should fail due to invalid params(id)", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/buddies/undefined`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("Should succeed due to user having sufficient privileges", () => {
      const id = buddy["createdByAdmin"].id;
      return agent
        .get(`${API_CONTENT_PREFIX}/buddies/${id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          const responseData = res.body.data;
          expect(responseData.id).toEqual(id);
        });
    });
  });

  describe("Delete buddy (DELETE)api/buddies/:id", () => {
    it("Should fail due to user unauthorized", () => {
      return agent
        .delete(`${API_CONTENT_PREFIX}/buddies/${buddy["createdByAdmin"].id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should fail due to invalid params(id)", () => {
      return agent
        .delete(`${API_CONTENT_PREFIX}/buddies/undefined`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("Should fail due to user is not admin or content editor", () => {
      return agent
        .delete(`${API_CONTENT_PREFIX}/buddies/${buddy["createdByAdmin"].id}/`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it("Should fail due to user only Soft Delete", async () => {
      return agent
        .delete(`${API_CONTENT_PREFIX}/buddies/${buddy["createdByContent"].id}?hardDelete=true`)
        .set("Authorization", `Bearer ${contentToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should succeed due to user having sufficient privileges (Soft Delete)", async () => {
      return agent
        .delete(`${API_CONTENT_PREFIX}/buddies/${buddy["createdByContent"].id}`)
        .set("Authorization", `Bearer ${contentToken}`)
        .expect(HttpStatus.OK)
        .then(async () => {
          const deleted = await buddyModel.findOne({ where: { id: buddy["createdByContent"].id } });
          expect(deleted).not.toBeNull();
          expect(deleted?.status).toEqual(BUDDY_STATUS.HIDE);
        });
    });

    it("Should succeed due to user is admin (Hard delete)", async () => {
      return agent
        .delete(`${API_CONTENT_PREFIX}/buddies/${buddy["createdByAdmin"].id}?hardDelete=true`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.OK)
        .then(async () => {
          const deleted = await buddyModel.findOne({ where: { id: buddy["createdByAdmin"].id } });
          expect(deleted).toBeNull();
        });
    });

    it("Should succeed due to user is admin (Hard delete)", async () => {
      return agent
        .delete(`${API_CONTENT_PREFIX}/buddies/${buddy["createdByContent"].id}?hardDelete=true`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.OK)
        .then(async () => {
          const deleted = await buddyModel.findOne({ where: { id: buddy["createdByContent"].id } });
          expect(deleted).toBeNull();
        });
    });
  });

  afterAll(async () => {
    await deleteUser({ id: content.id, accessToken: adminToken });
    await deleteUser({ id: parent.id, accessToken: adminToken });

    await app.close();
  });
});
