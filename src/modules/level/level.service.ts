import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { LEVEL_ID, Level } from "entities/level.entity";
import { isNil } from "lodash";
import { Op } from "sequelize";
import { FindLevelsQueryDto } from "./dto/find-levels.dto";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

@Injectable()
export class LevelService {
  constructor(@InjectModel(Level) private levelModel: typeof Level) {}

  findAll(query: FindLevelsQueryDto) {
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

  findSuggestion(dob: Date) {
    const attributes = ["id", "name"];

    if (dayjs(dob).isSameOrAfter("2015", "year"))
      return this.levelModel.findOne({ where: { id: LEVEL_ID.ENG_PREA1 }, attributes });

    if (dayjs(dob).isSameOrAfter("2012", "year") && dayjs(dob).isSameOrBefore("2014", "year"))
      return this.levelModel.findOne({ where: { id: LEVEL_ID.ENG_A1 }, attributes });

    if (dayjs(dob).isSameOrBefore("2011", "year"))
      return this.levelModel.findOne({ where: { id: LEVEL_ID.ENG_A2 }, attributes });
  }
}
