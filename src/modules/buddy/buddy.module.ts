import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Buddy } from "entities/buddy.entity";
import { BuddyController } from "./buddy.controller";
import { BuddyService } from "./buddy.service";

@Module({
  imports: [SequelizeModule.forFeature([Buddy])],
  controllers: [BuddyController],
  providers: [BuddyService],
})
export class BuddyModule {}
