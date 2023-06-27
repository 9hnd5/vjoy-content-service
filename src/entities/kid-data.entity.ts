import { Optional } from "sequelize";
import { AfterFind, BeforeFind, BeforeUpdate, Column, DataType, HasMany, Model, Table } from "sequelize-typescript";
import { KidLesson } from "./kid-lesson.entity";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";

export const COST_COIN = {
  FIRST_TIME: 30,
  SECOND_TIME: 50,
  THIRTH_TIME: 100,
};

export const ENERGY_BUY_WITH_COIN = 60;

export const MAX_ENERGY = 120;

export const ENERGY_PER_MINUTE = 1 / 5;

type KidDataAttributes = {
  kidId: number;
  gem: number;
  coin: number;
  energy: number;
  countBuyEnergy: number;
  currentLevelId?: string;
  currentUnitId?: string;
  buddyId?: string;
  learningGoal?: LearningGoal;
  lastUpdatedEnergy?: Date;
  lastBoughtEnergy?: Date;
};

export type LearningGoal = {
  d?: number;
  w?: number[];
};

type KidDataCreationAttributes = Optional<KidDataAttributes, "kidId" | "gem" | "coin" | "energy" | "countBuyEnergy">;

@Table({ tableName: "kid_data", schema: "content", version: true, timestamps: false })
export class KidData extends Model<KidDataAttributes, KidDataCreationAttributes> {
  @Column({ primaryKey: true })
  kidId: number; //kidId

  @Column({ allowNull: false, defaultValue: 0 })
  gem: number;

  @Column({ allowNull: false, defaultValue: 0 })
  coin: number;

  @Column({ allowNull: false, defaultValue: 120 })
  energy: number;

  @Column({ allowNull: false, defaultValue: 0 })
  countBuyEnergy: number;

  @Column
  currentLevelId?: string;

  @Column
  currentUnitId?: string;

  @Column({ type: DataType.STRING(255) })
  buddyId?: string;

  @Column(DataType.JSONB)
  learningGoal?: LearningGoal;

  @Column({ type: "timestamp", defaultValue: new Date() })
  lastUpdatedEnergy?: Date;

  @Column("timestamp")
  lastBoughtEnergy?: Date;

  @HasMany(() => KidLesson, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  kidLessons: KidLesson[];

  @AfterFind
  static calculateEnergy(instance: KidData) {
    if (instance) {
      const minutes = dayjs(new Date()).diff(instance?.lastUpdatedEnergy, "minutes");
      if (minutes >= 5) {
        const newEnergy = minutes * ENERGY_PER_MINUTE + instance.energy;
        instance.energy = Math.floor(newEnergy >= MAX_ENERGY ? MAX_ENERGY : newEnergy);
        instance.lastUpdatedEnergy = new Date();
        instance.save();
      }
    }
  }
}
