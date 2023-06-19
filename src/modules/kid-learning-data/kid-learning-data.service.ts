import { BaseService, ERROR_CODE, KidDetail, ROLE_ID, User } from "@common";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import { GameRule } from "entities/game-rule.entity";
import { KidLearningData } from "entities/kid-learning-data.entity";
import { KID_LESSON_PROGRESS_STAR, KidLessonProgress } from "entities/kid-lesson-progress.entity";
import { Level } from "entities/level.entity";
import { I18nTranslations } from "i18n/i18n.generated";
import { Sequelize } from "sequelize-typescript";
import { CreateKidLearningDataDto } from "./dto/create-kid-learning-data.dto";
import { CreateUpdateKidLessonProgressDto } from "./dto/create-update-kid-lesson-progress.dto";
import { UpdateKidLearningDataDto } from "./dto/update-kid-learning-data.dto";
import { COST_COIN, ENERGY_BUY_WITH_COIN, ENERGY_PER_MINUTE, MAX_ENERGY } from "./kid-learning-data.constants";
dayjs.extend(isToday);

@Injectable()
export class KidLearningDataService extends BaseService<I18nTranslations> {
  constructor(
    @InjectModel(KidLearningData) private kidLearningDataModel: typeof KidLearningData,
    @InjectModel(KidLessonProgress) private kidLessonProgressModel: typeof KidLessonProgress,
    @InjectModel(GameRule) private gameRuleModel: typeof GameRule,
    @InjectModel(KidDetail) private kidDetailModel: typeof KidDetail,
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Level) private levelModel: typeof Level,
    private sequelize: Sequelize
  ) {
    super();
  }

  create = async (data: CreateKidLearningDataDto) => {
    try {
      return this.sequelize.transaction(async (t) => {
        const { parentId, character, buddyId, currentLevelId, kidName } = data;

        const parent = await this.userModel.findByPk(parentId);
        if (!parent)
          throw new NotFoundException({
            code: ERROR_CODE.LEVEL_NOT_FOUND,
            message: this.i18n.t("message.NOT_FOUND", { args: { data: "Parent" } }),
          });

        const currentLevel = await this.levelModel.findByPk(currentLevelId, { transaction: t });
        if (!currentLevel)
          throw new NotFoundException({
            code: ERROR_CODE.USER_NOT_FOUND,
            message: this.i18n.t("message.NOT_FOUND", { args: { data: "Parent" } }),
          });

        const kid = await this.userModel.create(
          { roleId: ROLE_ID.KID_FREE, parentId, lastname: kidName },
          { transaction: t }
        );

        const existKidDetail = await this.kidDetailModel.findByPk(kid.id, { transaction: t });

        if (existKidDetail)
          throw new BadRequestException(this.i18n.t("message.IS_EXISTED", { args: { data: "Kid Detail" } }));

        const { kidId } = await this.kidDetailModel.create({ character, kidId: kid.id }, { transaction: t });

        return this.kidLearningDataModel.create({ buddyId, currentLevelId, kidId }, { transaction: t });
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  };

  update = async (kidId: number, data: UpdateKidLearningDataDto) => {
    const kidAsset = await this.kidLearningDataModel.findByPk(kidId);
    if (!kidAsset) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: kidId } }));

    kidAsset.update({ ...data });
    return { ...kidAsset.dataValues };
  };

  buyEnergy = async (id: number) => {
    const kidAsset = await this.kidLearningDataModel.findByPk(id);
    if (!kidAsset) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: id } }));

    let coinCost = 0;

    if (dayjs(kidAsset.lastBoughtEnergy).isToday()) {
      if (kidAsset.countBuyEnergy === 0) coinCost = COST_COIN.FIRST_TIME;
      else if (kidAsset.countBuyEnergy === 1) coinCost = COST_COIN.SECOND_TIME;
      else coinCost = COST_COIN.THIRTH_TIME;
      kidAsset.countBuyEnergy += 1;
    } else {
      coinCost = COST_COIN.FIRST_TIME;
      kidAsset.countBuyEnergy = 1;
    }

    if (coinCost > kidAsset.coin) throw new BadRequestException(this.i18n.t("kid-learning-data.NOT_ENOUGH_COIN"));

    kidAsset.coin -= coinCost;
    kidAsset.lastBoughtEnergy = new Date();
    kidAsset.energy += ENERGY_BUY_WITH_COIN;

    return kidAsset.save();
  };

  updateEnergy = async (id: number, energy?: number) => {
    const learningData = await this.kidLearningDataModel.findByPk(id);
    if (!learningData) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: id } }));

    const minutes = dayjs(new Date()).diff(learningData.lastUpdatedEnergy, "minutes");

    if (energy) {
      learningData.energy += energy;
      learningData.lastUpdatedEnergy = new Date();
    } else {
      if (minutes >= 5) {
        const newEnergy = minutes * ENERGY_PER_MINUTE + learningData.energy;
        learningData.energy = Math.floor(newEnergy >= MAX_ENERGY ? MAX_ENERGY : newEnergy);
        learningData.lastUpdatedEnergy = new Date();
      }
    }

    if (learningData.energy < 0) throw new BadRequestException(this.i18n.t("kid-learning-data.NOT_ENOUGH_ENERGY"));

    return learningData.save();
  };

  createUpdateLearningProgress = async (learningDataId: number, data: CreateUpdateKidLessonProgressDto) => {
    try {
      return this.sequelize.transaction(async (t) => {
        const transactionHost = { transaction: t };
        const { isWin, levelId, unitId, lessonId, star, type } = data;
        const learningData = await this.kidLearningDataModel.findByPk(learningDataId);
        if (!learningData)
          throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: learningDataId } }));

        let lessonProgress = await this.kidLessonProgressModel.findOne({
          where: { levelId, unitId, lessonId },
        });

        const gameRule = await this.gameRuleModel.findOne({ where: { levelId, unitId, type } });

        let firstPlayCoinReward = gameRule?.firstPlayReward ?? 0;
        let replayFailureCoinReward = gameRule?.replayFailureReward ?? 0;
        let replaySuccessCoinReward = gameRule?.replaySuccessReward ?? 0;
        let energyCost = gameRule?.energyCost ?? 0;
        let gemReward = 1;

        if (energyCost > learningData.energy)
          throw new BadRequestException(this.i18n.t("kid-learning-data.NOT_ENOUGH_ENERGY"));

        learningData.energy -= energyCost;
        learningData.currentLevelId = levelId;
        learningData.currentUnitId = unitId;
        //First play and win and star = 1
        if (!lessonProgress && isWin) {
          if (star !== KID_LESSON_PROGRESS_STAR.EASY)
            throw new BadRequestException(this.i18n.t("kid-learning-data.INVALID_LESSON_UNLOCK"));

          learningData.coin += firstPlayCoinReward;
          this.kidLessonProgressModel.create(
            {
              levelId,
              unitId,
              lessonId,
              type,
              learningDataId,
              star,
              isGemUnlocked: false,
            },
            transactionHost
          );
        }
        //First play and fail and star = 1

        //Replay and win with the same star
        if (lessonProgress && isWin && lessonProgress.star === star) {
          if (
            star === KID_LESSON_PROGRESS_STAR.HARD &&
            lessonProgress.star === KID_LESSON_PROGRESS_STAR.HARD &&
            !lessonProgress.isGemUnlocked
          ) {
            learningData.gem += gemReward;
            lessonProgress.isGemUnlocked = true;
          }
          learningData.coin += replaySuccessCoinReward;
        }
        //Replay and fail with the same star
        if (lessonProgress && !isWin && lessonProgress.star === star) {
          learningData.coin += replayFailureCoinReward;
        }

        //Replay and win with different star
        if (lessonProgress && isWin && lessonProgress.star !== star) {
          const gapStar = star - lessonProgress.star;
          if (gapStar > 0 && gapStar >= 2)
            throw new BadRequestException(this.i18n.t("kid-learning-data.INVALID_LESSON_UNLOCK"));

          if (star > lessonProgress.star) {
            learningData.coin += firstPlayCoinReward;
            lessonProgress.star += 1;
          } else {
            learningData.coin += replaySuccessCoinReward;
          }
        }

        //Replay and fail with different star
        if (lessonProgress && !isWin && lessonProgress.star !== star) {
          if (star <= lessonProgress.star) {
            learningData.coin += replayFailureCoinReward;
          }
        }

        await learningData.save(transactionHost);

        await lessonProgress?.save(transactionHost);

        return this.kidLearningDataModel.findByPk(learningDataId, { include: [KidLessonProgress], ...transactionHost });
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  };
}
