import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { LEVEL_ID, Level } from "entities/level.entity";
import { isNil } from "lodash";
import { Op } from "sequelize";
import { FindLevelSuggestionDto } from "./dto/find-level-suggestion.dto";
import { FindLevelsQueryDto } from "./dto/find-levels.dto";

@Injectable()
export class LevelService {
  constructor(@InjectModel(Level) private levelModel: typeof Level) {}

  find(query: FindLevelsQueryDto) {
    const { name, ids } = query.filter || {};
    const { sort: order, limit, offset } = query;
    return this.levelModel.findAndCountAll({
      where: {
        ...(!isNil(name) && { name: { [Op.iLike]: `%${name}%` } }),
        ...(!isNil(ids) && { id: { [Op.in]: ids } }),
      },
      order,
      limit,
      offset,
    });
  }

  findSuggestion(query: FindLevelSuggestionDto) {
    const { fromAge, toAge } = query;
    const attributes = ["id", "name"];

    if (fromAge === 6 && toAge === 8) return this.levelModel.findOne({ where: { id: LEVEL_ID.ENG_PREA1 }, attributes });

    if (fromAge === 9 && toAge === 11) return this.levelModel.findOne({ where: { id: LEVEL_ID.ENG_A1 }, attributes });

    return this.levelModel.findOne({ where: { id: LEVEL_ID.ENG_A2 }, attributes });
  }
}
