import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { LEVEL_ID, Level } from "entities/level.entity";
import { Unit } from "entities/unit.entity";
import { isNil } from "lodash";
import { Op, col, fn } from "sequelize";
import { FindLevelSuggestionDto } from "./dto/find-level-suggestion.dto";
import { FindLevelsQueryDto } from "./dto/find-levels.dto";
import { Lesson } from "entities/lesson.entity";
import { KidLesson } from "entities/kid-lesson.entity";

@Injectable()
export class LevelService {
  constructor(
    @InjectModel(Level) private levelModel: typeof Level,
    @InjectModel(Unit) private unitModel: typeof Unit
  ) {}

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

  async worldMap(levelId: string, kidId: number) {
    const units = await this.unitModel.findAll({
      where: { levelId },
      attributes: ["id", "name"],
      include: [
        {
          model: Lesson,
          attributes: ["id", "name", "unitId"],
          include: [
            {
              model: KidLesson,
              where: { learningDataId: kidId },
              attributes: ["star"],
              required: false,
            },
          ],
        },
      ],
    });

    const calculateTotalStars = (array, key) => array.reduce((partialSum, a) => partialSum + (a[key] || 0), 0);

    return units.map((unit) => {
      const unitObj: any = unit.toJSON();
      unitObj.lessons = unit.lessons.map((lesson) => {
        const lessonObj: any = lesson.toJSON();
        const totalStars = calculateTotalStars(lessonObj.kidLessonProgress, "star");
        delete lessonObj.kidLessonProgress;
        return { ...lessonObj, totalStars };
      });
      const totalStars = calculateTotalStars(unitObj.lessons, "totalStars");
      return { ...unitObj, totalStars };
    });
  }
}
