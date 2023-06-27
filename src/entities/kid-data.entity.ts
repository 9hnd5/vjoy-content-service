import { Optional } from "sequelize";
import { Column, DataType, HasMany, Model, Table } from "sequelize-typescript";
import { KidLesson } from "./kid-lesson.entity";

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

type KidDataCreationAttributes = Optional<
  KidDataAttributes,
  "kidId" | "gem" | "coin" | "energy" | "countBuyEnergy"
>;

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
}
