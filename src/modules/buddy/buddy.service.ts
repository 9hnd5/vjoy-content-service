import { BaseService, ROLE_ID } from "@common";
import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Buddy, BUDDY_STATUS } from "entities/buddy.entity";
import { isNil } from "lodash";
import { CreateBuddyDto } from "./dto/create-buddy.dto";
import { FindBuddiesQueryDto } from "./dto/find-buddies-query.dto";
import { UpdateBuddyDto } from "./dto/update-buddy.dto";

@Injectable()
export class BuddyService extends BaseService {
  constructor(@InjectModel(Buddy) private buddyModel: typeof Buddy) {
    super();
  }

  create(createBuddyDto: CreateBuddyDto) {
    return this.buddyModel.create(createBuddyDto);
  }

  findAll(query: FindBuddiesQueryDto) {
    const { limit, offset, sort: order } = query;
    const { status } = query.filter || {};
    return this.buddyModel.findAndCountAll({
      ...(!isNil(status) && { where: { status } }),
      limit,
      offset,
      order,
    });
  }

  async findOne(id: string) {
    const buddy = await this.buddyModel.findByPk(id);
    if (!buddy) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: id } }));

    return buddy;
  }

  async update(id: string, updateBuddyDto: UpdateBuddyDto) {
    const buddy = await this.buddyModel.findByPk(id);
    if (!buddy) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: id } }));

    buddy.set(updateBuddyDto);
    return buddy.save();
  }

  async remove(id: string, hardDelete = false) {
    const buddy = await this.buddyModel.findByPk(id);
    if (!buddy) throw new NotFoundException(this.i18n.t("message.NOT_FOUND", { args: { data: id } }));
    if (hardDelete) {
      const signinUser = this.request.user!;
      if (signinUser.roleId !== ROLE_ID.ADMIN)
        throw new UnauthorizedException(this.i18n.t("message.NOT_PERMISSION"));
      return buddy.destroy();
    }
    return (await buddy.update({ status: BUDDY_STATUS.HIDE })).dataValues;
  }
}
