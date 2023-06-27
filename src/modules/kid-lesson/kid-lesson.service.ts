import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { KidData } from "entities/kid-data.entity";
import { Sequelize } from "sequelize-typescript";
import { CreateKidLessonDto } from "./dto/create-kid-lesson.dto";
import { BaseService, ERROR_CODE } from "@common";
import { I18nTranslations } from "i18n/i18n.generated";
import { KID_LESSON_STAR, KidLesson } from "entities/kid-lesson.entity";
import { GameRule } from "entities/game-rule.entity";
import { StartKidLessonDto } from "./dto/start-kid-lesson.dto";

@Injectable()
export class KidLessonService extends BaseService<I18nTranslations> {
  constructor(
    @InjectModel(KidData) private kidDataModel: typeof KidData,
    @InjectModel(KidLesson) private kidLessonModel: typeof KidLesson,
    @InjectModel(GameRule) private gameRuleModel: typeof GameRule,
    private sequelize: Sequelize
  ) {
    super();
  }

  async create(kidId: number, data: CreateKidLessonDto) {
    try {
      return this.sequelize.transaction(async (t) => {
        const transactionHost = { transaction: t };
        const { isWin, levelId, unitId, lessonId, star, type } = data;
        const kidData = await this.kidDataModel.findByPk(kidId);
        if (!kidData)
          throw new NotFoundException({
            code: ERROR_CODE.USER_NOT_FOUND,
            message: this.i18n.t("message.NOT_FOUND", { args: { data: kidId } }),
          });

        let kidLesson = await this.kidLessonModel.findOne({
          where: { levelId, unitId, lessonId, kidId },
        });

        const gameRule = await this.gameRuleModel.findOne({ where: { levelId, type } });

        let firstPlayAndSuccessCoinReward = gameRule?.firstPlayReward ?? 0;
        let firstPlayAndFailureCoinReward = 0;
        let replayFailureCoinReward = gameRule?.replayFailureReward ?? 0;
        let replaySuccessCoinReward = gameRule?.replaySuccessReward ?? 0;
        let energyCost = gameRule?.energyCost ?? 0;
        let gemReward = 1;

        if (energyCost > kidData.energy)
          throw new BadRequestException({
            code: ERROR_CODE.NOT_ENOUGH_ENERGY,
            message: this.i18n.t("kid-data.NOT_ENOUGH_ENERGY"),
          });

        kidData.energy -= energyCost;
        kidData.currentLevelId = levelId;
        kidData.currentUnitId = unitId;

        //First play and star = 1
        if (!kidLesson) {
          if (star !== KID_LESSON_STAR.EASY)
            throw new BadRequestException({
              code: ERROR_CODE.INVALID_LESSON_UNLOCK,
              message: this.i18n.t("kid-data.INVALID_LESSON_UNLOCK"),
            });

          kidData.coin += isWin ? firstPlayAndSuccessCoinReward : firstPlayAndFailureCoinReward;
          this.kidLessonModel.create(
            {
              levelId,
              unitId,
              lessonId,
              type,
              kidId,
              star,
              isGemUnlocked: false,
            },
            transactionHost
          );
        }

        //Replay and win with the same star
        if (kidLesson && isWin && kidLesson.star === star) {
          if (star === KID_LESSON_STAR.HARD && kidLesson.star === KID_LESSON_STAR.HARD && !kidLesson.isGemUnlocked) {
            kidData.gem += gemReward;
            kidLesson.isGemUnlocked = true;
          }
          kidData.coin += replaySuccessCoinReward;
        }
        //Replay and fail with the same star
        if (kidLesson && !isWin && kidLesson.star === star) {
          kidData.coin += replayFailureCoinReward;
        }

        //Replay and win with different star
        if (kidLesson && isWin && kidLesson.star !== star) {
          const gapStar = star - kidLesson.star;
          if (gapStar > 0 && gapStar >= 2)
            throw new BadRequestException({
              code: ERROR_CODE.INVALID_LESSON_UNLOCK,
              message: this.i18n.t("kid-data.INVALID_LESSON_UNLOCK"),
            });

          if (star > kidLesson.star) {
            kidData.coin += firstPlayAndSuccessCoinReward;
            kidLesson.star += 1;
          } else {
            kidData.coin += replaySuccessCoinReward;
          }
        }

        //Replay and fail with different star
        if (kidLesson && !isWin && kidLesson.star !== star) {
          if (star <= kidLesson.star) {
            kidData.coin += replayFailureCoinReward;
          }
        }

        await kidData.save(transactionHost);

        return kidLesson?.save(transactionHost);
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async start(kidId: number, data: StartKidLessonDto) {
    const { levelId, type } = data;

    const existKidData = await this.kidDataModel.findByPk(kidId);
    if (!existKidData)
      throw new NotFoundException({
        code: ERROR_CODE.USER_NOT_FOUND,
        message: this.i18n.t("message.NOT_FOUND", { args: { data: kidId } }),
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

    return {
      energy: existKidData.energy,
    };
  }
}
