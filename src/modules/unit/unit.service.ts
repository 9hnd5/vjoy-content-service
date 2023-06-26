import { BaseService, ROLE_ID } from "@common";
import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Level } from "entities/level.entity";
import { UNIT_STATUS, Unit } from "entities/unit.entity";
import { isNil } from "lodash";
import { CreateUnitDto } from "./dto/create-unit.dto";
import { FindUnitsQueryDto } from "./dto/find-units-query.dto";
import { UpdateUnitDto } from "./dto/update-unit.dto";

@Injectable()
export class UnitService extends BaseService {
  constructor(@InjectModel(Level) private levelModel: typeof Level, @InjectModel(Unit) private unitModel: typeof Unit) {
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

  async findOne(id: string) {
    const unit = await this.unitModel.findOne({
      where: { id },
      include: [{ model: Level, attributes: ["id", "name"] }],
    });
    if (!unit) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: id } }));
    return unit;
  }

  async update(id: string, updateUnitDto: UpdateUnitDto) {
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

  async remove(id: string, hardDelete = false) {
    const unit = await this.unitModel.findOne({ where: { id } });
    if (!unit) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: id } }));
    if (hardDelete) {
      const signinUser = this.request.user!;
      if (signinUser.roleId !== ROLE_ID.ADMIN) throw new UnauthorizedException(this.i18n.t("message.NOT_PERMISSION"));
      return unit.destroy();
    }
    return (await unit.update({ status: UNIT_STATUS.HIDE })).dataValues;
  }
}
