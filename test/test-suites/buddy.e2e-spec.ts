import { API_TOKEN, createUser, deleteUser, generateNumber, ROLE_ID, signin, User } from "@common";
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
        roleId: ROLE_ID.PARENT,
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
        roleId: ROLE_ID.CONTENT_EDITOR,
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
    let createContentDto: CreateBuddyDto;
    const name = `test-buddy-${generateNumber(10)}`;
    const nameContent = `test-buddy-${generateNumber(10)}`;
    beforeAll(() => {
      createDto = {
        id: name,
        name,
      };
      createContentDto = {
        id: nameContent,
        name: nameContent,
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
          const { errors } = res.body;
          expect(errors).not.toBeNull();
          expect(errors[0].code).toBe("isIn");
          expect(errors[0].message).not.toBeNull();
        });
    });

    it("Should succeed due to user is admin", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/buddies`)
        .send(createDto)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect((res) => {
          const result = res.body.data;
          expect(result.id).toBe(createDto.id);
          expect(result.name).toBe(createDto.name);
          expect(result.status).toBe(BUDDY_STATUS.NEW);
          buddy["createdByAdmin"] = result;
        })
        .expect(HttpStatus.CREATED);
    });

    it("Should succeed due to user is content editor", () => {
      return agent
        .post(`${API_CONTENT_PREFIX}/buddies`)
        .send(createContentDto)
        .set("Authorization", `Bearer ${contentToken}`)
        .expect((res) => {
          const result = res.body.data;
          expect(result.id).toBe(createContentDto.id);
          expect(result.name).toBe(createContentDto.name);
          expect(result.status).toBe(BUDDY_STATUS.NEW);
          buddy["createdByContent"] = result;
        })
        .expect(HttpStatus.CREATED);
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
        .expect((response) => {
          const { data } = response.body;
          expect(data.rows.length).toBeGreaterThan(0);
        })
        .expect(HttpStatus.OK);
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
        .expect(HttpStatus.NOT_FOUND);
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
        .expect((res) => {
          const updated = res.body.data;
          expect(updated.name).toBe(updateDto.name);
          expect(updated.status).toBe(updateDto.status);
        })
        .expect(HttpStatus.OK);
    });

    it("Should succeed due to user is content editor", async () => {
      return agent
        .patch(`${API_CONTENT_PREFIX}/buddies/${buddy["createdByContent"].id}`)
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

  describe("Get one (GET)api/buddies/:id", () => {
    it("Should fail due to user unauthorized", () => {
      return agent.get(`${API_CONTENT_PREFIX}/buddies/${buddy["createdByAdmin"].id}/`).expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should fail due to invalid params(id)", () => {
      return agent
        .get(`${API_CONTENT_PREFIX}/buddies/undefined`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it("Should succeed due to user having sufficient privileges", () => {
      const id = buddy["createdByAdmin"].id;
      return agent
        .get(`${API_CONTENT_PREFIX}/buddies/${id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect((res) => {
          const responseData = res.body.data;
          expect(responseData.id).toEqual(id);
        })
        .expect(HttpStatus.OK);
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
        .expect(HttpStatus.NOT_FOUND);
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
        .expect(async () => {
          const deleted = await buddyModel.findOne({ where: { id: buddy["createdByContent"].id } });
          expect(deleted).not.toBeNull();
          expect(deleted?.status).toEqual(BUDDY_STATUS.HIDE);
        })
        .expect(HttpStatus.OK);
    });

    it("Should succeed due to user is admin (Hard delete)", async () => {
      return agent
        .delete(`${API_CONTENT_PREFIX}/buddies/${buddy["createdByAdmin"].id}?hardDelete=true`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(async () => {
          const deleted = await buddyModel.findOne({ where: { id: buddy["createdByAdmin"].id } });
          expect(deleted).toBeNull();
        })
        .expect(HttpStatus.OK);
    });

    it("Should succeed due to user is admin (Hard delete)", async () => {
      return agent
        .delete(`${API_CONTENT_PREFIX}/buddies/${buddy["createdByContent"].id}?hardDelete=true`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(async () => {
          const deleted = await buddyModel.findOne({ where: { id: buddy["createdByContent"].id } });
          expect(deleted).toBeNull();
        })
        .expect(HttpStatus.OK);
    });
  });

  afterAll(async () => {
    await deleteUser({ id: content.id, accessToken: adminToken });
    await deleteUser({ id: parent.id, accessToken: adminToken });

    app && (await app.close());
  });
});
