import { BaseService } from "@common";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { KidLearningData } from "entities/kid-learning-data.entity";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import { COST_COIN, ENERGY_BUY_WITH_COIN } from "./kid-learning-data.constants";
dayjs.extend(isToday);

@Injectable()
export class KidLearningDataService extends BaseService {
  constructor(@InjectModel(KidLearningData) private kidLearningDataModel: typeof KidLearningData) {
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
}
