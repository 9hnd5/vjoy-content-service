import { BaseService } from "@common";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { KidLearningData } from "entities/kid-learning-data.entity";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
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

    if (dayjs(kidAsset.lastBuyEnergy).isToday()) {
      if (kidAsset.countBuyEnergy === 0) coinCost = 30;
      else if (kidAsset.countBuyEnergy === 1) coinCost = 50;
      else coinCost = 100;
      kidAsset.countBuyEnergy += 1;
    } else {
      coinCost = 30;
      kidAsset.countBuyEnergy = 1;
    }

    if (coinCost > kidAsset.coin) throw new BadRequestException(this.i18n.t("message.NOT_ENOUGH_COIN"));

    kidAsset.coin -= coinCost;
    kidAsset.lastBuyEnergy = new Date();
    kidAsset.energy += 60;

    return kidAsset.save();
  };
}
