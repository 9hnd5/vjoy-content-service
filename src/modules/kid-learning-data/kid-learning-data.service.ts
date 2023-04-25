import { BaseService } from "@common";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { KidLearningData } from "entities/kid-learning-data.entity";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import { COST_COIN, ENERGY_BUY_WITH_COIN } from "./kid-learning-data.constants";
import { KID_LESSON_PROGRESS_DIFFICULTY, KidLessonProgress } from "entities/kid-lesson-progress.entity";
import { CreateUpdateKidLessonProgressDto } from "./dto/create-update-kid-lesson-progress.dto";
import { GameRule } from "entities/game-rule.entity";
dayjs.extend(isToday);

@Injectable()
export class KidLearningDataService extends BaseService {
  constructor(
    @InjectModel(KidLearningData) private kidLearningDataModel: typeof KidLearningData,
    @InjectModel(KidLessonProgress) private kidLessonProgressModel: typeof KidLessonProgress,
    @InjectModel(GameRule) private gameRuleModel: typeof GameRule
  ) {
    super();
  }

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

    if (coinCost > kidAsset.coin) throw new BadRequestException(this.i18n.t("message.NOT_ENOUGH_COIN"));

    kidAsset.coin -= coinCost;
    kidAsset.lastBoughtEnergy = new Date();
    kidAsset.energy += ENERGY_BUY_WITH_COIN;

    return kidAsset.save();
  };

  createUpdateLearningProgress = async (learningDataId: number, data: CreateUpdateKidLessonProgressDto) => {
    const { isWin, levelId, unitId, lessonId, difficulty, type } = data;
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

    learningData.energy -= energyCost;
    learningData.currentLevelId = levelId;
    learningData.currentUnitId = unitId;
    //First play and win and difficulty = 1
    if (!lessonProgress && isWin) {
      learningData.coin += firstPlayCoinReward;

      this.kidLessonProgressModel.create({
        levelId,
        unitId,
        lessonId,
        type,
        learningDataId,
        currentDifficulty: difficulty,
        star: 1,
      });
    }
    //First play and fail and difficulty = 1

    //Replay and win with the same difficulty
    if (lessonProgress && isWin && lessonProgress.currentDifficulty === difficulty) {
      learningData.coin += replaySuccessCoinReward;
    }
    //Replay and fail with the same difficulty
    if (lessonProgress && !isWin && lessonProgress.currentDifficulty === difficulty) {
      learningData.coin += replayFailureCoinReward;
    }

    //Replay and win with different difficulty
    if (lessonProgress && isWin && lessonProgress.currentDifficulty !== difficulty) {
      if (difficulty === KID_LESSON_PROGRESS_DIFFICULTY.HARD) learningData.gem += gemReward;

      if (difficulty > lessonProgress.currentDifficulty) {
        learningData.coin += firstPlayCoinReward;
        lessonProgress.star += 1;
        lessonProgress.currentDifficulty = difficulty;
      } else {
        learningData.coin += replaySuccessCoinReward;
      }
    }

    //Replay and fail with different difficulty
    if (lessonProgress && !isWin && lessonProgress.currentDifficulty !== difficulty) {
      if (difficulty <= lessonProgress.currentDifficulty) {
        learningData.coin += replayFailureCoinReward;
      }
    }

    await learningData.save();

    await lessonProgress?.save();

    return this.kidLearningDataModel.findByPk(learningDataId, { include: [KidLessonProgress] });
  };
}
