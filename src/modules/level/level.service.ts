import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Level } from "entities/level.entity";
import { Op } from "sequelize";
import { FindLevelsQueryDto } from "./dto/find-levels.dto";

@Injectable()
export class LevelService {
  constructor(@InjectModel(Level) private levelModel: typeof Level) {}

  findAll(query: FindLevelsQueryDto) {
    const { code, name, ids } = query.filter || {};
    const { sort: order, limit, offset } = query;
    return this.levelModel.findAndCountAll({
      where: {
        ...(code && { code }),
        ...(name && { name: { [Op.iLike]: `%${name}%` } }),
        ...(ids?.length && { id: { [Op.in]: ids } }),
      },
      order,
      limit,
      offset,
    });
  }
}
