import { BaseService, ROLE_ID } from "@common";
import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Level } from "entities/level.entity";
import { Unit, UNIT_STATUS } from "entities/unit.entity";
import { isNil } from "lodash";
import { CreateUnitDto } from "./dto/create-unit.dto";
import { FindUnitsQueryDto } from "./dto/find-units-query.dto";
import { UpdateUnitDto } from "./dto/update-unit.dto";
import { GameRule } from "entities/game-rule.entity";
import { KidLessonProgress } from "entities/kid-lesson-progress.entity";

@Injectable()
export class UnitService extends BaseService {
  constructor(
    @InjectModel(Level) private levelModel: typeof Level,
    @InjectModel(Unit) private unitModel: typeof Unit,
    @InjectModel(GameRule) private gameRuleModel: typeof GameRule,
    @InjectModel(KidLessonProgress) private kidLessonProgressModel: typeof KidLessonProgress
  ) {
    super();
  }

  async create(createUnitDto: CreateUnitDto) {
    const { levelId } = createUnitDto;
    const count = await this.levelModel.count({ where: { id: levelId } });
    if (count <= 0) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: levelId } }));
    return this.unitModel.create(createUnitDto);
  }

  findAll(query: FindUnitsQueryDto) {
    const { limit, offset, sort: order } = query;
    const { levelId, status } = query.filter || {};
    return this.unitModel.findAndCountAll({
      where: {
        ...(!isNil(levelId) && { levelId }),
        ...(!isNil(status) && { status }),
      },
      limit,
      offset,
      order,
      include: [{ model: Level, attributes: ["id", "name"] }],
    });
  }

  async findOne(id: number) {
    const unit = await this.unitModel.findOne({
      where: { id },
      include: [{ model: Level, attributes: ["id", "name"] }],
    });
    if (!unit) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: id } }));
    return unit;
  }

  async update(id: number, updateUnitDto: UpdateUnitDto) {
    const unit = await this.unitModel.findOne({ where: { id } });
    if (!unit) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: id } }));

    const { levelId } = updateUnitDto;
    if (levelId) {
      const count = await this.levelModel.count({ where: { id: levelId } });
      if (count <= 0) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: levelId } }));
    }

    unit.set(updateUnitDto);
    return unit.save();
  }

  async remove(id: number, hardDelete = false) {
    const unit = await this.unitModel.findOne({ where: { id } });
    if (!unit) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: id } }));
    if (hardDelete) {
      const signinUser = this.request.user!;
      if (signinUser.roleId !== ROLE_ID.ADMIN) throw new UnauthorizedException(this.i18n.t("message.NOT_PERMISSION"));
      return unit.destroy();
    }
    return (await unit.update({ status: UNIT_STATUS.HIDE })).dataValues;
  }

  async unlockFinalChallenge(unitId: number) {
    const gameRule = await this.gameRuleModel.findOne({
      where: { unitId, type: "challenge" },
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
