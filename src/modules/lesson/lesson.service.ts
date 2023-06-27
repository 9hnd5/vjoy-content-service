import { BaseService, ROLE_ID } from "@common";
import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Lesson, LESSON_STATUS } from "entities/lesson.entity";
import { Unit } from "entities/unit.entity";
import { isNil } from "lodash";
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { FindLessonsQueryDto } from "./dto/find-lessons-query.dto";
import { UpdateLessonDto } from "./dto/update-lesson.dto";
import { GameRule } from "entities/game-rule.entity";
import { KidLesson } from "entities/kid-lesson.entity";

@Injectable()
export class LessonService extends BaseService {
  constructor(
    @InjectModel(Unit) private unitModel: typeof Unit,
    @InjectModel(Lesson) private lessonModel: typeof Lesson,
    @InjectModel(GameRule) private gameRuleModel: typeof GameRule,
    @InjectModel(KidLesson) private kidLessonProgressModel: typeof KidLesson
  ) {
    super();
  }

  async create(createLessonDto: CreateLessonDto) {
    const { unitId } = createLessonDto;
    const count = await this.unitModel.count({ where: { id: unitId } });
    if (count <= 0) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: unitId } }));

    return this.lessonModel.create(createLessonDto);
  }

  findAll(query: FindLessonsQueryDto, unitId?: string) {
    const signinUser = this.request.user!;
    if (!unitId && [ROLE_ID.ADMIN, ROLE_ID.CONTENT_EDITOR].indexOf(signinUser.roleId) < 0)
      throw new UnauthorizedException(this.i18n.t("message.NOT_PERMISSION"));

    const { limit, offset, sort: order } = query;
    const { status, gameType } = query.filter || {};
    return this.lessonModel.findAndCountAll({
      where: {
        ...(!isNil(unitId) && { unitId }),
        ...(!isNil(status) && { status }),
        ...(!isNil(gameType) && { gameType }),
      },
      limit,
      offset,
      order,
      include: [{ model: Unit, attributes: ["id", "name", "levelId"] }],
    });
  }

  async findOne(id: string) {
    const lesson = await this.lessonModel.findOne({
      where: { id },
      include: [{ model: Unit, attributes: ["id", "name", "levelId"] }],
    });
    if (!lesson) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: id } }));

    return lesson;
  }

  async update(id: string, updateLessonDto: UpdateLessonDto) {
    const lesson = await this.lessonModel.findOne({ where: { id } });
    if (!lesson) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: id } }));

    const { unitId } = updateLessonDto;
    if (unitId) {
      const count = await this.unitModel.count({ where: { id: unitId } });
      if (count <= 0) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: unitId } }));
    }

    lesson.set(updateLessonDto);
    return lesson.save();
  }

  async remove(id: string, hardDelete = false) {
    const lesson = await this.lessonModel.findOne({ where: { id } });
    if (!lesson) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: id } }));
    if (hardDelete) {
      const signinUser = this.request.user!;
      if (signinUser.roleId !== ROLE_ID.ADMIN) throw new UnauthorizedException(this.i18n.t("message.NOT_PERMISSION"));
      return lesson.destroy();
    }
    return (await lesson.update({ status: LESSON_STATUS.HIDDEN })).dataValues;
  }

  async unlockFinalChallenge(lessonId: string) {
    const lesson = await this.lessonModel.findByPk(lessonId);

    if (!lesson) return false;

    const gameRule = await this.gameRuleModel.findOne({
      where: { unitId: lesson.unitId, type: "challenge" },
    });

    if (!gameRule) return false;

    const unlockingRequirement = gameRule.unlockingRequirement ?? 0;
    if (unlockingRequirement < 0) return false;

    const stars = await this.kidLessonProgressModel.sum("star", {
      where: { levelId: gameRule.levelId, type: "lesson" },
    });
    if (stars < unlockingRequirement) return false;

    return true;
  }
}
