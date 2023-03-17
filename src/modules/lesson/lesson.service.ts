import { BaseService, ROLE_CODE } from "@common";
import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Lesson, LESSON_STATUS } from "entities/lesson.entity";
import { Unit } from "entities/unit.entity";
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { FindLessonsQueryDto } from "./dto/find-lessons-query.dto";
import { UpdateLessonDto } from "./dto/update-lesson.dto";

@Injectable()
export class LessonService extends BaseService {
  constructor(
    @InjectModel(Unit) private unitModel: typeof Unit,
    @InjectModel(Lesson) private lessonModel: typeof Lesson
  ) {
    super();
  }

  async create(createLessonDto: CreateLessonDto) {
    const { unitId } = createLessonDto;
    const count = await this.unitModel.count({ where: { id: unitId } });
    if (count <= 0) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: unitId } }));

    return this.lessonModel.create(createLessonDto);
  }

  findAll(query: FindLessonsQueryDto, unitId?: number) {
    const signinUser = this.request.user!;
    if (!unitId && [ROLE_CODE.ADMIN, ROLE_CODE.CONTENT_EDITOR].indexOf(signinUser.roleCode) < 0)
      throw new UnauthorizedException(this.i18n.t("message.NOT_PERMISSION"));
      
    const { limit, offset, sort: order, status } = query;
    const filter = {};
    if (unitId) filter["unitId"] = unitId;
    if (status) filter["status"] = status;
    return this.lessonModel.findAndCountAll({
      where: filter,
      limit,
      offset,
      order,
      include: [{ model: Unit, attributes: ["id", "name", "levelCode"] }],
    });
  }

  async findOne(id: number) {
    const lesson = await this.lessonModel.findOne({
      where: { id },
      include: [{ model: Unit, attributes: ["id", "name", "levelCode"] }],
    });
    if (!lesson) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: id } }));

    return lesson;
  }

  async update(id: number, updateLessonDto: UpdateLessonDto) {
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

  async remove(id: number, hardDelete = false) {
    const lesson = await this.lessonModel.findOne({ where: { id } });
    if (!lesson) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: id } }));
    if (hardDelete) {
      const signinUser = this.request.user!;
      if (signinUser.roleCode !== ROLE_CODE.ADMIN)
        throw new UnauthorizedException(this.i18n.t("message.NOT_PERMISSION"));
      return lesson.destroy();
    }
    return (await lesson.update({ status: LESSON_STATUS.HIDE })).dataValues;
  }
}
