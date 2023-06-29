import { BaseService, ERROR_CODE } from "@common";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { GameRule } from "entities/game-rule.entity";
import { KidData } from "entities/kid-data.entity";
import { KID_LESSON_STAR, KidLesson } from "entities/kid-lesson.entity";
import { Lesson } from "entities/lesson.entity";
import { Unit } from "entities/unit.entity";
import { I18nTranslations } from "i18n/i18n.generated";
import { Sequelize } from "sequelize-typescript";
import { CreateKidLessonDto } from "./dto/create-kid-lesson.dto";
import { StartKidLessonDto } from "./dto/start-kid-lesson.dto";

@Injectable()
export class KidLessonService extends BaseService<I18nTranslations> {
  constructor(
    @InjectModel(KidData) private kidDataModel: typeof KidData,
    @InjectModel(KidLesson) private kidLessonModel: typeof KidLesson,
    @InjectModel(GameRule) private gameRuleModel: typeof GameRule,
    @InjectModel(Lesson) private lessonModel: typeof Lesson,
    private sequelize: Sequelize
  ) {
    super();
  }

  async create(kidId: number, data: CreateKidLessonDto) {
    try {
      return this.sequelize.transaction(async (t) => {
        const transactionHost = { transaction: t };

        const { lessonId, difficulty, type } = data;

        const kidData = await this.kidDataModel.findByPk(kidId);
        if (!kidData)
          throw new NotFoundException({
            code: ERROR_CODE.USER_NOT_FOUND,
            message: this.i18n.t("message.NOT_FOUND", { args: { data: kidId } }),
          });

        const lesson = await this.lessonModel.findByPk(lessonId, {
          include: Unit,
        });
        if (!lesson)
          throw new NotFoundException({ code: ERROR_CODE.LESSON_NOT_FOUND, message: this.i18n.t("message.NOT_FOUND") });

        let kidLesson = await this.kidLessonModel.findOne({
          where: { lessonId, kidId },
        });

        const levelId = lesson.unit.levelId;
        const unitId = lesson.unitId;

        const gameRule = await this.gameRuleModel.findOne({ where: { levelId, type } });

        let firstPlayAndSuccessCoinReward = gameRule?.firstPlayReward ?? 0;
        let firstPlayAndFailureCoinReward = 0;
        let replayFailureCoinReward = gameRule?.replayFailureReward ?? 0;
        let replaySuccessCoinReward = gameRule?.replaySuccessReward ?? 0;
        let energyCost = gameRule?.energyCost ?? 0;
        let gemReward = 1;

        kidData.currentLevelId = levelId;
        kidData.currentUnitId = unitId;
        kidData.coin += firstPlayAndSuccessCoinReward;

        if (!kidLesson) {
          if (difficulty === KID_LESSON_STAR.EASY) {
            kidLesson = await this.kidLessonModel.create(
              {
                levelId,
                unitId,
                lessonId,
                type,
                kidId,
                star: difficulty,
                isGemUnlocked: false,
              },
              transactionHost
            );
          } else {
            throw new BadRequestException({
              code: ERROR_CODE.INVALID_DIFFICULTY,
              message: this.i18n.t("kid-lesson.INVALID_DIFFICULTY"),
            });
          }
        } else {
          if (difficulty <= kidLesson.star)
            throw new BadRequestException({
              code: ERROR_CODE.INVALID_DIFFICULTY,
              message: this.i18n.t("kid-lesson.INVALID_DIFFICULTY"),
            });

          if (difficulty - kidLesson.star >= 2)
            throw new BadRequestException({
              code: ERROR_CODE.INVALID_DIFFICULTY,
              message: this.i18n.t("kid-lesson.INVALID_DIFFICULTY"),
            });

          kidLesson.star += 1;
        }

        await kidData.save(transactionHost);

        await kidLesson.save(transactionHost);

        return {
          id: lesson.id,
          name: lesson.name,
          unitId: lesson.unitId,
          star: kidLesson.star,
        };
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async start(kidId: number, data: StartKidLessonDto) {
    const { lessonId, type } = data;
    const lesson = await this.lessonModel.findByPk(lessonId, {
      include: Unit,
    });
    if (!lesson)
      throw new NotFoundException({
        code: ERROR_CODE.LESSON_NOT_FOUND,
        message: this.i18n.t("message.NOT_FOUND", { args: { data: `Lesson(${lessonId})` } }),
      });

    const levelId = lesson.unit.levelId;
    const unitId = lesson.unitId;

    const existKidData = await this.kidDataModel.findByPk(kidId, { include: KidLesson });
    if (!existKidData)
      throw new NotFoundException({
        code: ERROR_CODE.USER_NOT_FOUND,
        message: this.i18n.t("message.NOT_FOUND", { args: { data: `kid(${kidId})` } }),
      });

    const gamerule = await this.gameRuleModel.findOne({ where: { levelId, type } });
    if (!gamerule) throw new NotFoundException();

    const energyCost = gamerule.energyCost;

    if (existKidData.energy < energyCost)
      throw new BadRequestException({
        code: ERROR_CODE.NOT_ENOUGH_ENERGY,
        message: this.i18n.t("kid-data.NOT_ENOUGH_ENERGY"),
      });

    existKidData.energy -= energyCost;
    await existKidData.save();

    const star = existKidData.kidLessons.find((x) => x.lessonId === lessonId)?.star;

    return {
      energy: existKidData.energy,
      star: star ?? 0,
      levelId,
      unitId,
      lessonId,
    };
  }
}
