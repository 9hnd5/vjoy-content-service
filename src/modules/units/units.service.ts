import { BaseService, ROLE_CODE } from "@common";
import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Level } from "entities/level.entity";
import { Unit, UNIT_STATUS } from "entities/unit.entity";
import { CreateUnitDto } from "./dto/create-unit.dto";
import { QueryUnitDto } from "./dto/query-unit.dto";
import { UpdateUnitDto } from "./dto/update-unit.dto";

@Injectable()
export class UnitsService extends BaseService {
  constructor(@InjectModel(Level) private levelModel: typeof Level, @InjectModel(Unit) private unitModel: typeof Unit) {
    super();
  }

  async create(createUnitDto: CreateUnitDto) {
    const { levelCode } = createUnitDto;
    const count = await this.levelModel.count({ where: { code: levelCode } });
    if (count <= 0) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: levelCode } }));

    return this.unitModel.create(createUnitDto);
  }

  findAll(query: QueryUnitDto) {
    const { limit, offset, sort: order, levelCode, status } = query;
    const filter = {};
    if (levelCode) filter["levelCode"] = levelCode;
    if (status) filter["status"] = status;
    return this.unitModel.findAndCountAll({
      where: filter,
      limit,
      offset,
      order,
      include: [{ model: Level, attributes: ["id", "name", "code"] }],
    });
  }

  async findOne(id: number) {
    const unit = await this.unitModel.findOne({
      where: { id },
      include: [{ model: Level, attributes: ["id", "name", "code"] }],
    });
    if (!unit) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: id } }));

    return unit;
  }

  async update(id: number, updateUnitDto: UpdateUnitDto) {
    const unit = await this.unitModel.findOne({ where: { id } });
    if (!unit) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: id } }));

    const { levelCode } = updateUnitDto;
    if (levelCode) {
      const count = await this.levelModel.count({ where: { code: levelCode } });
      if (count <= 0) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: levelCode } }));
    }

    unit.set(updateUnitDto);
    return unit.save();
  }

  async remove(id: number, hardDelete = false) {
    const unit = await this.unitModel.findOne({ where: { id } });
    if (!unit) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: id } }));
    if (hardDelete) {
      const signinUser = this.request.user!;
      if (signinUser.roleCode !== ROLE_CODE.ADMIN)
        throw new UnauthorizedException(this.i18n.t("message.NOT_PERMISSION"));
      return unit.destroy();
    }
    return (await unit.update({ status: UNIT_STATUS.HIDE })).dataValues;
  }
}
