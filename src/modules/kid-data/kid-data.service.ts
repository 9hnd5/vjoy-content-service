import { BaseService, ERROR_CODE, KidDetail, ROLE_ID, User } from "@common";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import { KidData } from "entities/kid-data.entity";
import { KidLesson } from "entities/kid-lesson.entity";
import { Level } from "entities/level.entity";
import { I18nTranslations } from "i18n/i18n.generated";
import { Sequelize } from "sequelize-typescript";
import { CreateKidDataDto } from "./dto/create-kid-data.dto";
import { COST_COIN, ENERGY_BUY_WITH_COIN, ENERGY_PER_MINUTE, MAX_ENERGY } from "./kid-data.constants";
dayjs.extend(isToday);

@Injectable()
export class KidDataService extends BaseService<I18nTranslations> {
  constructor(
    private sequelize: Sequelize,
    @InjectModel(KidData) private kidDataModel: typeof KidData,
    @InjectModel(KidDetail) private kidDetailModel: typeof KidDetail,
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Level) private levelModel: typeof Level
  ) {
    super();
  }

  async create(data: CreateKidDataDto) {
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

        return this.kidDataModel.create({ buddyId, currentLevelId, kidId }, { transaction: t });
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async getEnergy(kidId: number) {
    const existKidLearningData = await this.kidDataModel.findByPk(kidId);

    if (!existKidLearningData)
      throw new NotFoundException(
        { code: ERROR_CODE.USER_NOT_FOUND },
        this.i18n.t("message.NOT_FOUND", { args: { data: kidId } })
      );

    return {
      energy: existKidLearningData.energy,
    };
  }

  async getStar(kidId: number) {
    const existKidLearningData = await this.kidDataModel.findByPk(kidId, { include: [KidLesson] });

    if (!existKidLearningData)
      throw new NotFoundException({
        code: ERROR_CODE.USER_NOT_FOUND,
        message: this.i18n.t("message.NOT_FOUND", { args: { data: kidId } }),
      });

    return {
      star: existKidLearningData.kidLessons.reduce((prev, curr) => {
        return prev + curr.star;
      }, 0),
    };
  }

  async buyEnergy(kidId: number) {
    const existKidLearningData = await this.kidDataModel.findByPk(kidId);
    if (!existKidLearningData)
      throw new NotFoundException(
        { code: ERROR_CODE.USER_NOT_FOUND },
        this.i18n.t("message.NOT_FOUND", { args: { data: kidId } })
      );
    let coinCost = 0;

    if (dayjs(existKidLearningData.lastBoughtEnergy).isToday()) {
      if (existKidLearningData.countBuyEnergy === 0) coinCost = COST_COIN.FIRST_TIME;
      else if (existKidLearningData.countBuyEnergy === 1) coinCost = COST_COIN.SECOND_TIME;
      else coinCost = COST_COIN.THIRTH_TIME;
      existKidLearningData.countBuyEnergy += 1;
    } else {
      coinCost = COST_COIN.FIRST_TIME;
      existKidLearningData.countBuyEnergy = 1;
    }

    if (coinCost > existKidLearningData.coin)
      throw new BadRequestException({
        code: ERROR_CODE.NOT_ENOUGH_COIN,
        message: this.i18n.t("kid-data.NOT_ENOUGH_COIN"),
      });

    existKidLearningData.coin -= coinCost;
    existKidLearningData.lastBoughtEnergy = new Date();
    existKidLearningData.energy += ENERGY_BUY_WITH_COIN;

    return existKidLearningData.save();
  }

  async updateEnergy(id: number, energy?: number) {
    const learningData = await this.kidDataModel.findByPk(id);
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

    if (learningData.energy < 0) throw new BadRequestException(this.i18n.t("kid-data.NOT_ENOUGH_ENERGY"));

    return learningData.save();
  }

  async getDataByUser() {
    const { userId } = this.request.user!;
    const kids = await this.userModel.findAll({ where: { parentId: userId } });

    if (!kids || kids.length === 0)
      throw new NotFoundException(
        { code: ERROR_CODE.USER_NOT_FOUND },
        this.i18n.t("message.NOT_FOUND", { args: { data: "Kids" } })
      );

    const kidIds = kids.map((kid) => kid.id);
    const kidsDetail = await this.kidDetailModel.findAll({
      where: { kidId: kidIds },
    });
    const learningDataForKids = await this.kidDataModel.findAll({
      where: { kidId: kidIds },
    });
    const result = kidsDetail.map((detailItem) => {
      const correspondingLearningData = learningDataForKids.find((ld) => ld.kidId === detailItem.kidId);
      if (correspondingLearningData) {
        return {
          ...detailItem.dataValues,
          ...correspondingLearningData.dataValues,
        };
      }
      return detailItem;
    });

    return result;
  }
}
